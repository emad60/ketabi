/**
 * Capital Dashboard - أمانة العاصمة صنعاء
 * لوحة تحكم أمانة العاصمة
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import { 
  Building2, Package, TruckIcon, School, Users, 
  RefreshCw, LogOut, BookOpen, AlertTriangle, CheckCircle,
  Clock, BarChart3
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function CapitalDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/warehouses/statistics/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('✅ إحصائيات أمانة العاصمة:', response.data);
      setStatistics(response.data);
    } catch (err) {
      console.error('❌ خطأ في تحميل الإحصائيات:', err);
      setError('فشل تحميل الإحصائيات. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatistics, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 via-white to-black rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-red-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">أمانة العاصمة صنعاء</h1>
                <p className="text-sm text-gray-600">نظام إدارة توزيع الكتب المدرسية</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-left pl-4 border-l border-gray-300">
                <p className="text-sm font-semibold text-gray-900">{user?.full_name || user?.username}</p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'province_admin' ? 'مدير أمانة العاصمة' : 'موظف أمانة العاصمة'}
                </p>
              </div>
              
              <Button
                onClick={fetchStatistics}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                تحديث
              </Button>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="gap-2 text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                تسجيل خروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-r-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
              <Button
                onClick={fetchStatistics}
                variant="ghost"
                size="sm"
                className="mt-2 text-red-600 hover:bg-red-100"
              >
                <RefreshCw className="w-3 h-3 ml-2" />
                إعادة المحاولة
              </Button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Schools */}
          <Card className="border-r-4 border-blue-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">إجمالي المدارس</CardTitle>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <School className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statistics?.schools?.total || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">مدارس أمانة العاصمة</p>
            </CardContent>
          </Card>

          {/* Total Books */}
          <Card className="border-r-4 border-green-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">إجمالي الكتب</CardTitle>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statistics?.stock?.total_books?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">كتب في المخازن</p>
            </CardContent>
          </Card>

          {/* Active Shipments */}
          <Card className="border-r-4 border-orange-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">الشحنات النشطة</CardTitle>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TruckIcon className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {(statistics?.shipments?.by_status?.in_transit || 0) + 
                 (statistics?.shipments?.by_status?.preparing || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">شحنات قيد التسليم</p>
            </CardContent>
          </Card>

          {/* Warehouses */}
          <Card className="border-r-4 border-purple-500 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">المخازن</CardTitle>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statistics?.warehouses?.total || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">مخازن تابعة للأمانة</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* School Requests */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="w-5 h-5 text-blue-600" />
                طلبات المدارس
              </CardTitle>
              <CardDescription>حالة طلبات الكتب من المدارس</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-gray-900">قيد الانتظار</span>
                  </div>
                  <Badge variant="warning" className="text-lg px-4">
                    {statistics?.requests?.by_status?.pending || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">تم القبول</span>
                  </div>
                  <Badge variant="success" className="text-lg px-4">
                    {statistics?.requests?.by_status?.approved || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TruckIcon className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">قيد التسليم</span>
                  </div>
                  <Badge className="text-lg px-4">
                    {statistics?.requests?.by_status?.in_progress || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">مكتمل</span>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4">
                    {statistics?.requests?.by_status?.completed || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Distribution */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                توزيع المخزون
              </CardTitle>
              <CardDescription>الكتب في المخازن حسب النوع</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics?.stock?.by_category && Object.entries(statistics.stock.by_category).map(([category, count]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{category}</span>
                      <span className="text-sm font-bold text-gray-900">{count.toLocaleString()} كتاب</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((count / statistics.stock.total_books) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
                
                {(!statistics?.stock?.by_category || Object.keys(statistics.stock.by_category).length === 0) && (
                  <p className="text-center text-gray-500 py-8">لا توجد بيانات لعرضها</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-auto py-4"
          >
            <School className="w-5 h-5 ml-2" />
            إدارة المدارس
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="border-2 h-auto py-4"
          >
            <Package className="w-5 h-5 ml-2" />
            إدارة المخازن
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="border-2 h-auto py-4"
          >
            <TruckIcon className="w-5 h-5 ml-2" />
            متابعة الشحنات
          </Button>
        </div>
      </main>
    </div>
  );
}
