/**
 * Ketabi Login Page
 * صفحة تسجيل الدخول - وزارة التربية والتعليم - الجمهورية اليمنية
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BookOpen, Shield, AlertCircle } from 'lucide-react';

function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authService.login({ username, password });
      setAuth(response.user, response.access, response.refresh);
      
      console.log('✅ تسجيل الدخول نجح:', response.user);
      
      // التوجيه حسب الدور
      if (response.user.role === 'ministry_admin' || response.user.role === 'ministry_staff') {
        navigate('/ministry/dashboard');
      } else if (response.user.role === 'province_admin' || response.user.role === 'province_staff') {
        navigate('/province/dashboard');
      } else if (response.user.role === 'warehouse_manager' || response.user.role === 'ministry_warehouse' || response.user.role === 'province_warehouse') {
        navigate('/warehouse/dashboard');
      } else if (response.user.role === 'driver') {
        navigate('/driver/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('❌ فشل تسجيل الدخول:', err);
      
      if (err.response?.status === 401) {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      } else if (err.response?.status === 500) {
        setError('خطأ في الخادم. يرجى المحاولة لاحقاً');
      } else if (err.message === 'Network Error') {
        setError('فشل الاتصال بالخادم. تحقق من اتصالك بالإنترنت');
      } else {
        setError(err.response?.data?.detail || 'حدث خطأ أثناء تسجيل الدخول');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-red-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo and Title - Yemeni Ministry Design */}
        <div className="text-center mb-8">
          {/* Yemen Flag Colors Logo */}
          <div className="mx-auto w-24 h-24 relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-white to-black rounded-3xl shadow-2xl border-4 border-white transform rotate-3"></div>
            <div className="absolute inset-0 bg-white/20 rounded-3xl backdrop-blur-sm flex items-center justify-center">
              <BookOpen className="w-14 h-14 text-red-700 drop-shadow-lg" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-red-700 via-gray-800 to-black bg-clip-text text-transparent mb-3">
            كتابي
          </h1>
          
          <div className="space-y-1 mb-4">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              <p className="text-xl font-bold text-red-700">وزارة التربية والتعليم</p>
            </div>
            <p className="text-lg font-semibold text-gray-800">الجمهورية اليمنية</p>
            <p className="text-sm text-gray-600">نظام إدارة توزيع الكتب المدرسية</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-2 border-gray-200">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">تسجيل الدخول</CardTitle>
            <CardDescription className="text-center">
              أدخل بيانات الدخول للوصول إلى النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  required
                  className="text-right"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="text-right"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري تسجيل الدخول...</span>
                  </div>
                ) : (
                  'تسجيل الدخول'
                )}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center mb-3">حسابات تجريبية للاختبار:</p>
              <div className="space-y-2 text-xs">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-semibold text-gray-700 mb-1">🏛️ موظف الوزارة</p>
                  <p className="text-gray-600">اسم المستخدم: <span className="font-mono bg-white px-2 py-0.5 rounded">ministry_admin</span></p>
                  <p className="text-gray-600">كلمة المرور: <span className="font-mono bg-white px-2 py-0.5 rounded">Admin@123</span></p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-semibold text-gray-700 mb-1">🏙️ موظف أمانة العاصمة</p>
                  <p className="text-gray-600">اسم المستخدم: <span className="font-mono bg-white px-2 py-0.5 rounded">province_admin</span></p>
                  <p className="text-gray-600">كلمة المرور: <span className="font-mono bg-white px-2 py-0.5 rounded">Admin@123</span></p>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-semibold text-gray-700 mb-1">📦 مدير المخزن</p>
                  <p className="text-gray-600">اسم المستخدم: <span className="font-mono bg-white px-2 py-0.5 rounded">warehouse_admin</span></p>
                  <p className="text-gray-600">كلمة المرور: <span className="font-mono bg-white px-2 py-0.5 rounded">Admin@123</span></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2024 وزارة التربية والتعليم - الجمهورية اليمنية
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
