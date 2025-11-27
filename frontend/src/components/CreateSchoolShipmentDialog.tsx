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
import { Loader2, CheckCircle, Package, Truck } from 'lucide-react';
import api from '../services/api';

interface CreateSchoolShipmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: any; // SchoolRequest object
}

interface BookItem {
  book_id: number;
  book_name: string;
  subject_display: string;
  grade_display: string;
  quantity: number;
}

export function CreateSchoolShipmentDialog({ 
  open, 
  onClose, 
  onSuccess,
  request,
}: CreateSchoolShipmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    from_warehouse: '',
    to_school_id: '',
    to_school_name: '',
    notes: '',
  });

  const [books, setBooks] = useState<BookItem[]>([]);
  const [provinceWarehouses, setProvinceWarehouses] = useState<any[]>([]);

  useEffect(() => {
    if (open && request) {
      loadData();
      prepareBooks();
    }
  }, [open, request]);

  const loadData = async () => {
    try {
      // Load province warehouses
      const provinceRes = await api.get('/warehouses/province/', {
        params: { page_size: 100 }
      });
      setProvinceWarehouses(provinceRes.data.results || provinceRes.data || []);

      // Set school info from request
      if (request.school) {
        setFormData(prev => ({
          ...prev,
          to_school_id: request.school.id?.toString() || '',
          to_school_name: request.school.name || ''
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('خطأ في تحميل البيانات');
    }
  };

  const prepareBooks = () => {
    if (!request?.items) return;

    // Map request items to book items format
    const bookItems: BookItem[] = request.items.map((item: any) => ({
      book_id: item.book?.id || item.book_id,
      book_name: item.book?.title || 'غير محدد',
      subject_display: item.book?.subject_display || '-',
      grade_display: item.book?.grade_display || '-',
      quantity: item.quantity || 0,
    }));

    setBooks(bookItems);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate
      if (!formData.from_warehouse) {
        alert('يرجى اختيار مستودع المحافظة المرسل');
        return;
      }

      if (!formData.to_school_name) {
        alert('يرجى إدخال اسم المدرسة');
        return;
      }

      if (books.length === 0) {
        alert('لا توجد كتب في الطلب لإنشاء الشحنة');
        return;
      }

      // Create shipment payload for Province → School
      const payload = {
        from_province: parseInt(formData.from_warehouse),
        to_school_name: formData.to_school_name,
        books: books.map(b => ({
          book_id: b.book_id,
          quantity: b.quantity,
          term: 'first' // يمكن تعديله حسب الحاجة
        })),
        courier_role: 'province_courier',
        notes: formData.notes || `شحنة للمدرسة: ${formData.to_school_name} - طلب رقم ${request.id}`,
        related_school_request_id: request.id, // للربط مع الطلب
      };

      console.log('Creating school shipment:', payload);
      const response = await api.post('/warehouses/shipments/', payload);
      
      // Update school request status to fulfilled
      try {
        await api.patch(`/school-requests/${request.id}/`, {
          status: 'fulfilled'
        });
      } catch (err) {
        console.error('Error updating request status:', err);
      }

      alert('✅ تم إنشاء الشحنة للمدرسة بنجاح!');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        from_warehouse: '',
        to_school_id: '',
        to_school_name: '',
        notes: '',
      });
    } catch (error: any) {
      console.error('Error creating school shipment:', error);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            إنشاء شحنة للمدرسة
          </DialogTitle>
          <DialogDescription>
            إنشاء شحنة من مستودع المحافظة إلى المدرسة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warehouse Selection */}
          <div className="space-y-2">
            <Label>مستودع المحافظة (المرسل) *</Label>
            <Select
              value={formData.from_warehouse}
              onValueChange={(value) => setFormData({ ...formData, from_warehouse: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المستودع المرسل" />
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

          {/* School Info */}
          <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm text-gray-600">المدرسة المستلمة</Label>
              <p className="font-medium">{formData.to_school_name || 'غير محدد'}</p>
            </div>
          </div>

          {/* Books Table */}
          <div className="space-y-2">
            <Label>الكتب المطلوبة</Label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-right">الكتاب</th>
                    <th className="px-4 py-2 text-right">المادة</th>
                    <th className="px-4 py-2 text-right">الصف</th>
                    <th className="px-4 py-2 text-right">الكمية</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        لا توجد كتب
                      </td>
                    </tr>
                  ) : (
                    books.map((book, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-2">{book.book_name}</td>
                        <td className="px-4 py-2">{book.subject_display}</td>
                        <td className="px-4 py-2">{book.grade_display}</td>
                        <td className="px-4 py-2 font-medium">{book.quantity}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>ملاحظات (اختياري)</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أدخل أي ملاحظات إضافية..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                إنشاء الشحنة
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
