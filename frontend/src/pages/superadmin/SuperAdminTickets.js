import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
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
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Send,
  User,
  Building2,
  Filter,
  Inbox,
  MessageCircle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  open: { label: 'Açık', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Inbox },
  in_progress: { label: 'İşlemde', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  waiting_customer: { label: 'Yanıt Bekleniyor', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: MessageCircle },
  resolved: { label: 'Çözüldü', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  closed: { label: 'Kapandı', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: XCircle }
};

const PRIORITY_CONFIG = {
  low: { label: 'Düşük', color: 'bg-slate-500/20 text-slate-400' },
  medium: { label: 'Orta', color: 'bg-blue-500/20 text-blue-400' },
  high: { label: 'Yüksek', color: 'bg-orange-500/20 text-orange-400' },
  urgent: { label: 'Acil', color: 'bg-red-500/20 text-red-400' }
};

const CATEGORY_LABELS = {
  technical: 'Teknik',
  billing: 'Fatura',
  feature_request: 'Özellik Talebi',
  bug_report: 'Hata Bildirimi',
  general: 'Genel',
  account: 'Hesap'
};

export const SuperAdminTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/api/superadmin/tickets?limit=100`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (priorityFilter !== 'all') url += `&priority=${priorityFilter}`;
      
      const response = await axios.get(url);
      setTickets(response.data.tickets || []);
      setStats(response.data.stats || {});
    } catch (error) {
      toast.error('Ticketlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = async (ticket) => {
    try {
      const response = await axios.get(`${API_URL}/api/support/tickets/${ticket.id}`);
      setSelectedTicket(response.data);
      setIsDetailOpen(true);
    } catch (error) {
      toast.error('Ticket detayı yüklenemedi');
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    
    try {
      await axios.post(`${API_URL}/api/support/tickets/${selectedTicket.id}/reply`, {
        message: replyText
      });
      toast.success('Yanıt gönderildi');
      setReplyText('');
      // Refresh ticket
      const response = await axios.get(`${API_URL}/api/support/tickets/${selectedTicket.id}`);
      setSelectedTicket(response.data);
      fetchTickets();
    } catch (error) {
      toast.error('Yanıt gönderilemedi');
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await axios.patch(`${API_URL}/api/superadmin/tickets/${ticketId}/status?status=${newStatus}`);
      toast.success('Durum güncellendi');
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      fetchTickets();
    } catch (error) {
      toast.error('Durum güncellenemedi');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('tr-TR');
  };

  const getTimeSince = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // minutes
    if (diff < 60) return `${diff} dk önce`;
    if (diff < 1440) return `${Math.floor(diff / 60)} saat önce`;
    return `${Math.floor(diff / 1440)} gün önce`;
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
          <h1 className="text-3xl font-bold text-white">Destek Talepleri</h1>
          <p className="text-slate-400">Müşteri destek taleplerini yönetin</p>
        </div>
        <Button onClick={fetchTickets} variant="outline" className="border-slate-600 text-slate-300">
          <RefreshCw className="h-4 w-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <Card key={key} className="bg-slate-800/50 border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors"
                  onClick={() => setStatusFilter(key)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">{config.label}</p>
                    <p className="text-2xl font-bold text-white">{stats[key] || 0}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${config.color.includes('blue') ? 'text-blue-500' : config.color.includes('yellow') ? 'text-yellow-500' : config.color.includes('green') ? 'text-green-500' : config.color.includes('purple') ? 'text-purple-500' : 'text-slate-500'}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <Filter className="h-5 w-5 text-slate-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px] bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Öncelik" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">Tüm Öncelikler</SelectItem>
                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(statusFilter !== 'all' || priorityFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); }}
                      className="text-slate-400 hover:text-white">
                Filtreleri Temizle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Henüz destek talebi yok</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-transparent">
                  <TableHead className="text-slate-400">Ticket</TableHead>
                  <TableHead className="text-slate-400">Firma</TableHead>
                  <TableHead className="text-slate-400">Konu</TableHead>
                  <TableHead className="text-slate-400">Kategori</TableHead>
                  <TableHead className="text-slate-400">Öncelik</TableHead>
                  <TableHead className="text-slate-400">Durum</TableHead>
                  <TableHead className="text-slate-400">Güncelleme</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                  const priorityConfig = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
                  
                  return (
                    <TableRow key={ticket.id} 
                              className="border-slate-700 hover:bg-slate-700/50 cursor-pointer"
                              onClick={() => handleViewTicket(ticket)}>
                      <TableCell>
                        <span className="font-mono text-sm text-purple-400">{ticket.ticket_number}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-500" />
                          <span className="text-white">{ticket.company_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-white">{ticket.subject}</div>
                        <div className="text-xs text-slate-500">{ticket.created_by_email}</div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {CATEGORY_LABELS[ticket.category] || ticket.category}
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityConfig.color}>{priorityConfig.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig.color}>{statusConfig.label}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {getTimeSince(ticket.updated_at)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div>
                <span className="font-mono text-purple-400">{selectedTicket?.ticket_number}</span>
                <span className="ml-3 text-slate-300">{selectedTicket?.subject}</span>
              </div>
              <Select value={selectedTicket?.status} onValueChange={(v) => handleStatusChange(selectedTicket?.id, v)}>
                <SelectTrigger className="w-[150px] bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Ticket Info */}
              <div className="flex gap-4 text-sm text-slate-400 mb-4 pb-4 border-b border-slate-700">
                <div><Building2 className="h-4 w-4 inline mr-1" />{selectedTicket.company_name}</div>
                <div><User className="h-4 w-4 inline mr-1" />{selectedTicket.created_by_name}</div>
                <div><Clock className="h-4 w-4 inline mr-1" />{formatDate(selectedTicket.created_at)}</div>
                <Badge className={PRIORITY_CONFIG[selectedTicket.priority]?.color}>
                  {PRIORITY_CONFIG[selectedTicket.priority]?.label}
                </Badge>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2" style={{ maxHeight: '400px' }}>
                {selectedTicket.messages?.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_type === 'support' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 ${msg.sender_type === 'support' ? 'bg-purple-600/30 border border-purple-500/30' : 'bg-slate-700'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-sm font-medium ${msg.sender_type === 'support' ? 'text-purple-300' : 'text-slate-300'}`}>
                          {msg.sender_name}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(msg.created_at)}</span>
                      </div>
                      <p className="text-white whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              {selectedTicket.status !== 'closed' && (
                <div className="flex gap-2 pt-4 border-t border-slate-700">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Yanıtınızı yazın..."
                    className="bg-slate-700 border-slate-600 text-white resize-none"
                    rows={2}
                  />
                  <Button onClick={handleReply} className="bg-purple-600 hover:bg-purple-700 self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminTickets;
