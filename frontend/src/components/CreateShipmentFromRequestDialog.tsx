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
import { Loader2, CheckCircle, Package } from 'lucide-react';
import api from '../services/api';

interface CreateShipmentFromRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: any; // ProvinceRequest object
  approvedItems: Array<{ id: number; approved_quantity: number }>;
}

interface BookItem {
  book_id: number;
  book_name: string;
  subject_display: string;
  grade_display: string;
  quantity: number;
}

export function CreateShipmentFromRequestDialog({ 
  open, 
  onClose, 
  onSuccess,
  request,
  approvedItems
}: CreateShipmentFromRequestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    from_warehouse: '',
    to_warehouse: '', // Add manual province warehouse selection
    notes: '',
  });

  const [books, setBooks] = useState<BookItem[]>([]);
  const [ministryWarehouses, setMinistryWarehouses] = useState<any[]>([]);
  const [provinceWarehouses, setProvinceWarehouses] = useState<any[]>([]);

  useEffect(() => {
    if (open && request) {
      loadData();
      prepareBooks();
    }
  }, [open, request, approvedItems]);

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
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const prepareBooks = () => {
    if (!request?.items) return;

    console.log('[DEBUG] Request items:', request.items);
    console.log('[DEBUG] Approved items:', approvedItems);

    // Map approved items to book items format
    const bookItems: BookItem[] = request.items
      .map((item: any) => {
        const approvedItem = approvedItems.find(ai => ai.id === item.id);
        if (!approvedItem || approvedItem.approved_quantity <= 0) return null;

        // Extract book_id from various possible locations
        const bookId = item.book_id || item.book?.id || item.book;
        
        console.log('[DEBUG] Processing item:', {
          itemId: item.id,
          rawItem: item,
          extractedBookId: bookId,
          approvedQty: approvedItem.approved_quantity
        });

        if (!bookId) {
          console.error('[DEBUG] No book_id found for item:', item);
          return null;
        }

        return {
          book_id: typeof bookId === 'object' ? bookId.id : bookId,
          book_name: item.book?.title || item.book_title || 'غير محدد',
          subject_display: item.subject || item.book?.subject_display || '-',
          grade_display: item.grade || item.book?.grade_display || '-',
          quantity: approvedItem.approved_quantity,
        };
      })
      .filter(Boolean) as BookItem[];

    console.log('[DEBUG] Prepared books:', bookItems);
    setBooks(bookItems);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate
      if (!formData.from_warehouse) {
        alert('يرجى اختيار المستودع المرسل');
        return;
      }

      if (!formData.to_warehouse) {
        alert('يرجى اختيار مستودع المحافظة المستلم');
        return;
      }

      if (books.length === 0) {
        alert('لا توجد كتب موافق عليها لإنشاء الشحنة');
        return;
      }

      // Create shipment payload
      const payload = {
        from_ministry: parseInt(formData.from_warehouse),
        to_province: parseInt(formData.to_warehouse),
        books: books.map(b => ({
          book_id: b.book_id,
          quantity: b.quantity,
          term: 'first' // يمكن تعديله حسب الحاجة
        })),
        courier_role: 'ministry_courier',
        notes: formData.notes || `شحنة خاصة بالطلب رقم ${request.request_number || request.id}`,
        related_request_id: request.id, // للربط مع الطلب
      };

      console.log('Creating shipment from request:', payload);
      console.log('Payload stringified:', JSON.stringify(payload, null, 2));
      const response = await api.post('/warehouses/shipments/', payload);
      
      alert('✅ تم إنشاء الشحنة بنجاح!');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        from_warehouse: '',
        to_warehouse: '',
        notes: '',
      });
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMsg = 'حدث خطأ أثناء إنشاء الشحنة';
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Handle field-specific errors
        if (typeof data === 'object' && !Array.isArray(data)) {
          const errorMessages = [];
          for (const [field, messages] of Object.entries(data)) {
            if (Array.isArray(messages)) {
              errorMessages.push(`${field}: ${messages.join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${messages}`);
            }
          }
          if (errorMessages.length > 0) {
            errorMsg = errorMessages.join('\n');
          }
        } else if (data.detail) {
          errorMsg = data.detail;
        } else if (data.message) {
          errorMsg = data.message;
        } else {
          errorMsg = JSON.stringify(data);
        }
      }
      
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            إنشاء شحنة من الطلب
          </DialogTitle>
          <DialogDescription>
            إنشاء شحنة للكتب الموافق عليها من الطلب رقم: {request?.request_number || request?.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* معلومات الطلب */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 font-semibold text-blue-900">
              <CheckCircle className="w-5 h-5" />
              تفاصيل الطلب
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-blue-800">
              <div>
                <span className="font-semibold">المحافظة: </span>
                {request?.created_by?.province || request?.province || 'غير محدد'}
              </div>
              <div>
                <span className="font-semibold">عدد الكتب: </span>
                {books.length} نوع
              </div>
            </div>
          </div>

          {/* اختيار المستودع المرسل */}
          <div className="space-y-2">
            <Label>المستودع المرسل (الوزارة) *</Label>
            <Select 
              value={formData.from_warehouse} 
              onValueChange={(value) => setFormData({...formData, from_warehouse: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المستودع" />
              </SelectTrigger>
              <SelectContent>
                {ministryWarehouses.map(warehouse => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    {warehouse.name} - {warehouse.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* اختيار مستودع المحافظة المستلم */}
          <div className="space-y-2">
            <Label>مستودع المحافظة المستلم *</Label>
            <Select 
              value={formData.to_warehouse} 
              onValueChange={(value) => setFormData({...formData, to_warehouse: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر مستودع المحافظة" />
              </SelectTrigger>
              <SelectContent>
                {provinceWarehouses.map(warehouse => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    {warehouse.name} - {warehouse.province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* قائمة الكتب الموافق عليها */}
          <div className="space-y-2">
            <Label>الكتب التي سيتم شحنها</Label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-right p-2 border-b">الكتاب</th>
                    <th className="text-right p-2 border-b">المادة</th>
                    <th className="text-right p-2 border-b">الصف</th>
                    <th className="text-right p-2 border-b">الكمية</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{book.book_name}</td>
                      <td className="p-2">{book.subject_display}</td>
                      <td className="p-2">{book.grade_display}</td>
                      <td className="p-2 font-semibold">{book.quantity}</td>
                    </tr>
                  ))}
                  {books.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500">
                        لا توجد كتب موافق عليها
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ملاحظات */}
          <div className="space-y-2">
            <Label>ملاحظات (اختياري)</Label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="أضف أي ملاحظات..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || books.length === 0 || !formData.from_warehouse}
          >
            {loading ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <Package className="ml-2 h-4 w-4" />
                إنشاء الشحنة
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
