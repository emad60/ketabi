import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { CheckCircle, XCircle, Package } from 'lucide-react';
import { apiService, type ProvinceRequest } from '../services/apiService';

export const MinistryProvinceRequestsPage: React.FC = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<ProvinceRequest[]>([]);
  const [currentRequest, setCurrentRequest] = useState<ProvinceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [editingQuantities, setEditingQuantities] = useState<Record<number, number>>({});

  const fetchRequests = async () => {
    setLoading(true);
    try {
      console.log('Fetching province requests from API...');
      const data = await apiService.getProvinceRequests();
      console.log('Fetched data:', data);
      if (Array.isArray(data)) {
        setRequests(data);
      } else {
        console.error('Expected array but got:', typeof data);
        setRequests([]);
      }
      setError('');
    } catch (err: any) {
      console.error('Error fetching province requests:', err);
      setError('فشل تحميل الطلبات: ' + (err.message || JSON.stringify(err)));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter((request) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (request.province_name || '').toLowerCase().includes(q) ||
      (request.request_number || '').toLowerCase().includes(q);
    return matchesSearch;
  });

  const handleApproveRequest = async () => {
    if (!currentRequest) return;

    try {
      setSubmitting(true);
      await apiService.approveProvinceRequest(currentRequest.id, {
        action: 'approve',
        items_approval: (currentRequest.items || []).map((item: any) => ({
          id: item.id,
          approved_quantity: editingQuantities[item.id] || item.quantity,
        })),
      });

      setError('');
      setCurrentRequest(null);
      await fetchRequests();
      alert('تم الموافقة على الطلب بنجاح');
    } catch (err: any) {
      console.error('Error approving request:', err);
      setError('فشل في الموافقة على الطلب: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!currentRequest || !rejectReason.trim()) {
      setError('يرجى كتابة سبب الرفض');
      return;
    }

    try {
      setSubmitting(true);
      await apiService.rejectProvinceRequest(currentRequest.id, {
        action: 'reject',
        rejection_reason: rejectReason,
      });

      setError('');
      setCurrentRequest(null);
      setRejectReason('');
      setShowRejectForm(false);
      await fetchRequests();
      alert('تم رفض الطلب بنجاح');
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      setError('فشل في رفض الطلب: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            موافق
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            مرفوض
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            معلق
          </Badge>
        );
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'موافق عليه';
      case 'rejected':
        return 'مرفوض';
      default:
        return 'قيد الانتظار';
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4 text-2xl">⏳</div>
          <p className="text-gray-600">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <Button
            onClick={() => navigate('/ministry/dashboard')}
            variant="ghost"
            className="mb-4 hover:bg-gray-100"
          >
            ← العودة للرئيسية
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">طلبات المحافظات</h1>
            <p className="text-gray-600 mt-2">
              إدارة وموافقة على طلبات الكتب القادمة من المحافظات
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Requests List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  الطلبات ({filteredRequests.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="ابحث عن محافظة أو رقم الطلب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-4"
                />

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((request) => (
                      <button
                        key={request.id}
                        onClick={() => {
                          setCurrentRequest(request);
                          const quantities: Record<number, number> = {};
                          (request.items || []).forEach((item: any) => {
                            quantities[item.id] = item.approved_quantity || item.quantity;
                          });
                          setEditingQuantities(quantities);
                          setShowRejectForm(false);
                        }}
                        className={`w-full p-3 rounded-lg text-right transition-colors ${
                          currentRequest?.id === request.id
                            ? 'bg-purple-50 border-2 border-purple-300'
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 text-right">
                            <p className="font-medium text-sm">
                              {request.province_name || 'محافظة بدون اسم'}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              # {request.request_number || request.id}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {request.items_count} كتب • إجمالي: {request.total_quantity}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-center py-8 text-gray-600 text-sm">
                      لا توجد طلبات
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Request Details */}
          <div className="lg:col-span-2">
            {currentRequest ? (
              <div className="space-y-4">
                {/* Request Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>معلومات الطلب</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-600">رقم الطلب</Label>
                        <p className="font-medium"># {currentRequest.request_number || currentRequest.id}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">الحالة</Label>
                        <p className="mt-1">{getStatusBadge(currentRequest.status)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-600">المحافظة</Label>
                        <p className="font-medium">{currentRequest.province_name || 'غير محدد'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">تاريخ الطلب</Label>
                        <p className="font-medium">
                          {currentRequest.created_at
                            ? new Date(currentRequest.created_at).toLocaleDateString('ar-IQ')
                            : 'غير محدد'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-600">الملاحظات</Label>
                      <p className="text-sm text-gray-700 mt-1 p-2 bg-gray-50 rounded">
                        {currentRequest.notes || 'لا توجد ملاحظات'}
                      </p>
                    </div>

                    {currentRequest.rejection_reason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <Label className="text-xs text-red-700">سبب الرفض</Label>
                        <p className="text-sm text-red-900 mt-1">{currentRequest.rejection_reason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Items List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      الكتب المطلوبة ({currentRequest.items_count || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(currentRequest.items || []).length > 0 ? (
                        (currentRequest.items || []).map((item: any, index: number) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.book_title}</p>
                                {item.subject && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {item.subject} - {item.grade}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                              <div>
                                <span className="text-gray-600">مطلوب: </span>
                                <span className="font-medium">{item.quantity}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">موافق: </span>
                                <span className="font-medium">{item.approved_quantity || 0}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">معتمد: </span>
                                <input
                                  type="number"
                                  min="0"
                                  max={item.quantity}
                                  value={editingQuantities[item.id] || item.approved_quantity || 0}
                                  onChange={(e) =>
                                    setEditingQuantities({
                                      ...editingQuantities,
                                      [item.id]: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="w-12 px-1 py-1 border border-gray-300 rounded text-center"
                                  disabled={currentRequest.status !== 'pending'}
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-4 text-gray-600 text-sm">
                          لا توجد عناصر في هذا الطلب
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                {currentRequest.status === 'pending' && (
                  <Card>
                    <CardContent className="pt-6">
                      {!showRejectForm ? (
                        <div className="flex gap-3">
                          <Button
                            onClick={handleApproveRequest}
                            disabled={submitting}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 ml-2" />
                            {submitting ? 'جاري الموافقة...' : 'الموافقة على الطلب'}
                          </Button>
                          <Button
                            onClick={() => setShowRejectForm(true)}
                            variant="outline"
                            className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 ml-2" />
                            رفض الطلب
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="أدخل سبب الرفض..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="text-right"
                          />
                          <div className="flex gap-3">
                            <Button
                              onClick={handleRejectRequest}
                              disabled={submitting || !rejectReason.trim()}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                              {submitting ? 'جاري الرفض...' : 'تأكيد الرفض'}
                            </Button>
                            <Button
                              onClick={() => {
                                setShowRejectForm(false);
                                setRejectReason('');
                              }}
                              variant="outline"
                              className="flex-1"
                            >
                              إلغاء
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {currentRequest.status !== 'pending' && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <p className="text-sm text-blue-900">
                        تم {getStatusLabel(currentRequest.status)} هذا الطلب ولا يمكن تعديله
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-96">
                <CardContent className="text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">اختر طلباً لعرض التفاصيل</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MinistryProvinceRequestsPage;
