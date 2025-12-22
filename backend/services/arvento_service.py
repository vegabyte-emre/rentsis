"""
Arvento GPS Integration Service
Arvento API documentation: https://www.arvento.com/api
"""
import httpx
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
import os

logger = logging.getLogger(__name__)

class ArventoService:
    """
    Arvento GPS Tracking Integration
    
    Required credentials (stored in company settings):
    - api_key: Arvento API anahtarı
    - company_code: Arvento firma kodu
    - api_url: Arvento API URL (default: https://api.arvento.com)
    """
    
    def __init__(self, api_key: str = None, company_code: str = None, api_url: str = None):
        self.api_key = api_key or os.environ.get('ARVENTO_API_KEY', '')
        self.company_code = company_code or os.environ.get('ARVENTO_COMPANY_CODE', '')
        self.api_url = api_url or os.environ.get('ARVENTO_API_URL', 'https://api.arvento.com/v1')
        self.is_configured = bool(self.api_key and self.company_code)
    
    async def get_all_vehicles(self) -> Dict[str, Any]:
        """
        Tüm araçların anlık konumlarını al
        """
        if not self.is_configured:
            return self._mock_vehicles()
        
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                headers = {
                    'Authorization': f'Bearer {self.api_key}',
                    'X-Company-Code': self.company_code,
                    'Content-Type': 'application/json'
                }
                
                response = await client.get(
                    f'{self.api_url}/vehicles/positions',
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        'success': True,
                        'vehicles': self._transform_arvento_data(data),
                        'source': 'arvento_api'
                    }
                else:
                    logger.error(f'Arvento API error: {response.status_code}')
                    return self._mock_vehicles()
                    
        except Exception as e:
            logger.error(f'Arvento connection error: {str(e)}')
            return self._mock_vehicles()
    
    async def get_vehicle_history(self, plate: str, start_date: str, end_date: str) -> Dict[str, Any]:
        """
        Araç geçmiş rota bilgisi
        """
        if not self.is_configured:
            return {'success': True, 'history': [], 'source': 'mock', 'message': 'API yapılandırılmamış'}
        
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                headers = {
                    'Authorization': f'Bearer {self.api_key}',
                    'X-Company-Code': self.company_code
                }
                
                response = await client.get(
                    f'{self.api_url}/vehicles/{plate}/history',
                    headers=headers,
                    params={'start': start_date, 'end': end_date}
                )
                
                if response.status_code == 200:
                    return {
                        'success': True,
                        'history': response.json(),
                        'source': 'arvento_api'
                    }
                    
        except Exception as e:
            logger.error(f'Arvento history error: {str(e)}')
        
        return {'success': False, 'history': [], 'error': 'Geçmiş alınamadı'}
    
    def _transform_arvento_data(self, data: List[Dict]) -> List[Dict]:
        """
        Arvento verisini standart formata dönüştür
        """
        vehicles = []
        for item in data:
            vehicles.append({
                'vehicle_id': item.get('deviceId'),
                'plate': item.get('plate'),
                'lat': item.get('latitude'),
                'lng': item.get('longitude'),
                'speed': item.get('speed', 0),
                'heading': item.get('heading', 0),
                'ignition': item.get('ignition', False),
                'last_update': item.get('timestamp'),
                'address': item.get('address', ''),
                'driver': item.get('driverName', '')
            })
        return vehicles
    
    def _mock_vehicles(self) -> Dict[str, Any]:
        """
        Test için mock veri
        """
        return {
            'success': True,
            'source': 'mock',
            'message': 'Arvento API yapılandırılmamış - Test verisi gösteriliyor',
            'vehicles': [
                {
                    'vehicle_id': 'mock-1',
                    'plate': '34 ABC 123',
                    'lat': 41.0082,
                    'lng': 28.9784,
                    'speed': 45,
                    'heading': 90,
                    'ignition': True,
                    'last_update': datetime.now(timezone.utc).isoformat(),
                    'address': 'Taksim, İstanbul',
                    'driver': 'Ahmet Yılmaz'
                },
                {
                    'vehicle_id': 'mock-2',
                    'plate': '34 DEF 456',
                    'lat': 41.0422,
                    'lng': 29.0083,
                    'speed': 0,
                    'heading': 0,
                    'ignition': False,
                    'last_update': datetime.now(timezone.utc).isoformat(),
                    'address': 'Kadıköy, İstanbul',
                    'driver': 'Mehmet Demir'
                },
                {
                    'vehicle_id': 'mock-3',
                    'plate': '34 GHI 789',
                    'lat': 40.9923,
                    'lng': 29.0242,
                    'speed': 72,
                    'heading': 180,
                    'ignition': True,
                    'last_update': datetime.now(timezone.utc).isoformat(),
                    'address': 'Maltepe, İstanbul',
                    'driver': 'Ali Kaya'
                }
            ]
        }
    
    async def test_connection(self) -> Dict[str, Any]:
        """
        API bağlantısını test et
        """
        if not self.is_configured:
            return {
                'success': False,
                'configured': False,
                'message': 'Arvento API bilgileri yapılandırılmamış'
            }
        
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                headers = {
                    'Authorization': f'Bearer {self.api_key}',
                    'X-Company-Code': self.company_code
                }
                
                response = await client.get(
                    f'{self.api_url}/ping',
                    headers=headers
                )
                
                return {
                    'success': response.status_code == 200,
                    'configured': True,
                    'status_code': response.status_code,
                    'message': 'Bağlantı başarılı' if response.status_code == 200 else 'Bağlantı hatası'
                }
                
        except Exception as e:
            return {
                'success': False,
                'configured': True,
                'error': str(e),
                'message': 'Bağlantı kurulamadı'
            }


# Singleton instance
arvento_service = ArventoService()
