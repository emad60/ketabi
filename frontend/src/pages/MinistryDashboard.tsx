import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { statisticsService } from '../services/statisticsService';
import { MinistryWarehouseManagementPage } from '../components/MinistryWarehouseManagementPage';
import { MinistryShipmentManagementPage } from '../components/MinistryShipmentManagementPage';
import { MinistryProvinceRequestsPageV2 } from '../components/MinistryProvinceRequestsPageV2';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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
  Warehouse,
  Home,
  FileText,
  BarChart3,
  CheckCircle
} from 'lucide-react';

interface Stats {
  warehouses: {
    ministry_warehouses: number;
    province_warehouses: number;
    total: number;
  };
  stock: {
    total_books: number;
    low_stock_items: number;
  };
  shipments: {
    total: number;
    by_status: {
      pending: number;
      assigned: number;
      out_for_delivery: number;
      delivered: number;
      confirmed: number;
      canceled: number;
    };
    last_30_days: number;
    completed_last_30_days: number;
  };
  couriers: {
    total_ministry_couriers: number;
    active_couriers: number;
  };
  school_requests: {
    total: number;
    by_status: {
      pending: number;
      approved: number;
      rejected: number;
      fulfilled: number;
    };
  };
  school_requests: {
    total: number;
    by_status: {
      pending: number;
      approved: number;
      rejected: number;
      fulfilled: number;
    };
  };
  province_requests?: {
    total: number;
    by_status: {
      pending: number;
      approved: number;
      rejected: number;
      fulfilled: number;
    };
  };
}

