import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../../components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Store,
  User,
  MapPin,
  Phone,
  Mail,
  Building2,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  Send,
  Plus,
  Briefcase,
  Car,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  application: { label: 'Başvuru', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  under_review: { label: 'İnceleniyor', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  approved: { label: 'Onaylandı', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  active: { label: 'Aktif', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  suspended: { label: 'Askıda', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  terminated: { label: 'Sonlandırıldı', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
};

export const SuperAdminFranchises = () => {
  const [franchises, setFranchises] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [convertForm, setConvertForm] = useState({ domain: '', password: '' });
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    fetchFranchises();
  }, [statusFilter]);

  const fetchFranchises = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/superadmin/franchises?limit=100`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      
      const response = await axios.get(url);
      setFranchises(response.data.franchises || []);
      setStats(response.data.stats || {});
    } catch (error) {
      toast.error('Franchise verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (franchise) => {
    try {
      const response = await axios.get(`${API_URL}/api/superadmin/franchises/${franchise.id}`);
      setSelectedFranchise(response.data);
      setIsDetailOpen(true);
    } catch (error) {
      toast.error('Detaylar yüklenemedi');
    }
  };

  const handleStatusChange = async (franchiseId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/api/superadmin/franchises/${franchiseId}/status?status=${newStatus}`);
      toast.success('Durum güncellendi');
      fetchFranchises();
      if (selectedFranchise?.id === franchiseId) {
        setSelectedFranchise({ ...selectedFranchise, status: newStatus });
      }
    } catch (error) {
      toast.error('Durum güncellenemedi');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    
    try {
      await axios.post(`${API_URL}/api/superadmin/franchises/${selectedFranchise.id}/notes`, {
        content: noteText
      });
      toast.success('Not eklendi');
      setNoteText('');
      setIsNoteOpen(false);
      // Refresh
      const response = await axios.get(`${API_URL}/api/superadmin/franchises/${selectedFranchise.id}`);
      setSelectedFranchise(response.data);
    } catch (error) {
      toast.error('Not eklenemedi');
    }
  };

  const handleConvert = async () => {
    if (!convertForm.domain || !convertForm.password) {
      toast.error('Domain ve şifre gerekli');
      return;
    }
    
    try {
      const response = await axios.post(
        `${API_URL}/api/superadmin/franchises/${selectedFranchise.id}/convert-to-company?domain=${convertForm.domain}&admin_password=${convertForm.password}`
      );
      toast.success(response.data.message);
      setIsConvertOpen(false);
      setConvertForm({ domain: '', password: '' });
      fetchFranchises();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Dönüştürme başarısız');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Franchise Yönetimi</h1>
          <p className="text-slate-400">Bayilik başvurularını yönetin</p>
        </div>
        <Button onClick={fetchFranchises} variant="outline" className="border-slate-600 text-slate-300">
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-slate-800/50 border-slate-700 cursor-pointer hover:bg-slate-700/50"
              onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4 text-center">
            <Store className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stats.total || 0}</p>
            <p className="text-slate-400 text-xs">Toplam</p>
          </CardContent>
        </Card>
        {Object.entries(STATUS_CONFIG).slice(0, 5).map(([key, config]) => (
          <Card key={key} 
                className="bg-slate-800/50 border-slate-700 cursor-pointer hover:bg-slate-700/50"
                onClick={() => setStatusFilter(key)}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats[key] || 0}</p>
              <p className="text-slate-400 text-xs">{config.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px] bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Durum Filtrele" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">Tüm Başvurular</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {statusFilter !== 'all' && (
              <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')}
                      className="text-slate-400 hover:text-white">
                Filtreyi Temizle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Franchises Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          {franchises.length === 0 ? (
            <div className="text-center py-12">
              <Store className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Henüz franchise başvurusu yok</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-400">Başvuru No</TableHead>
                  <TableHead className="text-slate-400">Başvuran</TableHead>
                  <TableHead className="text-slate-400">Lokasyon</TableHead>
                  <TableHead className="text-slate-400">Deneyim</TableHead>
                  <TableHead className="text-slate-400">Durum</TableHead>
                  <TableHead className="text-slate-400">Tarih</TableHead>
                  <TableHead className="text-slate-400 text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {franchises.map((franchise) => {
                  const statusConfig = STATUS_CONFIG[franchise.status] || STATUS_CONFIG.application;
                  
                  return (
                    <TableRow key={franchise.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell>
                        <span className="font-mono text-sm text-purple-400">{franchise.application_number}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">{franchise.full_name}</div>
                          <div className="text-sm text-slate-500">{franchise.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-slate-300">
                          <MapPin className="h-4 w-4 text-slate-500" />
                          {franchise.city}, {franchise.district}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-slate-300">
                          <div>{franchise.experience_years} yıl</div>
                          <div className="text-xs text-slate-500">{franchise.current_vehicle_count} araç</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {formatDate(franchise.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem
                              className="text-blue-400 hover:bg-slate-700 cursor-pointer"
                              onClick={() => handleViewDetails(franchise)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Detaylar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            {franchise.status === 'application' && (
                              <DropdownMenuItem
                                className="text-yellow-400 hover:bg-slate-700 cursor-pointer"
                                onClick={() => handleStatusChange(franchise.id, 'under_review')}
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                İncelemeye Al
                              </DropdownMenuItem>
                            )}
                            {franchise.status === 'under_review' && (
                              <DropdownMenuItem
                                className="text-green-400 hover:bg-slate-700 cursor-pointer"
                                onClick={() => handleStatusChange(franchise.id, 'approved')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Onayla
                              </DropdownMenuItem>
                            )}
                            {franchise.status === 'approved' && (
                              <DropdownMenuItem
                                className="text-emerald-400 hover:bg-slate-700 cursor-pointer"
                                onClick={() => {
                                  setSelectedFranchise(franchise);
                                  setIsConvertOpen(true);
                                }}
                              >
                                <Building2 className="h-4 w-4 mr-2" />
                                Firmaya Dönüştür
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem
                              className="text-red-400 hover:bg-slate-700 cursor-pointer"
                              onClick={() => handleStatusChange(franchise.id, 'terminated')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reddet
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                <span className="font-mono text-purple-400 mr-2">{selectedFranchise?.application_number}</span>
                {selectedFranchise?.full_name}
              </span>
              <Badge variant="outline" className={STATUS_CONFIG[selectedFranchise?.status]?.color}>
                {STATUS_CONFIG[selectedFranchise?.status]?.label}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          {selectedFranchise && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-400">E-posta</Label>
                  <div className="flex items-center gap-2 text-white">
                    <Mail className="h-4 w-4 text-slate-500" />
                    {selectedFranchise.email}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400">Telefon</Label>
                  <div className="flex items-center gap-2 text-white">
                    <Phone className="h-4 w-4 text-slate-500" />
                    {selectedFranchise.phone}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label className="text-slate-400">Lokasyon</Label>
                <div className="flex items-center gap-2 text-white">
                  <MapPin className="h-4 w-4 text-slate-500" />
                  {selectedFranchise.city}, {selectedFranchise.district}
                  {selectedFranchise.address && ` - ${selectedFranchise.address}`}
                </div>
              </div>

              {/* Experience */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-4 text-center">
                    <Briefcase className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{selectedFranchise.experience_years}</p>
                    <p className="text-slate-400 text-xs">Yıl Deneyim</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-4 text-center">
                    <Car className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{selectedFranchise.current_vehicle_count}</p>
                    <p className="text-slate-400 text-xs">Mevcut Araç</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-4 text-center">
                    <Building2 className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">{selectedFranchise.has_office ? 'Var' : 'Yok'}</p>
                    <p className="text-slate-400 text-xs">Ofis</p>
                  </CardContent>
                </Card>
              </div>

              {/* Budget & Message */}
              {selectedFranchise.investment_budget && (
                <div className="space-y-2">
                  <Label className="text-slate-400">Yatırım Bütçesi</Label>
                  <div className="flex items-center gap-2 text-white">
                    <DollarSign className="h-4 w-4 text-slate-500" />
                    {selectedFranchise.investment_budget}
                  </div>
                </div>
              )}

              {selectedFranchise.message && (
                <div className="space-y-2">
                  <Label className="text-slate-400">Mesaj</Label>
                  <p className="text-white bg-slate-700/50 p-3 rounded-lg">{selectedFranchise.message}</p>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-400">Notlar</Label>
                  <Button size="sm" variant="ghost" className="text-purple-400" onClick={() => setIsNoteOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Not Ekle
                  </Button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {selectedFranchise.notes?.length === 0 && (
                    <p className="text-slate-500 text-sm">Henüz not yok</p>
                  )}
                  {selectedFranchise.notes?.map((note) => (
                    <div key={note.id} className="bg-slate-700/50 p-3 rounded-lg text-sm">
                      <div className="flex justify-between text-slate-400 text-xs mb-1">
                        <span>{note.by}</span>
                        <span>{formatDate(note.created_at)}</span>
                      </div>
                      {note.type === 'status_change' ? (
                        <p className="text-yellow-400">
                          Durum değişikliği: {STATUS_CONFIG[note.old_status]?.label} → {STATUS_CONFIG[note.new_status]?.label}
                        </p>
                      ) : (
                        <p className="text-white">{note.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-slate-700">
                {selectedFranchise.status === 'approved' && (
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setIsConvertOpen(true)}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Firmaya Dönüştür
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsDetailOpen(false)} className="border-slate-600">
                  Kapat
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Convert to Company Dialog */}
      <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Firmaya Dönüştür</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedFranchise?.full_name} için yeni firma oluşturun
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Domain (subdomain)</Label>
              <Input
                value={convertForm.domain}
                onChange={(e) => setConvertForm({...convertForm, domain: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="ornekfirma.com veya ornekfirma"
              />
            </div>
            <div>
              <Label className="text-slate-300">Admin Şifresi</Label>
              <Input
                type="password"
                value={convertForm.password}
                onChange={(e) => setConvertForm({...convertForm, password: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Güçlü bir şifre"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertOpen(false)} className="border-slate-600">
              İptal
            </Button>
            <Button onClick={handleConvert} className="bg-emerald-600 hover:bg-emerald-700">
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Not Ekle</DialogTitle>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
            placeholder="Notunuzu yazın..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteOpen(false)} className="border-slate-600">
              İptal
            </Button>
            <Button onClick={handleAddNote} className="bg-purple-600 hover:bg-purple-700">
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminFranchises;
