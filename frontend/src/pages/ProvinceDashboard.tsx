import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { statisticsService } from '../services/statisticsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Building2, 
  BookOpen, 
  TruckIcon, 
  School, 
  ArrowRight,
  Loader2,
  LogOut,
  Users,
  Package,
  AlertTriangle,
  FileText,
  BarChart3
} from 'lucide-react';
import { ProvinceWarehouseManagementPage } from '../components/ProvinceWarehouseManagementPage';
import { ProvinceRequestManagementPage } from '../components/ProvinceRequestManagementPage';
import { ProvinceCourierManagementPage } from '../components/ProvinceCourierManagementPage';
import { ProvinceShipmentManagementPage } from '../components/ProvinceShipmentManagementPage';
import { ProvinceReceiveShipmentsPage } from '../components/ProvinceReceiveShipmentsPage';
import { ProvinceSchoolRequestsPage } from '../components/ProvinceSchoolRequestsPage';
import DashboardTopNav from '../components/DashboardTopNav';

interface ProvinceStats {
  province_info: {
    warehouses_count: number;
    warehouses: Array<{
      id: number;
      name: string;
      province: string;
    }>;
  };
  stock: {
    total_books: number;
    low_stock_items: number;
  };
  incoming_shipments: {
    total: number;
    by_status: {
      pending: number;
      out_for_delivery: number;
      delivered: number;
    };
  };
  couriers: {
    total: number;
    active: number;
  };
  school_requests: {
    total: number;
    pending: number;
  };
}

