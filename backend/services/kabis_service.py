"""
KABİS (Karayolu Bilgi Sistemi) Integration Service
T.C. Ulaştırma ve Altyapı Bakanlığı - Araç Kiralama Bildirimi

KABİS Hakkında:
- Araç kiralama şirketleri kiralama işlemlerini KABİS'e bildirmekle yükümlüdür
- Bildirim kiralama başlangıcından itibaren 24 saat içinde yapılmalıdır
- TURSAB (Türkiye Seyahat Acentaları Birliği) üyeliği gerekli olabilir

API Erişimi İçin:
1. https://kabis.uab.gov.tr adresine gidin
2. "Araç Kiralama Firması" olarak kayıt olun
3. API erişim bilgilerinizi alın
4. Ayarlar > Entegrasyonlar > KABİS bölümünden bilgileri girin
"""
import httpx
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from uuid import uuid4
import os

logger = logging.getLogger(__name__)

class KabisService:
    """
    KABİS Araç Kiralama Bildirimi Servisi
    
    Required credentials:
    - api_key: KABİS API anahtarı
    - firma_kodu: KABİS firma kodu
    - api_url: KABİS API URL
    """
    
    def __init__(self, api_key: str = None, firma_kodu: str = None, api_url: str = None):
        self.api_key = api_key or os.environ.get('KABIS_API_KEY', '')
        self.firma_kodu = firma_kodu or os.environ.get('KABIS_FIRMA_KODU', '')
        self.api_url = api_url or os.environ.get('KABIS_API_URL', 'https://api.kabis.uab.gov.tr/v1')
        self.is_configured = bool(self.api_key and self.firma_kodu)
    
    async def create_rental_notification(self, rental_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Kiralama bildirimi oluştur
        
        Required fields:
        - vehicle_plate: Araç plakası
        - customer_tc: Müşteri T.C. Kimlik No
        - customer_name: Müşteri adı soyadı
        - customer_phone: Müşteri telefonu
        - rental_start: Kiralama başlangıç tarihi
        - rental_end: Kiralama bitiş tarihi
        - pickup_location: Alış lokasyonu
        - dropoff_location: İade lokasyonu
        """
        
        # Validate required fields
        required_fields = ['vehicle_plate', 'customer_tc', 'customer_name', 
                          'rental_start', 'rental_end']
        missing = [f for f in required_fields if not rental_data.get(f)]
        if missing:
            return {
                'success': False,
                'error': f'Eksik alanlar: {', '.join(missing)}'
            }
        
        # Validate TC Kimlik No (11 digits)
        tc = str(rental_data.get('customer_tc', ''))
        if len(tc) != 11 or not tc.isdigit():
            return {
                'success': False,
                'error': 'Geçersiz T.C. Kimlik No (11 haneli olmalı)'
            }
        
        notification_id = str(uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        if not self.is_configured:
            # Mock response for unconfigured API
            return {
                'success': True,
                'notification_id': notification_id,
                'status': 'pending_api',
                'message': 'Bildirim kaydedildi (KABİS API yapılandırılmamış - manuel bildirim gerekli)',
                'source': 'local',
                'created_at': now,
                'data': rental_data
            }
        
        try:
            # KABİS API call
            async with httpx.AsyncClient(timeout=30) as client:
                headers = {
                    'Authorization': f'Bearer {self.api_key}',
                    'X-Firma-Kodu': self.firma_kodu,
                    'Content-Type': 'application/json'
                }
                
                payload = {
                    'plaka': rental_data['vehicle_plate'],
                    'kiraci_tc': rental_data['customer_tc'],
                    'kiraci_ad_soyad': rental_data['customer_name'],
                    'kiraci_telefon': rental_data.get('customer_phone', ''),
                    'kiralama_baslangic': rental_data['rental_start'],
                    'kiralama_bitis': rental_data['rental_end'],
                    'alis_lokasyon': rental_data.get('pickup_location', ''),
                    'iade_lokasyon': rental_data.get('dropoff_location', ''),
                    'firma_kodu': self.firma_kodu
                }
                
                response = await client.post(
                    f'{self.api_url}/bildirim',
                    headers=headers,
                    json=payload
                )
                
                if response.status_code in [200, 201]:
                    result = response.json()
                    return {
                        'success': True,
                        'notification_id': result.get('bildirim_no', notification_id),
                        'status': 'submitted',
                        'message': 'Bildirim KABIS sistemine basariyla gonderildi',
                        'source': 'kabis_api',
                        'kabis_response': result,
                        'created_at': now
                    }
                else:
                    logger.error(f'KABİS API error: {response.status_code} - {response.text}')
                    return {
                        'success': False,
                        'error': f'KABİS API hatası: {response.status_code}',
                        'details': response.text
                    }
                    
        except Exception as e:
            logger.error(f'KABİS connection error: {str(e)}')
            return {
                'success': False,
                'error': f'Bağlantı hatası: {str(e)}'
            }
    
    async def cancel_notification(self, notification_id: str, reason: str = '') -> Dict[str, Any]:
        """
        Kiralama bildirimini iptal et
        """
        if not self.is_configured:
            return {
                'success': True,
                'notification_id': notification_id,
                'status': 'cancelled_local',
                'message': 'Bildirim yerel olarak iptal edildi (KABİS API yapılandırılmamış)'
            }
        
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                headers = {
                    'Authorization': f'Bearer {self.api_key}',
                    'X-Firma-Kodu': self.firma_kodu
                }
                
                response = await client.delete(
                    f'{self.api_url}/bildirim/{notification_id}',
                    headers=headers,
                    params={'iptal_nedeni': reason}
                )
                
                return {
                    'success': response.status_code in [200, 204],
                    'notification_id': notification_id,
                    'status': 'cancelled' if response.status_code in [200, 204] else 'error'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def get_notification_status(self, notification_id: str) -> Dict[str, Any]:
        """
        Bildirim durumunu sorgula
        """
        if not self.is_configured:
            return {
                'success': True,
                'notification_id': notification_id,
                'status': 'unknown',
                'message': 'KABİS API yapılandırılmamış'
            }
        
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                headers = {
                    'Authorization': f'Bearer {self.api_key}',
                    'X-Firma-Kodu': self.firma_kodu
                }
                
                response = await client.get(
                    f'{self.api_url}/bildirim/{notification_id}',
                    headers=headers
                )
                
                if response.status_code == 200:
                    return {
                        'success': True,
                        **response.json()
                    }
                    
        except Exception as e:
            logger.error(f'KABİS status error: {str(e)}')
        
        return {'success': False, 'error': 'Durum sorgulanamadı'}
    
    async def test_connection(self) -> Dict[str, Any]:
        """
        API bağlantısını test et
        """
        if not self.is_configured:
            return {
                'success': False,
                'configured': False,
                'message': 'KABİS API bilgileri yapılandırılmamış',
                'help': 'Ayarlar > Entegrasyonlar > KABİS bölümünden API bilgilerini girin'
            }
        
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                headers = {
                    'Authorization': f'Bearer {self.api_key}',
                    'X-Firma-Kodu': self.firma_kodu
                }
                
                response = await client.get(
                    f'{self.api_url}/ping',
                    headers=headers
                )
                
                return {
                    'success': response.status_code == 200,
                    'configured': True,
                    'status_code': response.status_code
                }
                
        except Exception as e:
            return {
                'success': False,
                'configured': True,
                'error': str(e)
            }
    
    @staticmethod
    def get_setup_info() -> Dict[str, Any]:
        """
        KABİS kurulum bilgisi
        """
        return {
            'title': 'KABİS (Karayolu Bilgi Sistemi)',
            'description': 'T.C. Ulaştırma ve Altyapı Bakanlığı araç kiralama bildirimi sistemi',
            'required_for': 'Türkiye\'de faaliyet gösteren tüm araç kiralama firmaları',
            'registration_steps': [
                '1. https://kabis.uab.gov.tr adresine gidin',
                '2. "Yeni Kayıt" butonuna tıklayın',
                '3. "Araç Kiralama Firması" seçeneğini seçin',
                '4. Firma bilgilerinizi (Vergi No, Ticaret Sicil No) girin',
                '5. Yetkili kişi bilgilerini girin',
                '6. E-posta doğrulaması yapın',
                '7. Başvuru onaylandıktan sonra API erişim bilgilerinizi alın'
            ],
            'required_documents': [
                'Vergi Levhası',
                'Ticaret Sicil Gazetesi',
                'İmza Sirküleri',
                'Araç Kiralama Yetki Belgesi (B2)'
            ],
            'api_fields': [
                {'name': 'api_key', 'label': 'API Anahtarı', 'type': 'password'},
                {'name': 'firma_kodu', 'label': 'Firma Kodu', 'type': 'text'},
                {'name': 'api_url', 'label': 'API URL', 'type': 'text', 'default': 'https://api.kabis.uab.gov.tr/v1'}
            ],
            'links': {
                'portal': 'https://kabis.uab.gov.tr',
                'documentation': 'https://kabis.uab.gov.tr/api-dokumantasyon',
                'support': 'https://kabis.uab.gov.tr/destek'
            }
        }


# Singleton instance
kabis_service = KabisService()
