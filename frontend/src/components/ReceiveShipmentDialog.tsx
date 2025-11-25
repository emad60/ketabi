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
import { Loader2, CheckCircle, Package, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import api from '../services/api';

interface ReceiveShipmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shipment: any;
  userType: 'ministry' | 'province';
}

interface BookItem {
  book_id: number;
  book_name: string;
  quantity: number;
  received_quantity: number;
  term: string;
}

export function ReceiveShipmentDialog({ 
  open, 
  onClose, 
  onSuccess,
  shipment,
  userType
}: ReceiveShipmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open && shipment) {
      loadWarehouses();
      prepareBooks();
    }
  }, [open, shipment]);

  const loadWarehouses = async () => {
    try {
      const warehouseType = userType === 'ministry' ? 'ministry' : 'province';
      const response = await api.get(`/warehouses/${warehouseType}/`, {
        params: { page_size: 100 }
      });
      setWarehouses(response.data.results || response.data || []);
      
      // Auto-select the destination warehouse if available
      if (userType === 'province' && shipment.to_province) {
        setSelectedWarehouse(shipment.to_province.toString());
      } else if (userType === 'ministry' && shipment.to_ministry) {
        setSelectedWarehouse(shipment.to_ministry.toString());
      }
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };

  const prepareBooks = () => {
    if (!shipment?.books) return;

    const bookItems: BookItem[] = shipment.books.map((book: any) => ({
      book_id: book.book_id || book.id,
      book_name: book.book_name || book.title || `كتاب #${book.book_id}`,
      quantity: book.quantity || 0,
      received_quantity: book.quantity || 0, // Default to full quantity
      term: book.term || 'first',
    }));

    setBooks(bookItems);
  };

  const handleQuantityChange = (index: number, value: string) => {
    const quantity = parseInt(value) || 0;
    setBooks(prev => {
      const updated = [...prev];
      updated[index].received_quantity = quantity;
      return updated;
    });
  };

  const handleReceive = async () => {
    try {
      setLoading(true);

      if (!selectedWarehouse) {
        alert('يرجى اختيار المستودع المستلم');
        return;
      }

      // Validate quantities
      const hasInvalidQuantity = books.some(b => 
        b.received_quantity < 0 || b.received_quantity > b.quantity
      );
      
      if (hasInvalidQuantity) {
        alert('الكميات المستلمة يجب أن تكون بين 0 والكمية المرسلة');
        return;
      }

      // Step 1: Update shipment status to delivered
      await api.patch(`/warehouses/shipments/${shipment.id}/`, {
        status: 'delivered',
        delivery_notes: notes || 'تم استلام الشحنة'
      });

      // Step 2: Add books to warehouse stock
      const warehouseField = userType === 'ministry' ? 'ministry_warehouse' : 'province_warehouse';
      
      for (const book of books) {
        if (book.received_quantity > 0) {
          try {
            const stockPayload: any = {
              book: book.book_id,
              quantity: book.received_quantity,
              term: book.term,
              [warehouseField]: parseInt(selectedWarehouse)
            };

            // Ensure the complementary warehouse field is present (nullable) to satisfy backend validation
            const complementary = warehouseField === 'ministry_warehouse' ? 'province_warehouse' : 'ministry_warehouse';
            stockPayload[complementary] = null;

            console.log('Adding to stock:', stockPayload);
            await api.post('/warehouses/stocks/', stockPayload);
          } catch (error: any) {
            console.error(`Error adding book ${book.book_id} to stock:`, error);
            console.error('Error details:', error.response?.data);
            // Continue with other books even if one fails
          }
        }
      }

      alert('✅ تم استلام الشحنة وإضافة الكتب للمخزون بنجاح!');
      onSuccess();
      onClose();
      
      // Reset
      setBooks([]);
      setSelectedWarehouse('');
      setNotes('');
    } catch (error: any) {
      console.error('Error receiving shipment:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.detail 
        || error.response?.data?.message 
        || JSON.stringify(error.response?.data)
        || 'حدث خطأ أثناء استلام الشحنة';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const totalReceived = books.reduce((sum, b) => sum + b.received_quantity, 0);
  const totalShipped = books.reduce((sum, b) => sum + b.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            استلام الشحنة #{shipment?.id}
          </DialogTitle>
          <DialogDescription>
            تأكيد استلام الشحنة وإضافة الكتب للمخزون
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shipment Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm text-gray-600">رقم التتبع</Label>
              <p className="font-medium">{shipment?.tracking_code || 'غير محدد'}</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600">الحالة</Label>
              <Badge variant="outline">{shipment?.status || 'غير محدد'}</Badge>
            </div>
          </div>

          {/* Warehouse Selection */}
          <div className="space-y-2">
            <Label>المستودع المستلم *</Label>
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المستودع" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                    {warehouse.name}
                    {warehouse.province && ` - ${warehouse.province}`}
                    {warehouse.location && ` - ${warehouse.location}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Books Table */}
          <div className="space-y-2">
            <Label>الكتب المستلمة</Label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-right">الكتاب</th>
                    <th className="px-4 py-2 text-right">المرسل</th>
                    <th className="px-4 py-2 text-right">المستلم</th>
                    <th className="px-4 py-2 text-right">الحالة</th>
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
                        <td className="px-4 py-2 font-medium">{book.quantity}</td>
                        <td className="px-4 py-2">
                          <Input
                            type="number"
                            min="0"
                            max={book.quantity}
                            value={book.received_quantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            className="w-24"
                          />
                        </td>
                        <td className="px-4 py-2">
                          {book.received_quantity === book.quantity ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 ml-1" />
                              مكتمل
                            </Badge>
                          ) : book.received_quantity < book.quantity ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                              <AlertCircle className="w-3 h-3 ml-1" />
                              ناقص
                            </Badge>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-gray-50 font-medium">
                  <tr>
                    <td className="px-4 py-2">الإجمالي</td>
                    <td className="px-4 py-2">{totalShipped}</td>
                    <td className="px-4 py-2">{totalReceived}</td>
                    <td className="px-4 py-2">
                      {totalReceived === totalShipped ? (
                        <Badge className="bg-green-100 text-green-800">
                          مطابق
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-800">
                          غير مطابق
                        </Badge>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>ملاحظات الاستلام (اختياري)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أدخل أي ملاحظات حول الاستلام..."
            />
          </div>

          {/* Warning */}
          {totalReceived !== totalShipped && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">تحذير:</p>
                  <p>الكميات المستلمة لا تطابق الكميات المرسلة. تأكد من صحة البيانات.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleReceive} disabled={loading || !selectedWarehouse}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري الاستلام...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                تأكيد الاستلام
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
