import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Badge } from './ui/badge';
import { 
  Package, 
  Plus, 
  Trash2, 
  Save, 
  Loader2,
  Search,
  Warehouse,
  BookOpen
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface Book {
  id: number;
  title: string;
  subject: string;
  subject_display: string;
  grade_level: string;
  grade_display: string;
}

interface Warehouse {
  id: number;
  name: string;
  location: string;
  capacity: number;
}

interface StockEntry {
  book_id: number;
  book_name: string;
  quantity: number;
  term: 'first' | 'second';
}

interface StockEntryPageProps {
  warehouseType: 'ministry' | 'province';
}

export function StockEntryPage({ warehouseType }: StockEntryPageProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Data
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  
  // Form
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [entries, setEntries] = useState<StockEntry[]>([]);
  
  // Current stock
  const [currentStock, setCurrentStock] = useState<any[]>([]);

  useEffect(() => {
    loadWarehouses();
    loadBooks();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const q = (searchTerm || '').toLowerCase();
      const filtered = books.filter(book => 
        (book.title || '').toLowerCase().includes(q) ||
        (book.subject_display || '').toLowerCase().includes(q) ||
        (book.grade_display || '').toLowerCase().includes(q)
      );
      setFilteredBooks(filtered);
    } else {
      setFilteredBooks(books);
    }
  }, [searchTerm, books]);

  useEffect(() => {
    if (selectedWarehouse) {
      loadCurrentStock();
    }
  }, [selectedWarehouse]);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const endpoint = warehouseType === 'ministry' 
        ? '/warehouses/ministry/' 
        : '/warehouses/province/';
      
      const response = await api.get(endpoint, {
        params: { page_size: 100 }
      });
      
      setWarehouses(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading warehouses:', error);
      alert('فشل تحميل المخازن');
    } finally {
      setLoading(false);
    }
  };

  const loadBooks = async () => {
    try {
      const response = await api.get('/books/', {
        params: { page_size: 200 }
      });
      
      setBooks(response.data.results || response.data || []);
      setFilteredBooks(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading books:', error);
      alert('فشل تحميل الكتب');
    }
  };

  const loadCurrentStock = async () => {
    try {
      const warehouseKey = warehouseType === 'ministry' 
        ? 'ministry_warehouse' 
        : 'province_warehouse';
      
      const response = await api.get('/warehouses/stocks/', {
        params: {
          [warehouseKey]: selectedWarehouse,
          page_size: 200
        }
      });
      
      setCurrentStock(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading stock:', error);
    }
  };

  const addEntry = (book: Book) => {
    // Check if already added
    if (entries.find(e => e.book_id === book.id)) {
      alert('هذا الكتاب مضاف بالفعل');
      return;
    }

    const newEntry: StockEntry = {
      book_id: book.id,
      book_name: `${book.subject_display} - ${book.grade_display}`,
      quantity: 0,
      term: 'first'
    };

    setEntries([...entries, newEntry]);
  };

  const updateEntry = (index: number, field: keyof StockEntry, value: any) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedWarehouse) {
      alert('يرجى اختيار المخزن');
      return;
    }

    if (entries.length === 0) {
      alert('يرجى إضافة كتب');
      return;
    }

    if (entries.some(e => e.quantity <= 0)) {
      alert('يرجى إدخال كميات صحيحة لجميع الكتب');
      return;
    }

    try {
      setSaving(true);

      // إنشاء أو تحديث stock entries في Backend (upsert)
      for (const entry of entries) {
        const payload: any = {
          book: entry.book_id,
          quantity: entry.quantity,
          term: entry.term
        };

        const warehouseKey = warehouseType === 'ministry' ? 'ministry_warehouse' : 'province_warehouse';
        payload[warehouseKey] = parseInt(selectedWarehouse);
        // Some backend serializers expect the other warehouse field to be present (nullable).
        if (warehouseKey === 'ministry_warehouse') {
          payload['province_warehouse'] = null;
        } else {
          payload['ministry_warehouse'] = null;
        }

        // تحقق هل يوجد سجل مخزون لهذا الكتاب/المستودع/الترم
        const existingRes = await api.get('/warehouses/stocks/', {
          params: {
            book: entry.book_id,
            term: entry.term,
            [warehouseKey]: selectedWarehouse,
            page_size: 1,
          }
        });

        const existing = (existingRes.data.results || existingRes.data || []);
        if (Array.isArray(existing) && existing.length > 0) {
          // حدث تعديل: نجمع الكمية الحالية مع المدخلة
          const stockItem = existing[0];
          const newQty = (stockItem.quantity || 0) + entry.quantity;
          await api.patch(`/warehouses/stocks/${stockItem.id}/`, {
            quantity: newQty
          });
        } else {
          // إنشاء سجل جديد
          await api.post('/warehouses/stocks/', payload);
        }
      }

      alert('✅ تم حفظ الكميات بنجاح!');
      setEntries([]);
      loadCurrentStock();
    } catch (error: any) {
      console.error('Error saving stock:', error);
      alert('حدث خطأ: ' + (error.response?.data?.detail || 'فشل في حفظ البيانات'));
    } finally {
      setSaving(false);
    }
  };

  const getCurrentQuantity = (bookId: number) => {
    const stock = currentStock.find(s => s.book === bookId || s.book?.id === bookId);
    return stock?.quantity || 0;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              إدخال الكتب للمخازن
            </h1>
            <p className="text-sm text-gray-600">
              {warehouseType === 'ministry' ? 'مخازن الوزارة' : 'مخازن المحافظة'}
            </p>
          </div>
        </div>
      </div>

      {/* اختيار المخزن */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="w-5 h-5" />
            اختيار المخزن
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>المخزن *</Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المخزن" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(warehouse => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name} - {warehouse.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedWarehouse && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-900">
                  <BookOpen className="w-5 h-5" />
                  <span className="font-semibold">
                    المخزون الحالي: {currentStock.length} نوع كتاب
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* البحث وإضافة الكتب */}
      {selectedWarehouse && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>إضافة كتب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ابحث عن كتاب (المادة، الصف، العنوان)..."
                    className="pr-10"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>المادة</TableHead>
                        <TableHead>الصف</TableHead>
                        <TableHead>الكمية الحالية</TableHead>
                        <TableHead>إجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBooks.slice(0, 10).map(book => (
                        <TableRow key={book.id}>
                          <TableCell>{book.subject_display}</TableCell>
                          <TableCell>{book.grade_display}</TableCell>
                          <TableCell>
                            <Badge>{getCurrentQuantity(book.id)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addEntry(book)}
                            >
                              <Plus className="w-4 h-4 ml-1" />
                              إضافة
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* الكتب المضافة */}
          {entries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>الكتب المراد إدخالها ({entries.length})</span>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 ml-2" />
                        حفظ الكميات
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الكتاب</TableHead>
                      <TableHead>الكمية الحالية</TableHead>
                      <TableHead>الكمية الجديدة</TableHead>
                      <TableHead>الترم</TableHead>
                      <TableHead>إجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {entry.book_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getCurrentQuantity(entry.book_id)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={entry.quantity}
                            onChange={(e) => updateEntry(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={entry.term}
                            onValueChange={(value) => updateEntry(index, 'term', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="first">الأول</SelectItem>
                              <SelectItem value="second">الثاني</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeEntry(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {loading && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-2">جاري التحميل...</p>
        </div>
      )}
    </div>
  );
}