export function ProvinceDashboard() {
  const [stats, setStats] = useState<ProvinceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await statisticsService.getProvinceStats(user?.province || 0);
      setStats(data as any);
      setError('');
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError('فشل تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">جارِ تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <DashboardTopNav activeTab={activeTab} onTabChange={setActiveTab} role="province" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Notification Banners */}
        <div className="space-y-3 mb-6">
          <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">نقص في كتب الرياضيات - مديرية بني الحارث</p>
              <p className="text-xs text-yellow-700 mt-1">منذ ساعة</p>
            </div>
          </div>
          
          <div className="bg-red-50 border-r-4 border-red-400 p-4 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">طلب عاجل من مدرسة الأندلس</p>
              <p className="text-xs text-red-700 mt-1">منذ ساعتين</p>
            </div>
          </div>
          
          <div className="bg-green-50 border-r-4 border-green-400 p-4 rounded-lg flex items-center gap-3">
            <Package className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">اكتمال التوزيع لمن مديرية الوحدة</p>
              <p className="text-xs text-green-700 mt-1">منذ 4 ساعات</p>
            </div>
          </div>
        </div>

        {/* Tab Content - Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Warehouses Info */}
            {stats?.province_info && stats.province_info.warehouses.length > 0 && (
              <Card className="mb-6 bg-purple-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-purple-900">مخازن المحافظة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stats.province_info.warehouses.map((warehouse) => (
                      <div 
                        key={warehouse.id}
                        className="bg-white p-3 rounded-lg border border-purple-200"
                      >
                        <p className="font-semibold text-gray-900">{warehouse.name}</p>
                        <p className="text-sm text-gray-600">{warehouse.province}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-5">الإجراءات السريعة</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* مخازن المحافظة */}
                <Button
                  variant="outline"
                  className="flex items-center gap-3 p-3 rounded-lg justify-start bg-white shadow-sm hover:shadow-md text-gray-700"
                  onClick={() => setActiveTab('warehouses')}
                >
                  <div className="bg-purple-50 p-2 rounded-md">
                    <Building2 className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium">مخازن المحافظة</span>
                </Button>

                {/* طلبات الكتب للوزارة */}
                <Button
                  variant="outline"
                  className="flex items-center gap-3 p-3 rounded-lg justify-start bg-white shadow-sm hover:shadow-md text-gray-700"
                  onClick={() => navigate('/province/book-requests')}
                >
                  <div className="bg-cyan-50 p-2 rounded-md">
                    <FileText className="w-5 h-5 text-cyan-600" />
                  </div>
                  <span className="font-medium">طلبات الكتب</span>
                </Button>

                {/* طلبات المدارس */}
                <Button
                  variant="outline"
                  className="flex items-center gap-3 p-3 rounded-lg justify-start bg-white shadow-sm hover:shadow-md text-gray-700"
                  onClick={() => setActiveTab('school-requests')}
                >
                  <div className="bg-orange-50 p-2 rounded-md">
                    <School className="w-5 h-5 text-orange-600" />
                  </div>
                  <span className="font-medium">طلبات المدارس</span>
                </Button>

                {/* إدخال الكتب */}
                <Button
                  variant="outline"
                  className="flex items-center gap-3 p-3 rounded-lg justify-start bg-white shadow-sm hover:shadow-md text-gray-700"
                  onClick={() => navigate('/province/stock-entry')}
                >
                  <div className="bg-emerald-50 p-2 rounded-md">
                    <Package className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-medium">إدخال الكتب</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {/* إدارة الشحنات */}
                <Button
                  variant="outline"
                  className="flex items-center gap-3 p-3 rounded-lg justify-start bg-white shadow-sm hover:shadow-md text-gray-700"
                  onClick={() => navigate('/province/shipments')}
                >
                  <div className="bg-blue-50 p-2 rounded-md">
                    <TruckIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium">إدارة الشحنات</span>
                </Button>

                {/* إنشاء شحنات من طلبات المدارس */}
                <Button
                  variant="outline"
                  className="flex items-center gap-3 p-3 rounded-lg justify-start bg-white shadow-sm hover:shadow-md text-gray-700"
                  onClick={() => navigate('/province/shipments/create')}
                >
                  <div className="bg-green-50 p-2 rounded-md">
                    <Package className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-medium">إنشاء شحنات</span>
                </Button>

                {/* تتبع الشحنات */}
                <Button
                  variant="outline"
                  className="flex items-center gap-3 p-3 rounded-lg justify-start bg-white shadow-sm hover:shadow-md text-gray-700"
                  onClick={() => navigate('/province/track-shipments')}
                >
                  <div className="bg-violet-50 p-2 rounded-md">
                    <Package className="w-5 h-5 text-violet-600" />
                  </div>
                  <span className="font-medium">تتبع الشحنات</span>
                </Button>

                {/* التقارير */}
                <Button
                  variant="outline"
                  className="flex items-center gap-3 p-3 rounded-lg justify-start bg-white shadow-sm hover:shadow-md text-gray-700"
                  onClick={() => navigate('/province/reports')}
                >
                  <div className="bg-sky-50 p-2 rounded-md">
                    <BarChart3 className="w-5 h-5 text-sky-600" />
                  </div>
                  <span className="font-medium">التقارير</span>
                </Button>

                {/* مناديب التوصيل */}
                <Button
                  variant="outline"
                  className="flex items-center gap-3 p-3 rounded-lg justify-start bg-white shadow-sm hover:shadow-md text-gray-700"
                  onClick={() => navigate('/province/couriers')}
                >
                  <div className="bg-indigo-50 p-2 rounded-md">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="font-medium">مناديب التوصيل</span>
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900">نظرة عامة</h2>
                <Button variant="ghost" size="sm" onClick={fetchStats} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 ml-2" />
                  )}
                  تحديث
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* عدد المخازن */}
                <Card className="hover:shadow-lg transition-shadow min-h-[120px] flex flex-col justify-between p-4">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-purple-50">
                          <Building2 className="w-5 h-5 text-purple-600" />
                        </span>
                        المخازن
                      </CardTitle>
                    </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.province_info.warehouses_count || 0}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-600">مخزن</p>
                      <span className="text-xs text-green-600 font-medium">↗ 4.3%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* الكتب في المخزون */}
                <Card className="hover:shadow-lg transition-shadow min-h-[120px] flex flex-col justify-between p-4">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-green-50">
                        <BookOpen className="w-5 h-5 text-green-600" />
                      </span>
                      المخزون الحالي
                    </CardTitle>
                  </CardHeader>
                    <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.stock?.total_books || 0}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-600">كتاب</p>
                      <span className="text-xs text-green-600 font-medium">↗ 2.1%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* مخزون منخفض */}
                <Card className="hover:shadow-lg transition-shadow min-h-[120px] flex flex-col justify-between p-4">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-yellow-50">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      </span>
                      تنبيه مخزون منخفض
                    </CardTitle>
                  </CardHeader>
                    <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.stock.low_stock_items || 0}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-600">صنف يحتاج إعادة تموين</p>
                      <span className="text-xs text-green-600 font-medium">↗ 100%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* الشحنات الواردة */}
                <Card className="hover:shadow-lg transition-shadow min-h-[120px] flex flex-col justify-between p-4">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-blue-50">
                        <TruckIcon className="w-5 h-5 text-blue-600" />
                      </span>
                      الشحنات الواردة
                    </CardTitle>
                  </CardHeader>
                    <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.incoming_shipments.total || 0}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-600">شحنة</p>
                      <span className="text-xs text-green-600 font-medium">↗ 8.2%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* شحنات معلقة */}
                <Card className="hover:shadow-lg transition-shadow min-h-[120px] flex flex-col justify-between p-4">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-orange-50">
                        <Package className="w-5 h-5 text-orange-600" />
                      </span>
                      شحنات قيد التسليم
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {(stats?.incoming_shipments.by_status.pending || 0) + (stats?.incoming_shipments.by_status.out_for_delivery || 0)}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">شحنة قيد التنفيذ</p>
                  </CardContent>
                </Card>

                {/* شحنات مستلمة */}
                <Card className="hover:shadow-lg transition-shadow min-h-[120px] flex flex-col justify-between p-4">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-emerald-50">
                        <TruckIcon className="w-5 h-5 text-green-600" />
                      </span>
                      شحنات مستلمة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.incoming_shipments.by_status.delivered || 0}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">شحنة مكتملة</p>
                  </CardContent>
                </Card>

                {/* السائقون */}
                <Card className="hover:shadow-lg transition-shadow min-h-[120px] flex flex-col justify-between p-4">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-indigo-50">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </span>
                      السائقون النشطون
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.couriers.active || 0}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">من {stats?.couriers.total || 0} سائق</p>
                  </CardContent>
                </Card>

                {/* طلبات المدارس */}
                <Card className="hover:shadow-lg transition-shadow min-h-[120px] flex flex-col justify-between p-4">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-red-50">
                        <School className="w-5 h-5 text-red-600" />
                      </span>
                      طلبات المدارس المعلقة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.school_requests.pending || 0}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">من {stats?.school_requests.total || 0} طلب</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>النشاط الأخير</CardTitle>
                <CardDescription>آخر العمليات في المحافظة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">شحنة جديدة</p>
                      <p className="text-xs text-gray-600">تم إنشاء شحنة إلى مدرسة الأمل - قبل 10 دقائق</p>
                    </div>
                    <span className="text-xs text-gray-500">10m</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <TruckIcon className="w-5 h-5 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">شحنة قيد التوصيل</p>
                      <p className="text-xs text-gray-600">رقم الشحنة #452 - السائق استلمه</p>
                    </div>
                    <span className="text-xs text-gray-500">1h</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">مناديب نشطون</p>
                      <p className="text-xs text-gray-600">3 مناديب متاحون للتسليم الآن</p>
                    </div>
                    <span className="text-xs text-gray-500">Now</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Warehouses Tab */}
        {activeTab === 'warehouses' && (
          <ProvinceWarehouseManagementPage />
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <ProvinceRequestManagementPage />
        )}

        {/* School Requests Tab (NEW) */}
        {activeTab === 'school-requests' && (
          <ProvinceSchoolRequestsPage />
        )}

        {/* Couriers Tab */}
        {activeTab === 'couriers' && (
          <ProvinceCourierManagementPage />
        )}

        {/* Shipments Tab */}
        {activeTab === 'shipments' && (
          <ProvinceShipmentManagementPage />
        )}

        {/* Receive Shipments Tab */}
        {activeTab === 'receive' && (
          <ProvinceReceiveShipmentsPage />
        )}
      </main>
    </div>
  );
}
