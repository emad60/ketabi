import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  School, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock,
  Package,
  AlertTriangle,
  Truck
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { CreateSchoolShipmentDialog } from './CreateSchoolShipmentDialog';

interface SchoolRequest {
  id: number;
  school: {
    id: number;
    name: string;
    district: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
  items: {
    id: number;
    book: {
      id: number;
      title: string;
      subject_display: string;
      grade_display: string;
    };
    quantity: number;
  }[];
}

export function ProvinceSchoolRequestsPage() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<SchoolRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SchoolRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showShipmentDialog, setShowShipmentDialog] = useState(false);
  const [selectedRequestForShipment, setSelectedRequestForShipment] = useState<SchoolRequest | null>(null);

  useEffect(() => {
    if (user) {
      fetchRequests();
    } else {
      // If not authenticated, don't attempt the protected API call
      setLoading(false);
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/school-requests/', {
        params: {
          status: 'submitted' // فقط الطلبات المرسلة
        }
      });
      
      const data = response.data.results || response.data;
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching school requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request: SchoolRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  const handleAction = (request: SchoolRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setActionNotes('');
    setShowDetailsDialog(false);
    setShowActionDialog(true);
  };

  const handleCreateShipment = (request: SchoolRequest) => {
    setSelectedRequestForShipment(request);
    setShowShipmentDialog(true);
  };

  const handleShipmentSuccess = () => {
    fetchRequests(); // Refresh the list
    setShowShipmentDialog(false);
    setSelectedRequestForShipment(null);
  };

  const confirmAction = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      
      if (actionType === 'approve') {
        // استخدام endpoint الموافقة
        await api.post(`/school-requests/${selectedRequest.id}/approve/`);
      } else {
        // استخدام endpoint الرفض
        await api.post(`/school-requests/${selectedRequest.id}/reject/`, {
          reason: actionNotes
        });
      }

      // Refresh list
      await fetchRequests();
      
      setShowActionDialog(false);
      setSelectedRequest(null);
      alert(actionType === 'approve' ? 'تم قبول الطلب بنجاح' : 'تم رفض الطلب');
    } catch (error) {
      console.error('Error processing request:', error);
      alert('حدث خطأ في معالجة الطلب');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      draft: { label: 'مسودة', variant: 'secondary' },
      submitted: { label: 'مرسل', variant: 'default' },
      approved: { label: 'مقبول', variant: 'success' },
      rejected: { label: 'مرفوض', variant: 'destructive' },
      fulfilled: { label: 'تم التوريد', variant: 'success' },
      cancelled: { label: 'ملغى', variant: 'secondary' }
    };

    const config = statusConfig[status] || { label: status, variant: 'default' };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

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
          <h1 className="text-3xl font-bold">طلبات المدارس</h1>
          <p className="text-gray-600 mt-1">مراجعة وإدارة طلبات الكتب من المدارس</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الطلبات الجديدة</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.status === 'submitted').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المقبولة</p>
                <p className="text-2xl font-bold text-green-600">
                  {requests.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المرفوضة</p>
                <p className="text-2xl font-bold text-red-600">
                  {requests.filter(r => r.status === 'rejected').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة طلبات المدارس</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <School className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>لا توجد طلبات حالياً</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الطلب</TableHead>
                  <TableHead className="text-right">اسم المدرسة</TableHead>
                  <TableHead className="text-right">المنطقة</TableHead>
                  <TableHead className="text-right">عدد الكتب</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">تاريخ الطلب</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">#{request.id}</TableCell>
                    <TableCell>{request.school.name}</TableCell>
                    <TableCell>{request.school.district}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {(request.items || []).reduce((sum, item) => sum + (item?.quantity || 0), 0)} كتاب
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {new Date(request.created_at).toLocaleDateString('ar-IQ')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(request)}
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          عرض
                        </Button>
                        {request.status === 'submitted' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAction(request, 'approve')}
                            >
                              <CheckCircle className="w-4 h-4 ml-1" />
                              قبول
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleAction(request, 'reject')}
                            >
                              <XCircle className="w-4 h-4 ml-1" />
                              رفض
                            </Button>
                          </>
                        )}
                        {request.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleCreateShipment(request)}
                          >
                            <Truck className="w-4 h-4 ml-1" />
                            إنشاء شحنة
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب #{selectedRequest?.id}</DialogTitle>
            <DialogDescription>
              معلومات كاملة عن طلب المدرسة
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              {/* School Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold mb-2">معلومات المدرسة</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">اسم المدرسة:</span>
                    <span className="font-medium mr-2">{selectedRequest.school.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">المنطقة:</span>
                    <span className="font-medium mr-2">{selectedRequest.school.district}</span>
                  </div>
                </div>
              </div>

              {/* Books List */}
              <div>
                <h3 className="font-bold mb-2">الكتب المطلوبة</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المادة</TableHead>
                      <TableHead className="text-right">الصف</TableHead>
                      <TableHead className="text-right">العنوان</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedRequest.items || []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.book.subject_display}</TableCell>
                        <TableCell>{item.book.grade_display}</TableCell>
                        <TableCell>{item.book.title}</TableCell>
                        <TableCell>
                          <Badge>{item.quantity}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Total */}
              <div className="bg-blue-50 p-3 rounded-lg flex justify-between items-center">
                <span className="font-bold">إجمالي الكتب:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {(selectedRequest.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              إغلاق
            </Button>
            {selectedRequest?.status === 'submitted' && (
              <>
                <Button
                  variant="default"
                  onClick={() => handleAction(selectedRequest, 'approve')}
                >
                  <CheckCircle className="w-4 h-4 ml-1" />
                  قبول الطلب
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleAction(selectedRequest, 'reject')}
                >
                  <XCircle className="w-4 h-4 ml-1" />
                  رفض الطلب
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'تأكيد قبول الطلب' : 'تأكيد رفض الطلب'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? 'سيتم قبول الطلب وإضافته لقائمة الطلبات المعتمدة'
                : 'سيتم رفض الطلب وإشعار المدرسة'
              }
            </DialogDescription>
          </DialogHeader>

          {actionType === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor="reason">سبب الرفض *</Label>
              <Textarea
                id="reason"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="اكتب سبب رفض الطلب..."
                rows={4}
                required
              />
            </div>
          )}

          {actionType === 'approve' && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">تنبيه:</p>
                  <p>بعد القبول، سيتم إضافة هذا الطلب لقائمة الطلبات المعتمدة ويمكن تضمينه في طلب المحافظة للوزارة.</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowActionDialog(false)}
              disabled={processing}
            >
              إلغاء
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={confirmAction}
              disabled={processing || (actionType === 'reject' && !actionNotes.trim())}
            >
              {processing ? 'جاري المعالجة...' : 'تأكيد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Shipment Dialog */}
      {selectedRequestForShipment && (
        <CreateSchoolShipmentDialog
          open={showShipmentDialog}
          onClose={() => {
            setShowShipmentDialog(false);
            setSelectedRequestForShipment(null);
          }}
          onSuccess={handleShipmentSuccess}
          request={selectedRequestForShipment}
        />
      )}
    </div>
  );
}
