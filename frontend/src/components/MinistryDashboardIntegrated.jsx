/**
 * Ministry Dashboard - Integrated with Backend
 * لوحة تحكم الوزارة المتكاملة مع الـ Backend
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import {
  Shield,
  Warehouse,
  BookOpen,
  TruckIcon,
  School,
  MapPin,
  Clock,
  CheckCircle,
  LogOut,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';

export default function MinistryDashboard() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // جلب الإحصائيات من Backend
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await api.get('/warehouses/stats/ministry/');
      console.log('✅ إحصائيات الوزارة:', response.data);
      
      setStats(response.data);
    } catch (err) {
      console.error('❌ خطأ في جلب الإحصائيات:', err);
      setError('فشل تحميل الإحصائيات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // تحديث تلقائي كل 30 ثانية
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    authService.logout();
    clearAuth();
    navigate('/login');
  };

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-20 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
        <div className="text-center mt-8">
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                وزارة التربية والتعليم
              </h1>
              <p className="text-sm text-gray-600">الجمهورية اليمنية</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-left">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchStats}>
                <RefreshCw className="w-4 h-4 ml-2" />
                إعادة المحاولة
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* المخازن */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                المخازن
              </CardTitle>
              <Warehouse className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats?.warehouses?.total || 0}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                وزارة: {stats?.warehouses?.ministry_warehouses || 0} | 
                محافظات: {stats?.warehouses?.province_warehouses || 0}
              </div>
            </CardContent>
          </Card>

          {/* الكتب */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                الكتب
              </CardTitle>
              <BookOpen className="w-5 h-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats?.stock?.total_books || 0}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                إجمالي الكتب المتوفرة
              </div>
            </CardContent>
          </Card>

          {/* الشحنات */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                الشحنات النشطة
              </CardTitle>
              <TruckIcon className="w-5 h-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {(stats?.shipments?.by_status?.pending || 0) + 
                 (stats?.shipments?.by_status?.assigned || 0) +
                 (stats?.shipments?.by_status?.out_for_delivery || 0)}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                تم التسليم: {stats?.shipments?.by_status?.delivered || 0}
              </div>
            </CardContent>
          </Card>

          {/* المدارس */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                المدارس
              </CardTitle>
              <School className="w-5 h-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {stats?.school_requests?.total || 0}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                إجمالي المدارس
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warehouses Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع المخازن حسب المحافظة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.warehouses?.by_province && stats.warehouses.by_province.length > 0 ? (
                stats.warehouses.by_province.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{item.province || 'غير محدد'}</span>
                    </div>
                    <span className="text-sm font-medium">{item.count} مخزن</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  لا توجد بيانات متاحة
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shipments Status */}
        <Card>
          <CardHeader>
            <CardTitle>حالة الشحنات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">قيد التحضير</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {stats?.shipments?.by_status?.pending || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <TruckIcon className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">في الطريق</p>
                  <p className="text-xl font-bold text-blue-600">
                    {stats?.shipments?.by_status?.out_for_delivery || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">تم التسليم</p>
                  <p className="text-xl font-bold text-green-600">
                    {stats?.shipments?.by_status?.delivered || 0}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* School Requests */}
        <Card>
          <CardHeader>
            <CardTitle>طلبات المدارس</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {stats?.school_requests?.by_status?.pending || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">قيد الانتظار</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {stats?.school_requests?.by_status?.approved || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">تم القبول</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {stats?.school_requests?.by_status?.rejected || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">مرفوض</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">
                  {stats?.school_requests?.by_status?.fulfilled || 0}
                </p>
                <p className="text-sm text-gray-600 mt-1">مكتمل</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20">
                <Warehouse className="w-5 h-5 ml-2" />
                إدارة المخازن
              </Button>
              <Button variant="outline" className="h-20">
                <BookOpen className="w-5 h-5 ml-2" />
                إدارة الكتب
              </Button>
              <Button variant="outline" className="h-20">
                <TruckIcon className="w-5 h-5 ml-2" />
                متابعة الشحنات
              </Button>
              <Button variant="outline" className="h-20">
                <School className="w-5 h-5 ml-2" />
                طلبات المدارس
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
