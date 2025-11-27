import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
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
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  AlertTriangle,
  TruckIcon,
  FileText
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { CreateShipmentFromRequestDialog } from './CreateShipmentFromRequestDialog';

interface RequestItem {
  id: number;
  book: number;
  book_title?: string;
  subject: string;
  grade: string;
  quantity: number;
  approved_quantity?: number;
  available_stock?: number;
}

interface ProvinceRequest {
  id: number;
  request_number: string;
  created_by: {
    id: number;
    full_name: string;
    province?: string;
  };
  created_at: string;
  status: string;
  notes?: string;
  rejection_reason?: string;
  items: RequestItem[];
}

interface StockInfo {
  [bookId: number]: number;
}

export function MinistryProvinceRequestsPageV2() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ProvinceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ProvinceRequest | null>(null);
  const [stockInfo, setStockInfo] = useState<StockInfo>({});
  
  // Dialogs
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showShipmentDialog, setShowShipmentDialog] = useState(false);
  
  // Form states
  const [approvedQuantities, setApprovedQuantities] = useState<{ [itemId: number]: number }>({});
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [lastApprovedRequest, setLastApprovedRequest] = useState<ProvinceRequest | null>(null);
  const [lastApprovedItems, setLastApprovedItems] = useState<Array<{ id: number; approved_quantity: number }>>([]);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (user) {
      fetchRequests();

      // If a request id is provided via query param, fetch and open its details
      const paramId = searchParams.get('id');
      if (paramId) {
        (async () => {
          try {
            setLoading(true);
            const resp = await api.get(`/book-requests/${paramId}/`);
            const req = resp.data;
            setSelectedRequest(req);
            await fetchStockForRequest(req);
            setShowDetailsDialog(true);
          } catch (err) {
            console.error('Failed to load request from query param:', err);
          } finally {
            setLoading(false);
          }
        })();
      }
    } else {
      setLoading(false);
    }
  }, [filterStatus, user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      const params: any = {};
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }
      
      const response = await api.get('/book-requests/province/', { params });
      const data = response.data.results || response.data;
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockForRequest = async (request: ProvinceRequest) => {
    try {
      // جلب المخزون المتاح لكل كتاب في الطلب
      const bookIds = (request.items || []).map(item => item.book);
      const stockPromises = bookIds.map(bookId =>
        api.get('/warehouses/stocks/', {
          params: {
            book: bookId,
            ministry_warehouse__isnull: false // فقط مخازن الوزارة
          }
        }).catch(() => ({ data: { results: [] } }))
      );

      const stockResponses = await Promise.all(stockPromises);
      const newStockInfo: StockInfo = {};

      stockResponses.forEach((response, index) => {
        const stocks = response.data.results || response.data;
        const totalStock = Array.isArray(stocks)
          ? stocks.reduce((sum: number, stock: any) => sum + (stock.quantity || 0), 0)
          : 0;
        newStockInfo[bookIds[index]] = totalStock;
      });

      setStockInfo(newStockInfo);
      
      // تهيئة الكميات المقبولة
      const initialQuantities: { [key: number]: number } = {};
      (request.items || []).forEach(item => {
        initialQuantities[item.id] = item.approved_quantity || item.quantity;
      });
      setApprovedQuantities(initialQuantities);
      
    } catch (error) {
      console.error('Error fetching stock:', error);
    }
  };

  const handleViewDetails = async (request: ProvinceRequest) => {
    setSelectedRequest(request);
    await fetchStockForRequest(request);
    setShowDetailsDialog(true);
  };

  const handleApprove = async (request: ProvinceRequest) => {
    setSelectedRequest(request);
    await fetchStockForRequest(request);
    setShowApprovalDialog(true);
  };

  const handleReject = (request: ProvinceRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const submitApproval = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      
      // تحضير بيانات الموافقة
      const itemsApproval = (selectedRequest.items || []).map(item => ({
        id: item.id,
        approved_quantity: approvedQuantities[item.id] || item.quantity
      }));

      await api.post(`/book-requests/province/${selectedRequest.id}/approve-reject/`, {
        action: 'approve',
        items_approval: itemsApproval
      });

      alert('✅ تم قبول الطلب بنجاح!\n\nيمكنك الآن إنشاء شحنة لهذا الطلب.');
      setShowApprovalDialog(false);
      await fetchRequests();
      
      // حفظ بيانات الطلب الموافق عليه
      setLastApprovedRequest(selectedRequest);
      setLastApprovedItems(itemsApproval);
      
      // عرض خيار إنشاء الشحنة
      if (window.confirm('هل تريد إنشاء شحنة لهذا الطلب الآن؟')) {
        setShowShipmentDialog(true);
      }
      
    } catch (error: any) {
      console.error('Error approving request:', error);
      alert('حدث خطأ: ' + (error.response?.data?.detail || 'فشل في معالجة الطلب'));
    } finally {
      setProcessing(false);
    }
  };

  const submitRejection = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      alert('يرجى إدخال سبب الرفض');
      return;
    }

    try {
      setProcessing(true);
      
      await api.post(`/book-requests/province/${selectedRequest.id}/approve-reject/`, {
        action: 'reject',
        rejection_reason: rejectionReason
      });

      alert('تم رفض الطلب');
      setShowRejectDialog(false);
      setRejectionReason('');
      await fetchRequests();
      
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      alert('حدث خطأ: ' + (error.response?.data?.detail || 'فشل في معالجة الطلب'));
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: 'قيد الانتظار', variant: 'default', icon: Clock },
      approved: { label: 'مقبول', variant: 'success', icon: CheckCircle },
      rejected: { label: 'مرفوض', variant: 'destructive', icon: XCircle },
      fulfilled: { label: 'تم التنفيذ', variant: 'secondary', icon: Package }
    };

    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const canModifyRequest = (status: string) => status === 'pending';

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
          <h1 className="text-3xl font-bold">طلبات المحافظات</h1>
          <p className="text-gray-600 mt-1">مراجعة والموافقة على طلبات الكتب من المحافظات</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilterStatus('pending')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الطلبات الجديدة</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilterStatus('approved')}>
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

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilterStatus('rejected')}>
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

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setFilterStatus('all')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>قائمة الطلبات</span>
            <Badge variant="outline">{filterStatus === 'all' ? 'الكل' : getStatusBadge(filterStatus)}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>لا توجد طلبات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الطلب</TableHead>
                  <TableHead className="text-right">المحافظة</TableHead>
                  <TableHead className="text-right">مقدم الطلب</TableHead>
                  <TableHead className="text-right">عدد الكتب</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.request_number}</TableCell>
                    <TableCell>{request.created_by.province || '-'}</TableCell>
                    <TableCell>{request.created_by.full_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {(request.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)} كتاب
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
                        {canModifyRequest(request.status) && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(request)}
                            >
                              <CheckCircle className="w-4 h-4 ml-1" />
                              قبول
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(request)}
                            >
                              <XCircle className="w-4 h-4 ml-1" />
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
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب {selectedRequest?.request_number}</DialogTitle>
            <DialogDescription>
              معلومات كاملة عن طلب المحافظة
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">المحافظة:</span>
                  <p className="font-medium">{selectedRequest.created_by.province}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">مقدم الطلب:</span>
                  <p className="font-medium">{selectedRequest.created_by.full_name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">التاريخ:</span>
                  <p className="font-medium">
                    {new Date(selectedRequest.created_at).toLocaleString('ar-IQ')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">الحالة:</span>
                  <p>{getStatusBadge(selectedRequest.status)}</p>
                </div>
              </div>

              {/* Books Table */}
              <div>
                <h3 className="font-bold mb-2">الكتب المطلوبة</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المادة</TableHead>
                      <TableHead className="text-right">الصف</TableHead>
                      <TableHead className="text-right">الكمية المطلوبة</TableHead>
                      <TableHead className="text-right">المخزون المتاح</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedRequest.items || []).map((item) => {
                      const available = stockInfo[item.book] || 0;
                      const isAvailable = available >= item.quantity;

                      return (
                        <TableRow key={item.id}>
                          <TableCell>{item.subject}</TableCell>
                          <TableCell>{item.grade}</TableCell>
                          <TableCell>
                            <Badge>{item.quantity}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isAvailable ? 'default' : 'destructive'} className={isAvailable ? 'bg-green-500' : ''}>
                              {available}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isAvailable ? (
                              <span className="text-green-600 text-sm flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" />
                                متوفر
                              </span>
                            ) : (
                              <span className="text-red-600 text-sm flex items-center gap-1">
                                <AlertTriangle className="w-4 h-4" />
                                غير كافٍ
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">ملاحظات:</p>
                  <p className="text-sm text-blue-800">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedRequest.rejection_reason && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-red-900">سبب الرفض:</p>
                  <p className="text-sm text-red-800">{selectedRequest.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              إغلاق
            </Button>
            {selectedRequest && canModifyRequest(selectedRequest.status) && (
              <>
                <Button
                  variant="default"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    handleApprove(selectedRequest);
                  }}
                >
                  <CheckCircle className="w-4 h-4 ml-1" />
                  قبول الطلب
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    handleReject(selectedRequest);
                  }}
                >
                  <XCircle className="w-4 h-4 ml-1" />
                  رفض الطلب
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>الموافقة على الطلب</DialogTitle>
            <DialogDescription>
              راجع الكميات وقم بتعديلها إذا لزم الأمر
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <p className="text-sm text-blue-900">
                  💡 يمكنك تعديل الكميات المقبولة حسب المخزون المتاح
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الكتاب</TableHead>
                    <TableHead className="text-right">المطلوب</TableHead>
                    <TableHead className="text-right">المتاح</TableHead>
                    <TableHead className="text-right">الكمية المقبولة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(selectedRequest.items || []).map((item) => {
                    const available = stockInfo[item.book] || 0;
                    const maxAllowed = Math.min(item.quantity, available);

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.subject}</p>
                            <p className="text-sm text-gray-600">{item.grade}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge>{item.quantity}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={available >= item.quantity ? 'default' : 'destructive'} 
                            className={available >= item.quantity ? 'bg-green-500' : ''}
                          >
                            {available}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={maxAllowed}
                            value={approvedQuantities[item.id] || item.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setApprovedQuantities(prev => ({
                                ...prev,
                                [item.id]: Math.min(value, maxAllowed)
                              }));
                            }}
                            className="w-24"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={processing}
            >
              إلغاء
            </Button>
            <Button
              variant="default"
              onClick={submitApproval}
              disabled={processing}
            >
              {processing ? 'جاري المعالجة...' : 'تأكيد الموافقة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض الطلب</DialogTitle>
            <DialogDescription>
              يرجى إدخال سبب رفض الطلب
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">سبب الرفض *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="اكتب سبب رفض الطلب بالتفصيل..."
                rows={5}
                required
              />
            </div>

            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-800">
                  سيتم إشعار المحافظة بقرار الرفض وسبب الرفض المذكور
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={processing}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={submitRejection}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? 'جاري المعالجة...' : 'تأكيد الرفض'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog إنشاء الشحنة */}
      {lastApprovedRequest && (
        <CreateShipmentFromRequestDialog
          open={showShipmentDialog}
          onClose={() => {
            setShowShipmentDialog(false);
            setLastApprovedRequest(null);
            setLastApprovedItems([]);
          }}
          onSuccess={() => {
            fetchRequests();
          }}
          request={lastApprovedRequest}
          approvedItems={lastApprovedItems}
        />
      )}
    </div>
  );
}
