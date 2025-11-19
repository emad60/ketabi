import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Plus, Minus, School as SchoolIcon, Building2, Loader2 } from 'lucide-react';
import shipmentService from '../services/shipmentService';
import bookService from '../services/bookService';
import schoolService from '../services/schoolService';
import api from '../services/api';

interface CreateShipmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BookItem {
  book_id: number;
  book_name: string;
  quantity: number;
}

export function CreateShipmentDialog({ open, onClose, onSuccess }: CreateShipmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [destinationType, setDestinationType] = useState<'province' | 'school'>('province');
  const [formData, setFormData] = useState({
    from_warehouse: '',
    to_warehouse: '',
    to_school: '',
    courier_role: 'ministry_courier' as 'ministry_courier' | 'province_courier',
    notes: '',
  });

  const [books, setBooks] = useState<BookItem[]>([{ book_id: 0, book_name: '', quantity: 0 }]);
  const [ministryWarehouses, setMinistryWarehouses] = useState<any[]>([]);
  const [provinceWarehouses, setProvinceWarehouses] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [availableBooks, setAvailableBooks] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      // Load ministry warehouses
      const ministryRes = await api.get('/warehouses/ministry/', {
        params: { page_size: 100 }
      });
      setMinistryWarehouses(ministryRes.data.results || ministryRes.data || []);

      // Load province warehouses
      const provinceRes = await api.get('/warehouses/province/', {
        params: { page_size: 100 }
      });
      setProvinceWarehouses(provinceRes.data.results || provinceRes.data || []);

      // Load schools
      try {
        const schoolsData = await schoolService.getSchools();
        setSchools(Array.isArray(schoolsData) ? schoolsData : []);
      } catch (err) {
        console.warn('Could not load schools:', err);
        setSchools([]);
      }

      // Load available books
      try {
        const booksData = await bookService.getBooks();
        setAvailableBooks(Array.isArray(booksData) ? booksData : []);
      } catch (err) {
        console.warn('Could not load books:', err);
        setAvailableBooks([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addBookRow = () => {
    setBooks([...books, { book_id: 0, book_name: '', quantity: 0 }]);
  };

  const removeBookRow = (index: number) => {
    if (books.length > 1) {
      setBooks(books.filter((_, i) => i !== index));
    }
  };

  const updateBook = (index: number, field: keyof BookItem, value: any) => {
    const newBooks = [...books];
    
    if (field === 'book_id') {
      newBooks[index].book_id = parseInt(value);
      const book = availableBooks.find(b => b.id === parseInt(value));
      if (book) {
        newBooks[index].book_name = `${book.subject_display} - ${book.grade_display}`;
      }
    } else if (field === 'quantity') {
      newBooks[index].quantity = parseInt(value) || 0;
    } else if (field === 'book_name') {
      newBooks[index].book_name = value;
    }
    
    setBooks(newBooks);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate
      if (!formData.from_warehouse) {
        alert('يرجى اختيار المستودع المرسل');
        return;
      }

      if (destinationType === 'province' && !formData.to_warehouse) {
        alert('يرجى اختيار مستودع المحافظة');
        return;
      }

      if (destinationType === 'school' && !formData.to_school) {
        alert('يرجى اختيار المدرسة');
        return;
      }

      if (books.some(b => !b.book_id || b.quantity <= 0)) {
        alert('يرجى ملء بيانات الكتب بشكل صحيح');
        return;
      }

      // Use direct API call with correct backend structure
      const payload: any = {
        from_ministry: parseInt(formData.from_warehouse),
        books: books.map(b => ({
          book_id: b.book_id,
          quantity: b.quantity,
          term: 'first' // افتراضياً الترم الأول، يمكن إضافة حقل لاختياره لاحقاً
        })),
        courier_role: formData.courier_role,
        notes: formData.notes || ''
      };

      if (destinationType === 'province') {
        payload.to_province = parseInt(formData.to_warehouse);
      } else {
        payload.to_school_name = formData.to_school;
      }

      console.log('Sending shipment payload:', payload);
      await api.post('/warehouses/shipments/', payload);
      
      alert('تم إنشاء الشحنة بنجاح! ✅');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        from_warehouse: '',
        to_warehouse: '',
        to_school: '',
        courier_role: 'ministry_courier',
        notes: '',
      });
      setBooks([{ book_id: 0, book_name: '', quantity: 0 }]);
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.detail 
        || error.response?.data?.message 
        || JSON.stringify(error.response?.data)
        || 'حدث خطأ أثناء إنشاء الشحنة';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إنشاء شحنة جديدة</DialogTitle>
          <DialogDescription>
            أدخل معلومات الشحنة وحدد الكتب المراد شحنها
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Source Warehouse */}
          <div>
            <Label>المستودع المرسل *</Label>
            <Select value={formData.from_warehouse} onValueChange={(value) => setFormData({ ...formData, from_warehouse: value })}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المستودع" />
              </SelectTrigger>
              <SelectContent>
                {ministryWarehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    {warehouse.name} - {warehouse.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destination Type */}
          <div>
            <Label>نوع الوجهة *</Label>
            <div className="flex gap-4 mt-2">
              <Button
                type="button"
                variant={destinationType === 'province' ? 'default' : 'outline'}
                onClick={() => setDestinationType('province')}
                className="flex-1"
              >
                <Building2 className="ml-2 w-4 h-4" />
                مستودع محافظة
              </Button>
              <Button
                type="button"
                variant={destinationType === 'school' ? 'default' : 'outline'}
                onClick={() => setDestinationType('school')}
                className="flex-1"
              >
                <SchoolIcon className="ml-2 w-4 h-4" />
                مدرسة
              </Button>
            </div>
          </div>

          {/* Destination */}
          {destinationType === 'province' ? (
            <div>
              <Label>مستودع المحافظة *</Label>
              <Select value={formData.to_warehouse} onValueChange={(value) => setFormData({ ...formData, to_warehouse: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مستودع المحافظة" />
                </SelectTrigger>
                <SelectContent>
                  {provinceWarehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name} - {warehouse.province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div>
              <Label>المدرسة *</Label>
              <Select value={formData.to_school} onValueChange={(value) => {
                const selectedSchool = schools.find(s => s.id.toString() === value);
                setFormData({ ...formData, to_school: selectedSchool?.name || value });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المدرسة" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id.toString()}>
                      {school.name} - {school.province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Courier Role */}
          <div>
            <Label>نوع السائق *</Label>
            <Select value={formData.courier_role} onValueChange={(value: any) => setFormData({ ...formData, courier_role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ministry_courier">سائق الوزارة</SelectItem>
                <SelectItem value="province_courier">سائق المحافظة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Books */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>الكتب *</Label>
              <Button type="button" size="sm" variant="outline" onClick={addBookRow}>
                <Plus className="w-4 h-4 ml-1" />
                إضافة كتاب
              </Button>
            </div>

            {books.map((book, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    value={book.book_id.toString()}
                    onValueChange={(value) => updateBook(index, 'book_id', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الكتاب" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBooks.map((b) => (
                        <SelectItem key={b.id} value={b.id.toString()}>
                          {b.subject_display} - {b.grade_display} - الفصل {b.term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    placeholder="الكمية"
                    min="1"
                    value={book.quantity || ''}
                    onChange={(e) => updateBook(index, 'quantity', parseInt(e.target.value) || 0)}
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => removeBookRow(index)}
                  disabled={books.length === 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <Label>ملاحظات</Label>
            <Input
              placeholder="ملاحظات إضافية (اختياري)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <>
                <Loader2 className="ml-2 w-4 h-4 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              'إنشاء الشحنة'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
