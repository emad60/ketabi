/**
 * Login Page - Integrated with Backend
 * صفحة تسجيل الدخول المتكاملة مع الـ Backend
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { BookOpen, Shield, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
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
      // تسجيل الدخول
      const response = await authService.login({ username, password });
      
      console.log('✅ تسجيل الدخول نجح:', response);

      // حفظ بيانات المصادقة
      setAuth(response.user, response.access, response.refresh);

      // توجيه حسب دور المستخدم
      const role = response.user.role;
      
      if (role === 'ministry_admin' || role === 'ministry_staff') {
        navigate('/ministry/dashboard');
      } else if (role === 'province_admin' || role === 'province_staff') {
        navigate('/province/dashboard');
      } else if (role === 'warehouse_manager' || role === 'ministry_warehouse' || role === 'province_warehouse') {
        navigate('/warehouse/dashboard');
      } else if (role === 'driver') {
        navigate('/driver/dashboard');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      console.error('❌ خطأ في تسجيل الدخول:', err);
      
      // معالجة الأخطاء
      if (err.response) {
        if (err.response.status === 401) {
          setError('اسم المستخدم أو كلمة المرور غير صحيحة');
        } else if (err.response.status === 400) {
          setError('يرجى التحقق من البيانات المدخلة');
        } else if (err.response.status === 500) {
          setError('خطأ في الخادم، يرجى المحاولة لاحقاً');
        } else {
          setError('حدث خطأ غير متوقع');
        }
      } else if (err.request) {
        setError('لا يمكن الاتصال بالخادم. تحقق من اتصال الإنترنت');
      } else {
        setError('حدث خطأ غير متوقع');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #fef2f2 50%, #f3f4f6 100%)'
      }}
      dir="rtl"
    >
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="flex justify-center">
            <div 
              className="relative w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #ffffff 50%, #000000 100%)',
                transform: 'rotate(-15deg)'
              }}
            >
              <Shield className="w-12 h-12 text-white" style={{ transform: 'rotate(15deg)' }} />
            </div>
          </div>

          <CardTitle className="text-2xl font-bold">
            وزارة التربية والتعليم
          </CardTitle>
          <CardDescription className="text-base">
            الجمهورية اليمنية
          </CardDescription>
          <p className="text-sm text-gray-600">
            نظام إدارة توزيع الكتب المدرسية
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600 mb-3 text-center">حسابات تجريبية:</p>
            <div className="space-y-2 text-sm">
              <div className="bg-blue-50 p-2 rounded">
                <strong>وزارة:</strong> ministry_admin / Admin@123
              </div>
              <div className="bg-purple-50 p-2 rounded">
                <strong>محافظة:</strong> province_admin / Admin@123
              </div>
              <div className="bg-green-50 p-2 rounded">
                <strong>مخزن:</strong> warehouse_admin / Admin@123
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
