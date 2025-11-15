/**
 * Create Book Request Component
 * مكون إنشاء طلب كتب جديد
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { 
  BookOpen, School, Package, Plus, Trash2, 
  Save, X, AlertCircle, CheckCircle 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function CreateBookRequest() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [schools, setSchools] = useState([]);
  
  const [formData, setFormData] = useState({
    school: '',
    notes: '',
    items: [],
  });

  const [currentItem, setCurrentItem] = useState({
    book: '',
    quantity: 1,
  });

  useEffect(() => {
    if (open) {
      fetchBooks();
      fetchSchools();
    }
  }, [open]);

  const fetchBooks = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/books/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBooks(response.data.results || response.data);
    } catch (error) {
      console.error('خطأ في تحميل الكتب:', error);
    }
  };

  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/schools/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchools(response.data.results || response.data);
    } catch (error) {
      console.error('خطأ في تحميل المدارس:', error);
    }
  };

  const addItem = () => {
    if (!currentItem.book || currentItem.quantity <= 0) {
      alert('يرجى اختيار كتاب وإدخال كمية صحيحة');
      return;
    }

    const book = books.find((b) => b.id === parseInt(currentItem.book));
    if (!book) return;

    const newItem = {
      book: currentItem.book,
      bookName: book.title,
      quantity: currentItem.quantity,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setCurrentItem({ book: '', quantity: 1 });
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.school) {
      alert('يرجى اختيار المدرسة');
      return;
    }

    if (formData.items.length === 0) {
      alert('يرجى إضافة كتاب واحد على الأقل');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        school: formData.school,
        notes: formData.notes,
        items: formData.items.map((item) => ({
          book: item.book,
          quantity: item.quantity,
        })),
      };

      await axios.post(`${API_URL}/book-requests/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('✅ تم إنشاء الطلب بنجاح');
      setOpen(false);
      setFormData({ school: '', notes: '', items: [] });
    } catch (error) {
      console.error('خطأ في إنشاء الطلب:', error);
      alert('❌ فشل إنشاء الطلب. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          إنشاء طلب جديد
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <BookOpen className="w-6 h-6 text-blue-600" />
            إنشاء طلب كتب جديد
          </DialogTitle>
          <DialogDescription>
            أدخل بيانات طلب الكتب للمدرسة
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* School Selection */}
          <div className="space-y-2">
            <Label htmlFor="school">المدرسة *</Label>
            <Select
              value={formData.school}
              onValueChange={(value) => setFormData({ ...formData, school: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المدرسة" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id.toString()}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add Book Item */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg">إضافة كتاب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="book">الكتاب</Label>
                  <Select
                    value={currentItem.book}
                    onValueChange={(value) => setCurrentItem({ ...currentItem, book: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الكتاب" />
                    </SelectTrigger>
                    <SelectContent>
                      {books.map((book) => (
                        <SelectItem key={book.id} value={book.id.toString()}>
                          {book.title} - {book.grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">الكمية</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={currentItem.quantity}
                      onChange={(e) =>
                        setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })
                      }
                      className="text-right"
                    />
                    <Button type="button" onClick={addItem} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          {formData.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  الكتب المطلوبة ({formData.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.bookName}</p>
                        <p className="text-sm text-gray-600">الكمية: {item.quantity}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات</Label>
            <Input
              id="notes"
              placeholder="أدخل أي ملاحظات إضافية (اختياري)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="text-right"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ الطلب
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
