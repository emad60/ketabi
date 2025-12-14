import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Plus, Save, X } from 'lucide-react';
import DashboardTopNav from '../components/DashboardTopNav';
import { useAuthStore } from '../store/authStore';

interface BookRequest {
  book_id: string;
  quantity: number;
}

export function CreateRequestPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    school_id: '',
    grade: '',
    notes: '',
  });

  const [bookRequests, setBookRequests] = useState<BookRequest[]>([
    { book_id: '', quantity: 0 }
  ]);

  const handleAddBook = () => {
    setBookRequests([...bookRequests, { book_id: '', quantity: 0 }]);
  };

  const handleRemoveBook = (index: number) => {
    const updated = bookRequests.filter((_, i) => i !== index);
    setBookRequests(updated);
  };

  const handleBookChange = (index: number, field: 'book_id' | 'quantity', value: string | number) => {
    const updated = [...bookRequests];
    updated[index] = { ...updated[index], [field]: value };
    setBookRequests(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Implement API call to create request
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('تم إنشاء الطلب بنجاح');
      setTimeout(() => {
        navigate('/province/school-requests');
      }, 1500);
    } catch (err: any) {
      setError('فشل إنشاء الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <DashboardTopNav 
        activeTab="create-request" 
        onTabChange={() => {}} 
        role={user?.role === 'ministry_admin' ? 'ministry' : 'province'} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">إنشاء طلب جديد</h1>
          <p className="text-sm text-gray-600 mt-1">إنشاء طلب كتب جديد إلى الوزارة</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>معلومات الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="school">المدرسة</Label>
                  <Input
                    id="school"
                    value={formData.school_id}
                    onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                    placeholder="اختر المدرسة"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="grade">المرحلة</Label>
                  <Input
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder="المرحلة الدراسية"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  placeholder="أضف ملاحظات إضافية..."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>الكتب المطلوبة</CardTitle>
              <Button type="button" onClick={handleAddBook} size="sm">
                <Plus className="w-4 h-4 ml-2" />
                إضافة كتاب
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {bookRequests.map((book, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label>الكتاب</Label>
                    <Input
                      value={book.book_id}
                      onChange={(e) => handleBookChange(index, 'book_id', e.target.value)}
                      placeholder="اختر الكتاب"
                      required
                    />
                  </div>
                  <div className="w-32">
                    <Label>الكمية</Label>
                    <Input
                      type="number"
                      value={book.quantity}
                      onChange={(e) => handleBookChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      min="1"
                      required
                    />
                  </div>
                  {bookRequests.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveBook(index)}
                      className="text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 ml-2" />
              {loading ? 'جاري الحفظ...' : 'حفظ الطلب'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
