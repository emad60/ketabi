import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BookOpen, School, Building2 } from 'lucide-react';

interface LoginPageProps {
  onLogin: (userType: 'ministry' | 'capital', name: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedType, setSelectedType] = useState<'ministry' | 'capital' | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password && selectedType) {
      onLogin(selectedType, username);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-5xl shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-4 rounded-full">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl">نظام إدارة توزيع الكتب المدرسية</CardTitle>
          <CardDescription className="text-lg">
            الجمهورية اليمنية - وزارة التربية والتعليم
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {!selectedType ? (
            <div>
              <h3 className="text-center mb-6 text-xl">اختر نوع الحساب</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <button
                  onClick={() => setSelectedType('ministry')}
                  className="p-8 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-blue-100 p-6 rounded-full group-hover:bg-blue-200 transition-colors">
                      <School className="w-12 h-12 text-blue-600" />
                    </div>
                    <h4 className="text-xl">وزارة التربية والتعليم</h4>
                    <p className="text-gray-600 text-center">
                      لوحة التحكم الرئيسية للوزارة
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedType('capital')}
                  className="p-8 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-purple-100 p-6 rounded-full group-hover:bg-purple-200 transition-colors">
                      <Building2 className="w-12 h-12 text-purple-600" />
                    </div>
                    <h4 className="text-xl">أمانة العاصمة صنعاء</h4>
                    <p className="text-gray-600 text-center">
                      لوحة تحكم المحافظة
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
              <div className="text-center mb-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedType(null)}
                  className="mb-4"
                >
                  ← العودة لاختيار نوع الحساب
                </Button>
                <div className="flex justify-center mb-4">
                  {selectedType === 'ministry' ? (
                    <div className="bg-blue-100 p-4 rounded-full">
                      <School className="w-10 h-10 text-blue-600" />
                    </div>
                  ) : (
                    <div className="bg-purple-100 p-4 rounded-full">
                      <Building2 className="w-10 h-10 text-purple-600" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl">
                  {selectedType === 'ministry' 
                    ? 'تسجيل دخول - وزارة التربية والتعليم'
                    : 'تسجيل دخول - أمانة العاصمة صنعاء'}
                </h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
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
                  className="text-right"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                style={{
                  backgroundColor: selectedType === 'ministry' ? '#2563eb' : '#9333ea'
                }}
              >
                تسجيل الدخول
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
