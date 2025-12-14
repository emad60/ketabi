import { useState, useEffect } from 'react';
import React from 'react';
// نافذة منبثقة بسيطة
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div style={{position: 'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.25)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{background:'#fff', borderRadius:8, minWidth:350, maxWidth:500, width:'90%', boxShadow:'0 2px 16px #0002', padding:24, position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute', left:12, top:12, fontSize:18, color:'#888', background:'none', border:'none', cursor:'pointer'}}>×</button>
        {children}
      </div>
    </div>
  );
}
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  School, FileText, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { apiService, type SchoolRequest } from '../services/apiService';
import { useAuthStore } from '../store/authStore';

export const ProvinceSchoolRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: requestId } = useParams();
  const { user } = useAuthStore();

  const [requests, setRequests] = useState<SchoolRequest[]>([]);
  const [currentRequest, setCurrentRequest] = useState<SchoolRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(requestId ? parseInt(requestId) : null);
  const [modalRequest, setModalRequest] = useState<SchoolRequest | null>(null);

  const [editingQuantities, setEditingQuantities] = useState<Record<number, number>>({});
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      if (user?.province) {
        const data = await apiService.getSchoolRequests({ province: user.province });
        setRequests(data);
        if (requestId) {
          const found = data.find((r) => r.id === Number(requestId));
          if (found) {
            setCurrentRequest(found);
            const quantities: Record<number, number> = {};
            found.items.forEach((item) => {
              quantities[item.book_id] = item.quantity_approved || item.quantity_requested;
            });
            setEditingQuantities(quantities);
          }
        }
        setError('');
      }
    } catch (err: any) {
      console.error('Error fetching school requests:', err);
      setError('فشل تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user?.province]);

  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesSearch =
      (request.school_name?.includes(searchTerm) ?? false) ||
      request.id?.toString().includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const handleApproveRequest = async () => {
    if (!currentRequest) return;

    try {
      setSubmitting(true);
      await apiService.approveSchoolRequest(currentRequest.id, {
        approved_items: (currentRequest.items || []).map(item => ({
          book_id: item.book_id,
          quantity: editingQuantities[item.book_id] || 0,
        })),
      });

      setError('');
      setCurrentRequest(null);
      fetchRequests();
      alert('تم الموافقة على الطلب بنجاح');
    } catch (err: any) {
      console.error('Error approving request:', err);
      setError('فشل في الموافقة على الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!currentRequest) return;

    try {
      setSubmitting(true);
      await apiService.rejectSchoolRequest(currentRequest.id, {
        reason: rejectReason,
      });

      setError('');
      setCurrentRequest(null);
      setRejectReason('');
      fetchRequests();
      alert('تم رفض الطلب بنجاح');
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      setError('فشل في رفض الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateProvinceRequest = async () => {
    if (!currentRequest) return;

    try {
      setSubmitting(true);
      await apiService.createProvinceRequest({
        school_requests: [currentRequest.id],
        items: (currentRequest.items || []).map(item => ({
          book_id: item.book_id,
          quantity: editingQuantities[item.book_id] || 0,
        })),
      });

      setError('');
      setCurrentRequest(null);
      fetchRequests();
      alert('تم إنشاء طلب المحافظة للوزارة بنجاح');
    } catch (err: any) {
      console.error('Error creating province request:', err);
      setError('فشل في إنشاء طلب المحافظة');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !currentRequest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">⏳</div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <Button
            onClick={() => navigate('/province/dashboard')}
            variant="ghost"
            className="mb-4"
          >
            ← العودة
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">طلبات المدارس</h1>
          <p className="text-gray-600 mt-2">
            استعرض وأدر جميع طلبات المدارس المعلقة في محافظتك
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>قائمة الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <Input
                    placeholder="بحث عن مدرسة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />

                  <Select value={filterStatus} onValueChange={(val: any) => setFilterStatus(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="تصفية الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="pending">معلق</SelectItem>
                      <SelectItem value="approved">موافق</SelectItem>
                      <SelectItem value="rejected">مرفوض</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((request) => (
                      <div key={request.id} className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-2 mb-2 justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{request.school_name}</div>
                          <div className="text-xs text-gray-600">{(request.items || []).length} كتاب</div>
                        </div>
                        <Badge
                          className={
                            request.status === 'approved'
                              ? 'bg-green-100 text-green-800 text-xs'
                              : request.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 text-xs'
                              : 'bg-red-100 text-red-800 text-xs'
                          }
                        >
                          {request.status === 'approved'
                            ? 'موافق'
                            : request.status === 'pending'
                            ? 'معلق'
                            : 'مرفوض'}
                        </Badge>
                        <Button size="sm" className="ml-2" onClick={() => setModalRequest(request)}>
                          عرض
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-gray-600 text-sm">
                      لا توجد طلبات
                    </p>
                  )}
                </div>
                    {/* نافذة تفاصيل الطلب */}
                    <Modal open={!!modalRequest} onClose={() => setModalRequest(null)}>
                      {modalRequest && (
                        <div>
                          <h3 style={{fontWeight:'bold', fontSize:18, marginBottom:8}}>تفاصيل الطلب</h3>
                          <div style={{marginBottom:8}}>
                            <span style={{color:'#666', fontSize:13}}>المدرسة: </span>
                            <span style={{fontWeight:'bold'}}>{modalRequest.school_name}</span>
                          </div>
                          <div style={{marginBottom:8}}>
                            <span style={{color:'#666', fontSize:13}}>الحالة: </span>
                            <span style={{fontWeight:'bold'}}>
                              {modalRequest.status === 'approved' ? 'موافق' : modalRequest.status === 'pending' ? 'معلق' : 'مرفوض'}
                            </span>
                          </div>
                          <div style={{marginBottom:8}}>
                            <span style={{color:'#666', fontSize:13}}>تاريخ الطلب: </span>
                            <span>{modalRequest.created_at ? modalRequest.created_at.split('T')[0] : ''}</span>
                          </div>
                          <div style={{marginBottom:8}}>
                            <span style={{color:'#666', fontSize:13}}>عدد الكتب: </span>
                            <span>{(modalRequest.items || []).length}</span>
                          </div>
                          <div style={{margin:'16px 0'}}>
                            <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
                              <thead>
                                <tr style={{background:'#f3f3f3'}}>
                                  <th style={{padding:6, border:'1px solid #eee'}}>اسم الكتاب</th>
                                  <th style={{padding:6, border:'1px solid #eee'}}>الكمية المطلوبة</th>
                                  <th style={{padding:6, border:'1px solid #eee'}}>الكمية المعتمدة</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(modalRequest.items || []).map((item, idx) => (
                                  <tr key={idx}>
                                    <td style={{padding:6, border:'1px solid #eee'}}>{item.book_title}</td>
                                    <td style={{padding:6, border:'1px solid #eee', textAlign:'center'}}>{item.quantity_requested}</td>
                                    <td style={{padding:6, border:'1px solid #eee', textAlign:'center'}}>{item.quantity_approved ?? '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {modalRequest.notes && (
                            <div style={{marginTop:8, color:'#666', fontSize:13}}>
                              <b>ملاحظات:</b> {modalRequest.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </Modal>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {currentRequest ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>بيانات المدرسة</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-600">اسم المدرسة</Label>
                      <p className="font-medium">{currentRequest.school_name}</p>
                    </div>
                    {currentRequest.notes && (
                      <div>
                        <Label className="text-xs text-gray-600">ملاحظات</Label>
                        <p className="text-sm text-gray-700">{currentRequest.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>الكتب المطلوبة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(currentRequest.items || []).map((item, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{item.book_title}</span>
                            <Badge variant="outline">
                              طلب: {item.quantity_requested}
                            </Badge>
                          </div>

                          {currentRequest.status === 'pending' && (
                            <div>
                              <Label htmlFor={`qty-${item.book_id}`} className="text-xs">
                                الكمية المعتمدة
                              </Label>
                              <Input
                                id={`qty-${item.book_id}`}
                                type="number"
                                min="0"
                                max={item.quantity_requested}
                                value={editingQuantities[item.book_id] || 0}
                                onChange={(e) =>
                                  setEditingQuantities({
                                    ...editingQuantities,
                                    [item.book_id]: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="mt-1"
                              />
                            </div>
                          )}

                          {currentRequest.status !== 'pending' && (
                            <div className="text-sm text-gray-600">
                              معتمد: {item.quantity_approved} من {item.quantity_requested}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {currentRequest.status === 'pending' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>الإجراءات</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Button
                          onClick={handleApproveRequest}
                          disabled={submitting}
                          className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          الموافقة على الطلب
                        </Button>

                        <Button
                          onClick={() => setExpandedId(expandedId === -1 ? null : -1)}
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          {expandedId === -1 ? 'إخفاء' : 'إظهار'} نموذج الرفض
                        </Button>
                      </div>

                      {expandedId === -1 && (
                        <div className="space-y-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <Label className="text-xs text-gray-600">سبب الرفض</Label>
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="أدخل سبب الرفض (اختياري)"
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                            rows={3}
                          />
                          <Button
                            onClick={handleRejectRequest}
                            disabled={submitting}
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                          >
                            تأكيد الرفض
                          </Button>
                        </div>
                      )}

                      <Button
                        onClick={handleCreateProvinceRequest}
                        disabled={submitting}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        إنشاء طلب محافظة للوزارة
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {currentRequest.status !== 'pending' && (
                  <Alert
                    className={
                      currentRequest.status === 'approved'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }
                  >
                    <AlertTriangle
                      className={
                        currentRequest.status === 'approved'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    />
                    <AlertDescription>
                      {currentRequest.status === 'approved'
                        ? 'تم الموافقة على هذا الطلب'
                        : 'تم رفض هذا الطلب'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <p className="text-center text-gray-600">اختر طلباً لعرض التفاصيل</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
