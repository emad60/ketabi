import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Package, Clock, CheckCircle, XCircle, Eye, FileText } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface RequestItem {
  id: number;
  book?: number;
  book_title?: string;
  quantity: number;
  grade: string;
  subject: string;
  approved_quantity?: number;
}

interface ProvinceRequest {
  id: number;
  request_number: string;
  province_name?: string;
  created_by_name?: string;
  created_at: string;
  status: string;
  notes?: string;
  rejection_reason?: string;
  items: RequestItem[];
}

export function MinistryProvinceRequestsPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ProvinceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ProvinceRequest | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/book-requests/province/');
      console.log('API Response:', response.data);
      
      // Handle paginated response format from DRF
      const data = response.data.results || response.data;
      console.log('Setting requests:', Array.isArray(data) ? data.length : 0, 'items');
      setRequests(Array.isArray(data) ? data : []);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]); // تعيين array فارغ في حالة الخطأ
      setLoading(false);
    }
  };

  const handleViewDetails = (request: ProvinceRequest) => {
    setSelectedRequest(request);
    setIsDetailDialogOpen(true);
  };

  const handleAction = (request: ProvinceRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setActionNotes('');
    setIsActionDialogOpen(true);
  };

  const submitAction = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      
      const payload = {
        action: actionType,
        rejection_reason: actionType === 'reject' ? actionNotes : undefined,
      };
      
      await api.post(`/book-requests/province/${selectedRequest.id}/approve-reject/`, payload);
      
      alert(`تم ${actionType === 'approve' ? 'الموافقة على' : 'رفض'} الطلب بنجاح`);
      setIsActionDialogOpen(false);
      setActionNotes('');
      setSelectedRequest(null);
      
      // Reload requests
      fetchRequests();
      
    } catch (error: any) {
      console.error('Error processing action:', error);
      alert(error.response?.data?.detail || 'حدث خطأ أثناء معالجة الطلب');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'fulfilled':
        return <Package className="w-5 h-5 text-blue-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'قيد الانتظار',
      approved: 'تمت الموافقة',
      rejected: 'مرفوض',
      fulfilled: 'تم التنفيذ',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'fulfilled':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredRequests = filterStatus === 'all' 
    ? requests 
    : requests.filter(r => r.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">طلبات المحافظات</h2>
          <p className="text-sm text-gray-600 mt-1">عرض وإدارة جميع طلبات الكتب من المحافظات</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="تصفية حسب الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الطلبات</SelectItem>
            <SelectItem value="pending">قيد الانتظار</SelectItem>
            <SelectItem value="approved">تمت الموافقة</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
            <SelectItem value="fulfilled">تم التنفيذ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">إجمالي الطلبات</p>
                <p className="text-3xl font-bold">{requests.length}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">قيد الانتظار</p>
                <p className="text-3xl font-bold">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">تمت الموافقة</p>
                <p className="text-3xl font-bold">
                  {requests.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">مرفوض</p>
                <p className="text-3xl font-bold">
                  {requests.filter(r => r.status === 'rejected').length}
                </p>
              </div>
              <div className="bg-red-500 p-3 rounded-lg">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الطلب</TableHead>
                <TableHead className="text-right">المحافظة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">عدد الكتب</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.request_number}</TableCell>
                  <TableCell>{request.province_name}</TableCell>
                  <TableCell>{request.created_at}</TableCell>
                  <TableCell>{request.items.reduce((sum, item) => sum + item.quantity, 0)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(request)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleAction(request, 'approve')}
                          >
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(request, 'reject')}
                          >
                            رفض
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب</DialogTitle>
            <DialogDescription>
              {selectedRequest?.request_number} - {selectedRequest?.province_name}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">التاريخ</p>
                  <p className="font-medium">{selectedRequest.created_at}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الحالة</p>
                  <p className="font-medium">{getStatusText(selectedRequest.status)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">إجمالي الكتب</p>
                  <p className="font-medium">{selectedRequest.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">عدد الأصناف</p>
                  <p className="font-medium">{selectedRequest.items.length}</p>
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">ملاحظات</p>
                  <p>{selectedRequest.notes}</p>
                </div>
              )}

              {selectedRequest.items.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">الكتب المطلوبة</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">اسم الكتاب</TableHead>
                        <TableHead className="text-right">المادة</TableHead>
                        <TableHead className="text-right">الصف</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRequest.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.book_title}</TableCell>
                          <TableCell>{item.subject}</TableCell>
                          <TableCell>{item.grade}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'الموافقة على الطلب' : 'رفض الطلب'}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.request_number} - {selectedRequest?.province_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="action-notes">
                ملاحظات {actionType === 'reject' && '(مطلوبة)'}
              </Label>
              <Textarea
                id="action-notes"
                className="min-h-[100px]"
                placeholder={`أدخل ملاحظات ${actionType === 'approve' ? 'الموافقة' : 'الرفض'}...`}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsActionDialogOpen(false);
                setActionNotes('');
              }}
            >
              إلغاء
            </Button>
            <Button
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              onClick={submitAction}
              disabled={processing || (actionType === 'reject' && !actionNotes)}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  جارِ المعالجة...
                </>
              ) : (
                actionType === 'approve' ? 'تأكيد الموافقة' : 'تأكيد الرفض'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
