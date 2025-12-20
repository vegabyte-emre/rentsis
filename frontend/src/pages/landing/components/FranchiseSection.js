import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Store, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Car, 
  Briefcase, 
  DollarSign, 
  Send, 
  CheckCircle,
  TrendingUp,
  Users,
  Award,
  Handshake
} from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import axios from 'axios';
import { API_URL } from '../../../config/api';

const CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Adana', 'Konya', 
  'Gaziantep', 'Mersin', 'Kayseri', 'Eskişehir', 'Diyarbakır', 'Samsun',
  'Denizli', 'Şanlıurfa', 'Malatya', 'Trabzon', 'Manisa', 'Balıkesir', 'Aydın',
  'Van', 'Kahramanmaraş', 'Sakarya', 'Kocaeli', 'Muğla', 'Hatay', 'Tekirdağ',
  'Erzurum', 'Afyonkarahisar', 'Elazığ', 'Diğer'
];

const BUDGET_OPTIONS = [
  { value: '50000-100000', label: '50.000₺ - 100.000₺' },
  { value: '100000-250000', label: '100.000₺ - 250.000₺' },
  { value: '250000-500000', label: '250.000₺ - 500.000₺' },
  { value: '500000+', label: '500.000₺ ve üzeri' }
];

export const FranchiseSection = () => {
  const { t, currentLang } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    district: '',
    address: '',
    experience_years: '',
    current_vehicle_count: '',
    has_office: false,
    investment_budget: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        experience_years: parseInt(formData.experience_years) || 0,
        current_vehicle_count: parseInt(formData.current_vehicle_count) || 0
      };
      
      const response = await axios.post(`${API_URL}/api/public/franchise/apply`, payload);
      setApplicationNumber(response.data.application_number);
      setIsSuccess(true);
    } catch (error) {
      console.error('Error submitting franchise application:', error);
      alert(error.response?.data?.detail || 'Başvuru gönderilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    { icon: TrendingUp, title: 'Yüksek Karlılık', desc: 'Araç kiralama sektöründe sürdürülebilir gelir' },
    { icon: Users, title: 'Geniş Müşteri Ağı', desc: 'Platform üzerinden potansiyel müşterilere erişim' },
    { icon: Award, title: 'Marka Gücü', desc: 'Güçlü bir marka altında iş yapma avantajı' },
    { icon: Handshake, title: 'Tam Destek', desc: 'Eğitim, yazılım ve pazarlama desteği' }
  ];

  return (
    <section id="franchise" className="py-20 md:py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
            <Store className="w-4 h-4 text-orange-500" />
            <span className="text-orange-400 text-sm font-medium">Bayilik Fırsatı</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Bayimiz Olun
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Türkiye'nin en hızlı büyüyen araç kiralama platformuna katılın. 
            Kendi işinizin patronu olun, biz yanınızda olalım.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left Side - Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-white mb-8">Neden Bayimiz Olmalısınız?</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {benefits.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:border-orange-500/30 transition-colors"
                >
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-orange-500" />
                  </div>
                  <h4 className="font-semibold text-white mb-2">{item.title}</h4>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Requirements */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
              <h4 className="font-semibold text-white mb-4">Bayi Gereksinimleri</h4>
              <ul className="space-y-3">
                {[
                  'Sektörde en az 1 yıl deneyim',
                  'Minimum 5 araçlık filo',
                  'Ticari ofis veya işyeri',
                  'Yatırım sermayesi',
                  'Müşteri odaklı hizmet anlayışı'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Right Side - Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {isSuccess ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-10 text-center">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Başvurunuz Alındı!</h3>
                <p className="text-slate-400 mb-4">
                  En kısa sürede sizinle iletişime geçeceğiz.
                </p>
                <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
                  <p className="text-slate-400 text-sm mb-1">Başvuru Numaranız</p>
                  <p className="text-2xl font-mono font-bold text-orange-400">{applicationNumber}</p>
                </div>
                <p className="text-slate-500 text-sm">
                  Bu numarayı saklayın. Başvuru durumunuzu sorgulamak için kullanabilirsiniz.
                </p>
                <Button
                  onClick={() => {
                    setIsSuccess(false);
                    setFormData({
                      full_name: '', email: '', phone: '', city: '', district: '',
                      address: '', experience_years: '', current_vehicle_count: '',
                      has_office: false, investment_budget: '', message: ''
                    });
                  }}
                  className="mt-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8"
                >
                  Yeni Başvuru
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">Bayilik Başvuru Formu</h3>
                
                <div className="space-y-5">
                  {/* Name & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300 mb-2 block">Ad Soyad *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <Input
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          required
                          className="pl-10 h-12 bg-slate-700/50 border-slate-600 text-white rounded-xl"
                          placeholder="Ad Soyad"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-300 mb-2 block">E-posta *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="pl-10 h-12 bg-slate-700/50 border-slate-600 text-white rounded-xl"
                          placeholder="ornek@email.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <Label className="text-slate-300 mb-2 block">Telefon *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="pl-10 h-12 bg-slate-700/50 border-slate-600 text-white rounded-xl"
                        placeholder="+90 5XX XXX XX XX"
                      />
                    </div>
                  </div>

                  {/* City & District */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300 mb-2 block">İl *</Label>
                      <Select value={formData.city} onValueChange={(val) => handleSelectChange('city', val)}>
                        <SelectTrigger className="h-12 bg-slate-700/50 border-slate-600 text-white rounded-xl">
                          <SelectValue placeholder="İl Seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {CITIES.map(city => (
                            <SelectItem key={city} value={city} className="text-white hover:bg-slate-700">
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300 mb-2 block">İlçe *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <Input
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          required
                          className="pl-10 h-12 bg-slate-700/50 border-slate-600 text-white rounded-xl"
                          placeholder="İlçe adı"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <Label className="text-slate-300 mb-2 block">Adres</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                      <Textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white rounded-xl resize-none"
                        placeholder="Açık adres (opsiyonel)"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Experience & Vehicles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300 mb-2 block">Sektör Deneyimi (Yıl) *</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <Input
                          name="experience_years"
                          type="number"
                          min="0"
                          value={formData.experience_years}
                          onChange={handleChange}
                          required
                          className="pl-10 h-12 bg-slate-700/50 border-slate-600 text-white rounded-xl"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-300 mb-2 block">Mevcut Araç Sayısı *</Label>
                      <div className="relative">
                        <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <Input
                          name="current_vehicle_count"
                          type="number"
                          min="0"
                          value={formData.current_vehicle_count}
                          onChange={handleChange}
                          required
                          className="pl-10 h-12 bg-slate-700/50 border-slate-600 text-white rounded-xl"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Has Office & Budget */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300 mb-2 block">Yatırım Bütçesi</Label>
                      <Select value={formData.investment_budget} onValueChange={(val) => handleSelectChange('investment_budget', val)}>
                        <SelectTrigger className="h-12 bg-slate-700/50 border-slate-600 text-white rounded-xl">
                          <SelectValue placeholder="Bütçe Seçin" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {BUDGET_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-slate-700">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-3 cursor-pointer mt-6">
                        <input
                          type="checkbox"
                          name="has_office"
                          checked={formData.has_office}
                          onChange={handleChange}
                          className="w-5 h-5 rounded border-slate-600 bg-slate-700/50 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-slate-300">Mevcut ofisiniz/işyeriniz var mı?</span>
                      </label>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <Label className="text-slate-300 mb-2 block">Mesajınız</Label>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className="bg-slate-700/50 border-slate-600 text-white rounded-xl resize-none"
                      placeholder="Eklemek istediğiniz bilgiler..."
                      rows={3}
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full py-6 text-lg font-semibold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02]"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Gönderiliyor...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Başvuru Gönder
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
