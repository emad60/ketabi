import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import {
  School, FileText, TruckIcon, Package, BarChart3, AlertTriangle, CheckCircle, Clock, Building2
} from 'lucide-react';
import DashboardTopNav from '../components/DashboardTopNav';
import { useAuthStore } from '../store/authStore';
import { apiService } from '../services/apiService';

interface SchoolRequest {
  id: number;
  school_name: string;
  status: 'pending' | 'approved' | 'rejected';
  items_count: number;
  created_at: string;
}

interface ProvinceStats {
  total_schools: number;
  pending_school_requests: number;
  approved_school_requests: number;
  incoming_shipments: number;
  outgoing_shipments: number;
  current_inventory: number;
  low_stock_items: number;
  active_couriers: number;
  recent_alerts: Array<{
    id: number;
    type: 'request' | 'shipment' | 'inventory';
    severity: 'high' | 'medium' | 'low';
    message: string;
    timestamp: string;
  }>;
  school_requests: SchoolRequest[];
}

const ProvinceDashboardAdvanced: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<ProvinceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // تحديث كل دقيقة
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      if (user?.province) {
        const data: any = await apiService.getProvinceStats(user.province);
        
        // معالجة البيانات المتداخلة
        const processedStats: ProvinceStats = {
          total_schools: data.total_schools || 0,
          pending_school_requests: typeof data.pending_requests === 'object' ? (data.pending_requests?.total || 0) : (data.pending_requests || 0),
          approved_school_requests: typeof data.approved_requests === 'object' ? (data.approved_requests?.total || 0) : (data.approved_requests || 0),
          incoming_shipments: typeof data.active_shipments === 'object' ? (data.active_shipments?.total || 0) : (data.active_shipments || 0),
          outgoing_shipments: typeof data.delivered_shipments === 'object' ? (data.delivered_shipments?.total || 0) : (data.delivered_shipments || 0),
          current_inventory: data.total_books || data.warehouse_stock || 0,
          low_stock_items: data.low_stock_items || 0,
          active_couriers: data.active_drivers || data.active_couriers || 0,
          recent_alerts: [],
          school_requests: Array.isArray(data.school_stats) ? data.school_stats : (Array.isArray(data.recent_activity) ? data.recent_activity : []),
        };
        
        setStats(processedStats);
        setError('');
      }
    } catch (err: any) {
      console.error('Error fetching province stats:', err);
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
      <DashboardTopNav activeTab="overview" onTabChange={() => {}} role="province" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* التنبيهات والإشعارات */}
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
          {/* المدارس */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">المدارس</CardTitle>
              <School className="w-8 h-8 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{stats?.total_schools || 0}</div>
              <p className="text-xs text-blue-700 mt-1">مدرسة تابعة</p>
            </CardContent>
          </Card>

          {/* طلبات المدارس المعلقة */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-yellow-900">طلبات معلقة</CardTitle>
              <FileText className="w-8 h-8 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-900">
                {stats?.pending_school_requests || 0}
              </div>
              <p className="text-xs text-yellow-700 mt-1">بانتظار المراجعة</p>
            </CardContent>
          </Card>

          {/* الشحنات الواردة */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">واردات</CardTitle>
              <TruckIcon className="w-8 h-8 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {stats?.incoming_shipments || 0}
              </div>
              <p className="text-xs text-purple-700 mt-1">من الوزارة</p>
            </CardContent>
          </Card>

          {/* المخزون الحالي */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-900">مخزون</CardTitle>
              <Package className="w-8 h-8 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {(stats?.current_inventory || 0).toLocaleString()}
              </div>
              <p className="text-xs text-green-700 mt-1">كتاب متاح</p>
            </CardContent>
          </Card>
        </div>

        {/* الإجراءات السريعة */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">الإجراءات السريعة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => navigate('/province/incoming-school-requests')}
              className="h-auto py-4 justify-start flex items-center gap-3"
              variant="outline"
            >
              <div className="bg-green-50 p-2 rounded-md">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-medium">طلبات واردة</span>
            </Button>

            <Button
              onClick={() => navigate('/province/school-requests')}
              className="h-auto py-4 justify-start flex items-center gap-3"
              variant="outline"
            >
              <div className="bg-blue-50 p-2 rounded-md">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium">طلبات المدارس</span>
            </Button>

            <Button
              onClick={() => navigate('/province/create-request')}
              className="h-auto py-4 justify-start flex items-center gap-3"
              variant="outline"
            >
              <div className="bg-purple-50 p-2 rounded-md">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <span className="font-medium">طلب للوزارة</span>
            </Button>

            <Button
              onClick={() => navigate('/province/track-shipments')}
              className="h-auto py-4 justify-start flex items-center gap-3"
              variant="outline"
            >
              <div className="bg-green-50 p-2 rounded-md">
                <TruckIcon className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-medium">تتبع الشحنات</span>
            </Button>

            <Button
              onClick={() => navigate('/province/reports')}
              className="h-auto py-4 justify-start flex items-center gap-3"
              variant="outline"
            >
              <div className="bg-orange-50 p-2 rounded-md">
                <BarChart3 className="w-5 h-5 text-orange-600" />
              </div>
              <span className="font-medium">التقارير</span>
            </Button>
          </div>
        </div>

        {/* طلبات المدارس الأخيرة */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>أحدث طلبات المدارس</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.school_requests && stats.school_requests.length > 0 ? (
                stats.school_requests.slice(0, 5).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/province/school-requests/${request.id}`)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <School className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">{request.school_name}</p>
                        <p className="text-xs text-gray-600">
                          {request.items_count} كتاب • {request.created_at}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        request.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {request.status === 'approved'
                        ? 'موافق'
                        : request.status === 'pending'
                        ? 'معلق'
                        : 'مرفوض'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-gray-600">لا توجد طلبات حديثة</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ملخص الأداء */}
        <Card>
          <CardHeader>
            <CardTitle>ملخص الأداء</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">طلبات معتمدة</span>
                </div>
                <span className="font-semibold text-green-600">
                  {stats?.approved_school_requests || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TruckIcon className="w-5 h-5 text-blue-600" />
                  <span className="text-sm">شحنات صادرة</span>
                </div>
                <span className="font-semibold text-blue-600">
                  {stats?.outgoing_shipments || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-sm">مخزون منخفض</span>
                </div>
                <span className="font-semibold text-red-600">{stats?.low_stock_items || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <span className="text-sm">مناديب نشطون</span>
                </div>
                <span className="font-semibold text-purple-600">{stats?.active_couriers || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
export default ProvinceDashboardAdvanced;
