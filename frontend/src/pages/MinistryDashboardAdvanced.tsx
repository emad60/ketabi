import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import {
  Building2, FileText, TruckIcon, Package, BarChart3, Users, AlertTriangle, CheckCircle, Clock, XCircle, MapPin
} from 'lucide-react';
import DashboardTopNav from '../components/DashboardTopNav';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/apiService';

interface MinistryStats {
  total_provinces: number;
  active_requests: number;
  pending_shipments: number;
  delivered_shipments: number;
  total_books_distributed: number;
  warehouse_stock: number;
  active_couriers: number;
  recent_alerts: Array<{
    id: number;
    type: 'request' | 'shipment' | 'inventory';
    severity: 'high' | 'medium' | 'low';
    message: string;
    timestamp: string;
  }>;
  province_stats: Array<{
    id: number;
    name: string;
    pending_requests: number;
    active_shipments: number;
  }>;
}

export function MinistryDashboardAdvanced() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<MinistryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ministryName] = useState('وزارة التربية والتعليم');

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // تحديث كل دقيقة
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data: any = await apiService.getMinistryStats();
      
      // معالجة البيانات المتداخلة - التعامل مع number أو object
      const processedStats: MinistryStats = {
        total_provinces: data.total_provinces || 0,
        active_requests: typeof data.active_requests === 'object' ? (data.active_requests?.total || 0) : (data.active_requests || 0),
        pending_shipments: typeof data.pending_shipments === 'object' ? (data.pending_shipments?.total || 0) : (data.pending_shipments || 0),
        delivered_shipments: typeof data.delivered_shipments === 'object' ? (data.delivered_shipments?.total || 0) : (data.delivered_shipments || 0),
        total_books_distributed: data.total_books_distributed || 0,
        warehouse_stock: data.warehouse_stock || 0,
        active_couriers: data.active_couriers || 0,
        recent_alerts: Array.isArray(data.recent_alerts) ? data.recent_alerts : [],
        province_stats: Array.isArray(data.province_stats) ? data.province_stats : [],
      };
      
      setStats(processedStats);
      setError('');
    } catch (err: any) {
      console.error('Error fetching ministry stats:', err);
      setError('فشل تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
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
      <DashboardTopNav activeTab="overview" onTabChange={() => {}} role="ministry" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* اسم الوزارة */}
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-purple-600 to-purple-800 text-white border-0">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">{ministryName}</h2>
                  <p className="text-purple-100 text-sm">نظام إدارة توزيع الكتب المدرسية</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* الإشعارات والتنبيهات */}
        {stats?.recent_alerts && stats.recent_alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {stats.recent_alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-r-4 flex items-start gap-3 ${
                  alert.severity === 'high'
                    ? 'bg-red-50 border-red-400'
                    : alert.severity === 'medium'
                    ? 'bg-yellow-50 border-yellow-400'
                    : 'bg-blue-50 border-blue-400'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  alert.severity === 'high' ? 'text-red-600' : 'text-yellow-600'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-sm">{alert.message}</p>
                  <p className="text-xs text-gray-600 mt-1">{alert.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* الإحصائيات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* المحافظات */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">المحافظات</CardTitle>
              <MapPin className="w-8 h-8 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{stats?.total_provinces || 0}</div>
              <p className="text-xs text-purple-700 mt-1">محافظة نشطة</p>
            </CardContent>
          </Card>

          {/* الطلبات المعلقة */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-yellow-900">طلبات معلقة</CardTitle>
              <FileText className="w-8 h-8 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-900">{stats?.active_requests || 0}</div>
              <p className="text-xs text-yellow-700 mt-1">تحتاج معالجة فورية</p>
            </CardContent>
          </Card>

          {/* الشحنات قيد الطريق */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">شحنات قيد الطريق</CardTitle>
              <TruckIcon className="w-8 h-8 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{stats?.pending_shipments || 0}</div>
              <p className="text-xs text-blue-700 mt-1">في الطريق إلى المحافظات</p>
            </CardContent>
          </Card>

          {/* الكتب الموزعة */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-900">كتب موزعة</CardTitle>
              <Package className="w-8 h-8 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {(stats?.total_books_distributed || 0).toLocaleString()}
              </div>
              <p className="text-xs text-green-700 mt-1">في هذا الموسم</p>
            </CardContent>
          </Card>
        </div>

        {/* المحافظات وحالتها */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>حالة المحافظات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats?.province_stats.map((province) => (
                <div
                  key={province.id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/ministry/province/${province.id}/details`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{province.name}</h3>
                    <MapPin className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">طلبات معلقة:</span>
                      <Badge variant="outline">{province.pending_requests}</Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">شحنات نشطة:</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {province.active_shipments}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* الإجراءات السريعة */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">الإجراءات السريعة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => navigate('/ministry/province-requests')}
              className="h-auto py-4 justify-start flex items-center gap-3"
              variant="outline"
            >
              <div className="bg-yellow-50 p-2 rounded-md">
                <FileText className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="font-medium">طلبات المحافظات</span>
            </Button>

            <Button
              onClick={() => navigate('/ministry/shipments')}
              className="h-auto py-4 justify-start flex items-center gap-3"
              variant="outline"
            >
              <div className="bg-blue-50 p-2 rounded-md">
                <TruckIcon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium">إدارة الشحنات</span>
            </Button>

            <Button
              onClick={() => navigate('/ministry/warehouses')}
              className="h-auto py-4 justify-start flex items-center gap-3"
              variant="outline"
            >
              <div className="bg-purple-50 p-2 rounded-md">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <span className="font-medium">المخازن</span>
            </Button>

            <Button
              onClick={() => navigate('/ministry/reports')}
              className="h-auto py-4 justify-start flex items-center gap-3"
              variant="outline"
            >
              <div className="bg-green-50 p-2 rounded-md">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-medium">التقارير</span>
            </Button>
          </div>
        </div>

        {/* آخر العمليات */}
        <Card>
          <CardHeader>
            <CardTitle>ملخص الأداء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">الشحنات المسلمة</span>
                </div>
                <span className="font-semibold text-green-600">
                  {stats?.delivered_shipments || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">مناديب نشطون</span>
                </div>
                <span className="font-semibold text-blue-600">{stats?.active_couriers || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-purple-600" />
                  <span className="text-sm">المخزون الحالي</span>
                </div>
                <span className="font-semibold text-purple-600">
                  {(stats?.warehouse_stock || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
