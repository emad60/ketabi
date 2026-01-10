import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { 
  TruckIcon, 
  School, 
  Package, 
  Users, 
  ArrowLeft,
  CheckCircle,
  Loader2,
  FileText,
  MapPin,
  Calendar
} from 'lucide-react';
import DashboardTopNav from '../components/DashboardTopNav';
import api from '../services/api';

interface SchoolRequestItem {
  id: number;
  book_id: number;
  book_title: string;
  book_subject: string;
  book_grade: string;
  quantity: number;
}

interface SchoolRequest {
  id: number;
  school: {
    id: number;
    name: string;
    province: string;
    directorate: string | null;
  };
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  reviewed_by: string | null;
  items: SchoolRequestItem[];
  total_items: number;
  has_active_shipment: boolean;
}

interface Courier {
  id: number;
  username: string;
  full_name: string;
  phone_number: string;
  role: string;
}

export function ProvinceCreateShipmentPage() {
  const [requests, setRequests] = useState<SchoolRequest[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SchoolRequest | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch approved school requests
      const requestsRes = await api.get('/warehouses/province/school-requests/approved/');
      setRequests(requestsRes.data.requests || []);
      
      // Fetch available couriers
      const couriersRes = await api.get('/users/', { 
        params: { role: 'province_driver' }
      });
      setCouriers(couriersRes.data.results || couriersRes.data || []);
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('فشل تحميل البيانات. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShipment = async () => {
    if (!selectedRequest || !selectedCourier) {
      setError('الرجاء اختيار الطلب والمندوب');
      return;
    }

    try {
      setCreating(true);
      setError('');
      setSuccess('');

      const response = await api.post('/warehouses/province/shipments/create-from-request/', {
        school_request_id: selectedRequest.id,
        courier_id: selectedCourier,
      });

      setSuccess(`تم إنشاء الشحنة بنجاح! رقم التتبع: ${response.data.shipment.tracking_code}`);
      
      // Refresh the requests list
      setTimeout(() => {
        fetchData();
        setSelectedRequest(null);
        setSelectedCourier(null);
      }, 2000);

    } catch (err: any) {
      console.error('Error creating shipment:', err);
      setError(err.response?.data?.error || 'فشل إنشاء الشحنة. الرجاء المحاولة مرة أخرى.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardTopNav activeTab="shipments" onTabChange={() => {}} role="province" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">جارِ تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <DashboardTopNav activeTab="shipments" onTabChange={() => {}} role="province" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <TruckIcon className="w-8 h-8 text-purple-600" />
              إنشاء شحنات للمدارس
            </h1>
            <p className="text-gray-600 mt-2">
              اختر طلب مدرسة معتمد وقم بإنشاء شحنة وإسنادها لمندوب
            </p>
          </div>
          <Button
            onClick={() => navigate('/province/dashboard')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للوحة التحكم
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Approved Requests List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  طلبات المدارس المعتمدة ({requests.length})
                </CardTitle>
                <CardDescription>
                  اختر طلباً لإنشاء شحنة له
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">لا توجد طلبات معتمدة حالياً</p>
                    <p className="text-gray-400 text-sm mt-2">
                      سيظهر هنا الطلبات التي تمت الموافقة عليها ولم يتم إنشاء شحنات لها بعد
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div
                        key={request.id}
                        onClick={() => setSelectedRequest(request)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedRequest?.id === request.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <School className="w-5 h-5 text-blue-600" />
                              <h3 className="font-semibold text-gray-900">
                                {request.school.name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {request.school.province}
                              </span>
                              {request.school.directorate && (
                                <span>• {request.school.directorate}</span>
                              )}
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            معتمد
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 p-3 bg-white rounded-md">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {request.total_items}
                            </div>
                            <div className="text-xs text-gray-600">عدد الكتب</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {request.items.reduce((sum, item) => sum + item.quantity, 0)}
                            </div>
                            <div className="text-xs text-gray-600">إجمالي الكمية</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(request.created_at).toLocaleDateString('ar-SA')}
                            </div>
                            <div className="text-xs text-gray-500">تاريخ الطلب</div>
                          </div>
                        </div>

                        {selectedRequest?.id === request.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="font-semibold text-sm text-gray-700 mb-3">
                              تفاصيل الكتب:
                            </h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {request.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                      {item.book_title}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {item.book_subject} - {item.book_grade}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-purple-600">
                                      {item.quantity}
                                    </div>
                                    <div className="text-xs text-gray-500">نسخة</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Courier Selection and Create Shipment */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  المندوبين المتاحين
                </CardTitle>
                <CardDescription>
                  اختر مندوباً لإسناد الشحنة له
                </CardDescription>
              </CardHeader>
              <CardContent>
                {couriers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">لا يوجد مندوبين متاحين</p>
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    {couriers.map((courier) => (
                      <div
                        key={courier.id}
                        onClick={() => setSelectedCourier(courier.id)}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedCourier === courier.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900">
                          {courier.full_name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {courier.phone_number || 'لا يوجد رقم هاتف'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleCreateShipment}
                    disabled={!selectedRequest || !selectedCourier || creating}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        جارِ الإنشاء...
                      </>
                    ) : (
                      <>
                        <TruckIcon className="w-4 h-4 ml-2" />
                        إنشاء الشحنة
                      </>
                    )}
                  </Button>

                  {selectedRequest && selectedCourier && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                      <div className="font-semibold text-blue-900 mb-2">
                        ملخص الشحنة:
                      </div>
                      <div className="space-y-1 text-blue-800">
                        <div>• المدرسة: {selectedRequest.school.name}</div>
                        <div>
                          • المندوب:{' '}
                          {couriers.find((c) => c.id === selectedCourier)?.full_name}
                        </div>
                        <div>• عدد الكتب: {selectedRequest.total_items}</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
