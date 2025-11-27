import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { BookOpen, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ username, password });
      
      console.log('Login response:', response);
      
      // حفظ بيانات المستخدم في Store
      setAuth(response.user, response.access, response.refresh);
      
      console.log('Auth set, navigating to dashboard...');
      
      // استخدام setTimeout لتجنب مشاكل التوجيه الفوري
      setTimeout(() => {
        // توجيه المستخدم حسب نوع الدور
        switch (response.user.role) {
          case 'ministry_admin':
          case 'ministry_staff':
          case 'ministry_warehouse':
            navigate('/ministry/dashboard', { replace: true });
            break;
          case 'province_admin':
          case 'province_staff':
          case 'province_warehouse':
            navigate('/province/dashboard', { replace: true });
            break;
          case 'warehouse_manager':
            navigate('/warehouse/dashboard', { replace: true });
            break;
          case 'driver':
            navigate('/driver/dashboard', { replace: true });
            break;
          case 'school_staff':
            navigate('/school/dashboard', { replace: true });
            break;
          default:
            navigate('/dashboard', { replace: true });
        }
      }, 100);
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.detail || 'حدث خطأ أثناء تسجيل الدخول';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-4 rounded-full">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl">نظام كتابي</CardTitle>
          <CardDescription className="text-lg">
            نظام إدارة توزيع الكتب المدرسية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                placeholder="أدخل اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                className="text-right"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="أدخل كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="text-right"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جارِ تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>
            
            <div className="text-center text-sm text-gray-600 mt-4">
              <p>للاختبار:</p>
              <p className="font-mono">ministry_admin / Admin@123</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
