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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">نظام كتابي</h1>
                <p className="text-sm text-gray-600">لوحة تحكم المحافظة</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold text-gray-900">{user?.full_name}</p>
                <p className="text-sm text-gray-600">
                  {user?.province_name || 'موظف محافظة'}
                </p>
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

        {/* Tabs Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-reverse space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'overview'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                نظرة عامة
              </button>
              <button
                onClick={() => setActiveTab('warehouses')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'warehouses'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                المخازن
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'requests'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                طلبات المدارس
              </button>
              <button
                onClick={() => setActiveTab('couriers')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'couriers'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                السائقين
              </button>
              <button
                onClick={() => setActiveTab('shipments')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'shipments'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                الشحنات الواردة
              </button>
              <button
                onClick={() => setActiveTab('receive')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'receive'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                استلام الشحنات
              </button>
            </nav>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">الإجراءات السريعة</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => {
                    if (stats?.province_info?.warehouses?.[0]?.id) {
                      navigate(`/province/warehouse/${stats.province_info.warehouses[0].id}/stock`);
                    }
                  }}
                >
                  <Building2 className="ml-2 w-5 h-5" />
                  إدارة المخزون
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => navigate('/province/shipments')}
                >
                  <TruckIcon className="ml-2 w-5 h-5" />
                  الشحنات الواردة
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => navigate('/province/schools')}
                >
                  <School className="ml-2 w-5 h-5" />
                  إدارة المدارس
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => navigate('/province/book-requests')}
                >
                  <FileText className="ml-2 w-5 h-5" />
                  طلب كتب من الوزارة
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => navigate('/shipments/tracking')}
                >
                  <TruckIcon className="ml-2 w-5 h-5" />
                  تتبع الشحنات
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => navigate('/province/reports')}
                >
                  <BarChart3 className="ml-2 w-5 h-5" />
                  التقارير والإحصائيات
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => navigate('/province/reports')}
                >
                  <Package className="ml-2 w-5 h-5" />
                  التقارير
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
                {/* عدد المخازن */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      المخازن
                    </CardTitle>
                    <Building2 className="w-8 h-8 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.province_info.warehouses_count || 0}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">مخزن</p>
                  </CardContent>
                </Card>

                {/* الكتب في المخزون */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      المخزون الحالي
                    </CardTitle>
                    <BookOpen className="w-8 h-8 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.stock.total_books || 0}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">كتاب</p>
                  </CardContent>
                </Card>

                {/* مخزون منخفض */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      تنبيه مخزون منخفض
                    </CardTitle>
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.stock.low_stock_items || 0}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">صنف يحتاج إعادة تموين</p>
                  </CardContent>
                </Card>

                {/* الشحنات الواردة */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      الشحنات الواردة
                    </CardTitle>
                    <TruckIcon className="w-8 h-8 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.incoming_shipments.total || 0}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">شحنة</p>
                  </CardContent>
                </Card>

                {/* شحنات معلقة */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      شحنات قيد التسليم
                    </CardTitle>
                    <Package className="w-8 h-8 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {(stats?.incoming_shipments.by_status.pending || 0) + (stats?.incoming_shipments.by_status.out_for_delivery || 0)}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">شحنة قيد التنفيذ</p>
                  </CardContent>
                </Card>

                {/* شحنات مستلمة */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      شحنات مستلمة
                    </CardTitle>
                    <TruckIcon className="w-8 h-8 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">
                      {stats?.incoming_shipments.by_status.delivered || 0}
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
                      {stats?.couriers.active || 0}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">من {stats?.couriers.total || 0} سائق</p>
                  </CardContent>
                </Card>

                {/* طلبات المدارس */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      طلبات المدارس المعلقة
                    </CardTitle>
                    <School className="w-8 h-8 text-red-600" />
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
                <div className="text-center py-8 text-gray-500">
                  <p>قريباً: عرض آخر العمليات والتحديثات</p>
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