export function MinistryDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await statisticsService.getMinistryStats();
      setStats(data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      console.error('Error response:', err.response);
      
      // If 401, might be auth issue - don't keep retrying
      if (err.response?.status === 401) {
        setError('خطأ في المصادقة - يرجى تسجيل الدخول مرة أخرى');
        // Clear interval to prevent continuous retries
        return;
      }
      
      setError('فشل تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if user is authenticated
    if (!user || !user.role) {
      console.warn('[MinistryDashboard] No user or role, skipping stats fetch');
      setLoading(false);
      return;
    }
    
    fetchStats();
    // تحديث الإحصائيات كل دقيقة
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [user]); // Add user dependency

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">جارِ تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">نظام كتابي</h1>
                <p className="text-sm text-gray-600">لوحة تحكم الوزارة</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold text-gray-900">{user?.full_name}</p>
                <p className="text-sm text-gray-600">{user?.role === 'ministry_admin' ? 'مدير النظام' : 'موظف الوزارة'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 ml-2" />
                تسجيل خروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 space-x-reverse">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Home className="h-4 w-4" />
              النظرة العامة
            </button>
            <button
              onClick={() => setActiveTab('warehouses')}
              className={`${
                activeTab === 'warehouses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <Warehouse className="h-4 w-4" />
              المخازن
            </button>
            <button
              onClick={() => setActiveTab('shipments')}
              className={`${
                activeTab === 'shipments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <TruckIcon className="h-4 w-4" />
              الشحنات
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">الإجراءات السريعة</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* إدارة مخازن الوزارة */}
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => setActiveTab('warehouses')}
                >
                  <Warehouse className="ml-2 w-5 h-5" />
                  مخازن الوزارة
                </Button>
                
                {/* إدخال الكتب للمخازن */}
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => navigate('/ministry/stock-entry')}
                >
                  <Package className="ml-2 w-5 h-5" />
                  إدخال الكتب
                </Button>
                
                {/* طلبات المحافظات */}
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => navigate('/ministry/province-requests')}
                >
                  <FileText className="ml-2 w-5 h-5" />
                  طلبات المحافظات
                </Button>
                
                {/* إنشاء شحنة للمحافظات */}
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => setActiveTab('shipments')}
                >
                  <TruckIcon className="ml-2 w-5 h-5" />
                  إنشاء شحنة
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                {/* إدارة المحافظات */}
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => navigate('/ministry/provinces')}
                >
                  <Building2 className="ml-2 w-5 h-5" />
                  إدارة المحافظات
                </Button>
                
                {/* الشحنات الصادرة */}
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => navigate('/ministry/outgoing-shipments')}
                >
                  <TruckIcon className="ml-2 w-5 h-5" />
                  شحنات صادرة
                </Button>
                
                {/* الشحنات الواردة */}
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => navigate('/ministry/incoming-shipments')}
                >
                  <Package className="ml-2 w-5 h-5" />
                  شحنات واردة
                </Button>
                
                {/* مناديب التوصيل */}
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => navigate('/ministry/couriers')}
                >
                  <Users className="ml-2 w-5 h-5" />
                  مناديب التوصيل
                </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">نظرة عامة</h2>
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
            {/* المخازن الوزارية */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  المخازن الوزارية
                </CardTitle>
                <Building2 className="w-8 h-8 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats?.warehouses.ministry_warehouses || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">مخزن مركزي</p>
              </CardContent>
            </Card>

            {/* مخازن المحافظات */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  مخازن المحافظات
                </CardTitle>
                <Building2 className="w-8 h-8 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats?.warehouses.province_warehouses || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">مخزن فرعي</p>
              </CardContent>
            </Card>

            {/* الكتب */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  إجمالي الكتب في المخزون
                </CardTitle>
                <BookOpen className="w-8 h-8 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats?.stock.total_books || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">كتاب في المخازن</p>
              </CardContent>
            </Card>

            {/* الشحنات */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  إجمالي الشحنات
                </CardTitle>
                <TruckIcon className="w-8 h-8 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats?.shipments.total || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">شحنة</p>
              </CardContent>
            </Card>

            {/* الشحنات المعلقة */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  شحنات قيد التنفيذ
                </CardTitle>
                <Package className="w-8 h-8 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {(stats?.shipments.by_status.pending || 0) + (stats?.shipments.by_status.assigned || 0) + (stats?.shipments.by_status.out_for_delivery || 0)}
                </div>
                <p className="text-xs text-gray-600 mt-1">شحنة معلقة</p>
              </CardContent>
            </Card>

            {/* الشحنات المسلمة */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  شحنات مسلمة
                </CardTitle>
                <TruckIcon className="w-8 h-8 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {(stats?.shipments.by_status.delivered || 0) + (stats?.shipments.by_status.confirmed || 0)}
                </div>
                <p className="text-xs text-gray-600 mt-1">شحنة مكتملة</p>
              </CardContent>
            </Card>

            {/* السائقون */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  السائقون النشطون
                </CardTitle>
                <Users className="w-8 h-8 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats?.couriers.active_couriers || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">من {stats?.couriers.total_ministry_couriers || 0} سائق</p>
              </CardContent>
            </Card>

            {/* طلبات المدارس */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  طلبات المدارس
                </CardTitle>
                <School className="w-8 h-8 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats?.school_requests.total || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">طلب مدرسة</p>
              </CardContent>
            </Card>

            {/* طلبات المحافظات */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate('/ministry/province-requests')}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  طلبات المحافظات
                </CardTitle>
                <FileText className="w-8 h-8 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {stats?.province_requests?.total || 0}
                </div>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-yellow-600">
                    ⏳ {stats?.province_requests?.by_status?.pending || 0} معلق
                  </span>
                  <span className="text-green-600">
                    ✅ {stats?.province_requests?.by_status?.approved || 0} موافق
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Shipments by Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TruckIcon className="w-5 h-5" />
                الشحنات حسب الحالة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">⏳ معلقة</span>
                  <Badge variant="secondary">{stats?.shipments.by_status.pending || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">📋 مكلفة</span>
                  <Badge className="bg-blue-100 text-blue-800">{stats?.shipments.by_status.assigned || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">🚚 جاري التوصيل</span>
                  <Badge className="bg-purple-100 text-purple-800">{stats?.shipments.by_status.out_for_delivery || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">📦 تم التسليم</span>
                  <Badge className="bg-green-100 text-green-800">{stats?.shipments.by_status.delivered || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">✅ مؤكدة</span>
                  <Badge className="bg-green-600 text-white">{stats?.shipments.by_status.confirmed || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Province Requests Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                طلبات المحافظات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">⏳ معلقة</span>
                  <Badge className="bg-yellow-100 text-yellow-800">{stats?.province_requests?.by_status?.pending || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">✅ موافق عليها</span>
                  <Badge className="bg-green-100 text-green-800">{stats?.province_requests?.by_status?.approved || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">❌ مرفوضة</span>
                  <Badge className="bg-red-100 text-red-800">{stats?.province_requests?.by_status?.rejected || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">📦 مكتملة</span>
                  <Badge className="bg-blue-100 text-blue-800">{stats?.province_requests?.by_status?.fulfilled || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>النشاط الأخير</CardTitle>
            <CardDescription>آخر العمليات في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">آخر 30 يوم</p>
                  <p className="text-xs text-gray-600">
                    {stats?.shipments.last_30_days || 0} شحنة جديدة
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">شحنات مكتملة</p>
                  <p className="text-xs text-gray-600">
                    {stats?.shipments.completed_last_30_days || 0} في آخر 30 يوم
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">المناديب النشطون</p>
                  <p className="text-xs text-gray-600">
                    {stats?.couriers.active_couriers || 0} من {stats?.couriers.total_ministry_couriers || 0}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </>
        )}

        {/* Warehouses Tab */}
        {activeTab === 'warehouses' && (
          <MinistryWarehouseManagementPage />
        )}

        {/* Shipments Tab */}
        {activeTab === 'shipments' && (
          <MinistryShipmentManagementPage />
        )}
      </main>
    </div>
  );
}
