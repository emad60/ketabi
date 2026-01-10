import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  School, FileText, CheckCircle, Clock, AlertTriangle, Search, Plus, Eye, ArrowRight, User, MapPin, Phone, Mail
} from 'lucide-react';
import DashboardTopNav from '../components/DashboardTopNav';
import { apiService, type SchoolRequest } from '../services/apiService';
import { useAuthStore } from '../store/authStore';

export const ProvinceIncomingSchoolRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [requests, setRequests] = useState<SchoolRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<SchoolRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SchoolRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // فلاتر
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'submitted' | 'approved' | 'rejected' | 'fulfilled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'school' | 'quantity'>('date');

  // تفاصيل الطلب
  const [viewingDetails, setViewingDetails] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // جلب الطلبات
  const fetchRequests = async () => {
    setLoading(true);
    try {
      if (user?.province) {
        const data = await apiService.getSchoolRequests({ province: user.province });
        setRequests(data);
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

  // تطبيق الفلاتر والبحث
  useEffect(() => {
    let filtered = requests.filter(request => {
      const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
      const schoolName = request.school_detail?.name || request.school_name || '';
      const matchesSearch =
        schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.id?.toString().includes(searchTerm) ?? false);
      return matchesStatus && matchesSearch;
    });

    // الترتيب
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    } else if (sortBy === 'school') {
      const getSchoolName = (req: SchoolRequest) => req.school_detail?.name || req.school_name || '';
      filtered.sort((a, b) => getSchoolName(a).localeCompare(getSchoolName(b), 'ar'));
    } else if (sortBy === 'quantity') {
      filtered.sort((a, b) => {
        const aQty = (a.items_readonly || a.items || []).reduce((sum: number, item: any) => sum + (item.quantity || item.quantity_requested || 0), 0);
        const bQty = (b.items_readonly || b.items || []).reduce((sum: number, item: any) => sum + (item.quantity || item.quantity_requested || 0), 0);
        return bQty - aQty;
      });
    }

    setFilteredRequests(filtered);
  }, [requests, filterStatus, searchTerm, sortBy]);

  // الموافقة على الطلب
  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    try {
      setApproving(true);
      const approvedItems = (selectedRequest.items || []).map(item => ({
        book_id: item.book_id,
        quantity: item.quantity_requested,
      }));
      
      await apiService.approveSchoolRequest(selectedRequest.id, {
        approved_items: approvedItems,
      });

      // تحديث القائمة
      await fetchRequests();
      setSelectedRequest(null);
      setViewingDetails(false);
      setError('');
    } catch (err: any) {
      console.error('Error approving request:', err);
      setError('فشل الموافقة على الطلب');
    } finally {
      setApproving(false);
    }
  };

  // رفض الطلب
  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) return;
    
    try {
      setRejecting(true);
      await apiService.rejectSchoolRequest(selectedRequest.id, {
        reason: rejectReason,
      });

      // تحديث القائمة
      await fetchRequests();
      setSelectedRequest(null);
      setRejectReason('');
      setViewingDetails(false);
      setError('');
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      setError('فشل رفض الطلب');
    } finally {
      setRejecting(false);
    }
  };

  // حساب إحصائيات
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'submitted' || r.status === 'draft').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    totalBooks: requests.reduce((sum, r) => sum + ((r.items_readonly || r.items || []).reduce((s: number, i: any) => s + (i.quantity || i.quantity_requested || 0), 0)), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">⏳</div>
          <p className="text-gray-600">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <DashboardTopNav activeTab="school-requests" onTabChange={() => {}} role="province" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* رأس الصفحة */}
        <div className="mb-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900">طلبات المدارس الواردة</h1>
            <p className="text-gray-600 mt-1">إدارة واستقبال طلبات الكتب من المدارس</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-600">إجمالي الطلبات</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-600">قيد الانتظار</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                <p className="text-sm text-gray-600">موافق عليها</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                <p className="text-sm text-gray-600">مرفوضة</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-purple-600">{stats.totalBooks}</p>
                <p className="text-sm text-gray-600">إجمالي الكتب</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* قائمة الطلبات */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  الطلبات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* شريط البحث والفلاتر */}
                <div className="space-y-4 mb-6">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="w-4 h-4 absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                      <Input
                        placeholder="ابحث عن المدرسة أو رقم الطلب..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">الحالة</Label>
                      <Select value={filterStatus} onValueChange={(val: any) => setFilterStatus(val)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">الكل</SelectItem>
                          <SelectItem value="draft">مسودة</SelectItem>
                          <SelectItem value="submitted">مرسل للمحافظة</SelectItem>
                          <SelectItem value="approved">موافق عليها</SelectItem>
                          <SelectItem value="rejected">مرفوضة</SelectItem>
                          <SelectItem value="fulfilled">مكتملة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">الترتيب</Label>
                      <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">الأحدث</SelectItem>
                          <SelectItem value="school">اسم المدرسة</SelectItem>
                          <SelectItem value="quantity">عدد الكتب</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* قائمة الطلبات */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((request) => (
                      <button
                        key={request.id}
                        onClick={() => {
                          setSelectedRequest(request);
                          setViewingDetails(true);
                        }}
                        className={`w-full p-4 rounded-lg text-right transition-all border-2 ${
                          selectedRequest?.id === request.id
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <School className="w-4 h-4 text-blue-600" />
                              <p className="font-semibold text-sm">{request.school_detail?.name || request.school_name || 'مدرسة غير معروفة'}</p>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              #{request.id} • {(request.items_readonly || request.items || []).length} كتاب
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(request.created_at || '').toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge
                              className={
                                request.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : request.status === 'submitted' || request.status === 'draft'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : request.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }
                            >
                              {request.status === 'approved' && 'مقبول'}
                              {request.status === 'submitted' && 'مرسل'}
                              {request.status === 'draft' && 'مسودة'}
                              {request.status === 'rejected' && 'مرفوض'}
                              {request.status === 'fulfilled' && 'مكتمل'}
                              {request.status === 'cancelled' && 'ملغى'}
                            </Badge>
                            <Eye className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>لا توجد طلبات</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* تفاصيل الطلب */}
          <div className="lg:col-span-1">
            {selectedRequest && viewingDetails ? (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg">تفاصيل الطلب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* معلومات المدرسة */}
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <School className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-600">المدرسة</p>
                        <p className="font-semibold text-sm">{selectedRequest.school_detail?.name || selectedRequest.school_name || 'مدرسة غير معروفة'}</p>
                      </div>
                    </div>
                  </div>

                  {/* معلومات إضافية */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">رقم الطلب</span>
                      <span className="font-medium">#{selectedRequest.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الحالة</span>
                      <Badge
                        className={
                          selectedRequest.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : selectedRequest.status === 'submitted' || selectedRequest.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {selectedRequest.status === 'approved' && 'مقبول'}
                        {selectedRequest.status === 'submitted' && 'مرسل'}
                        {selectedRequest.status === 'draft' && 'مسودة'}
                        {selectedRequest.status === 'rejected' && 'مرفوض'}
                        {selectedRequest.status === 'fulfilled' && 'مكتمل'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">التاريخ</span>
                      <span className="font-medium">
                        {new Date(selectedRequest.created_at || '').toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">عدد الكتب</span>
                      <span className="font-medium">{(selectedRequest.items_readonly || selectedRequest.items || []).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الكمية الإجمالية</span>
                      <span className="font-medium text-purple-600">
                        {(selectedRequest.items_readonly || selectedRequest.items || []).reduce((sum: number, item: any) => sum + (item.quantity || item.quantity_requested || 0), 0)} كتاب
                      </span>
                    </div>
                  </div>

                  {/* قائمة الكتب */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">الكتب المطلوبة:</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(selectedRequest.items_readonly || selectedRequest.items || []).map((item: any, idx: number) => (
                        <div key={idx} className="p-2 bg-gray-50 rounded text-xs">
                          <p className="font-medium">{item.book_detail?.title || item.book_title || 'كتاب غير معروف'}</p>
                          <p className="text-gray-600">الكمية: {item.quantity || item.quantity_requested || 0}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* إجراءات */}
                  {(selectedRequest.status === 'submitted' || selectedRequest.status === 'draft') && (
                    <div className="space-y-2 pt-4 border-t">
                      <Button
                        onClick={handleApprove}
                        disabled={approving}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 ml-2" />
                        الموافقة
                      </Button>

                      {rejecting ? (
                        <>
                          <Label className="text-xs">سبب الرفض</Label>
                          <Input
                            placeholder="أدخل سبب الرفض..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="text-xs"
                          />
                          <Button
                            onClick={handleReject}
                            disabled={!rejectReason.trim()}
                            className="w-full bg-red-600 hover:bg-red-700"
                          >
                            تأكيد الرفض
                          </Button>
                          <Button
                            onClick={() => {
                              setRejecting(false);
                              setRejectReason('');
                            }}
                            variant="outline"
                            className="w-full"
                          >
                            إلغاء
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => setRejecting(true)}
                          variant="destructive"
                          className="w-full"
                        >
                          رفض الطلب
                        </Button>
                      )}
                    </div>
                  )}

                  {selectedRequest.status === 'rejected' && selectedRequest.notes && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="text-xs font-semibold mb-1">سبب الرفض:</p>
                        <p className="text-xs">{selectedRequest.notes}</p>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">اختر طلباً لعرض التفاصيل</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProvinceIncomingSchoolRequestsPage;
