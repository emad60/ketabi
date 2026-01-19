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
  term?: number;  // 1 = first, 2 = second
  term_name?: string;
  term_display?: string;
}

interface Warehouse {
  id: number;
  name: string;
  location?: string;
  province?: string;
  capacity?: number;
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
    console.log('StockEntryPage mounted. warehouseType:', warehouseType);
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
      
      console.log('Loading warehouses from:', endpoint);
      const response = await api.get(endpoint, {
        params: { page_size: 100 }
      });
      
      console.log('Warehouses response:', response.data);
      const warehouseData = response.data.results || response.data || [];
      console.log('Setting warehouses:', warehouseData);
      setWarehouses(warehouseData);
    } catch (error) {
      console.error('Error loading warehouses:', error);
      alert('فشل تحميل المخازن: ' + (error as any)?.response?.data?.detail || 'خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  };

  const loadBooks = async () => {
    try {
      console.log('Loading books from: /books/');
      const response = await api.get('/books/', {
        params: { page_size: 200 }
      });
      
      console.log('Books response:', response.data);
      const booksData = response.data.results || response.data || [];
      console.log('Setting books:', booksData.length);
      setBooks(booksData);
      setFilteredBooks(booksData);
    } catch (error) {
      console.error('Error loading books:', error);
      alert('فشل تحميل الكتب: ' + (error as any)?.response?.data?.detail || 'خطأ غير معروف');
    }
  };

  const loadCurrentStock = async () => {
    try {
      const params: any = { page_size: 500 };
      
      // إذا كان هناك مخزن محدد، جلب المخزون لهذا المخزن فقط
      if (selectedWarehouse) {
        const warehouseKey = warehouseType === 'ministry' 
          ? 'ministry_warehouse' 
          : 'province_warehouse';
        params[warehouseKey] = selectedWarehouse;
      }
      
      console.log('Loading stock with params:', params);
      const response = await api.get('/warehouses/stocks/', { params });
      
      console.log('Stock response:', response.data);
      const stockData = response.data.results || response.data || [];
      console.log('Setting stock:', stockData.length, 'items');
      setCurrentStock(stockData);
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
      let successCount = 0;
      let failCount = 0;

      // إنشاء أو تحديث stock entries في Backend (upsert)
      for (const entry of entries) {
        try {
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

          console.log('Saving stock entry:', payload);

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
            console.log(`Updating stock ${stockItem.id}: ${stockItem.quantity} + ${entry.quantity} = ${newQty}`);
            await api.patch(`/warehouses/stocks/${stockItem.id}/`, {
              quantity: newQty
            });
          } else {
            // إنشاء سجل جديد
            console.log('Creating new stock entry');
            await api.post('/warehouses/stocks/', payload);
          }
          successCount++;
        } catch (err) {
          console.error('Error saving entry:', entry, err);
          failCount++;
        }
      }

      if (failCount > 0) {
        alert(`⚠️ تم حفظ ${successCount} كتاب، فشل ${failCount} كتاب`);
      } else {
        alert(`✅ تم حفظ ${successCount} كتاب بنجاح!`);
      }
      setEntries([]);
      loadCurrentStock();
    } catch (error: any) {
      console.error('Error saving stock:', error);
      alert('حدث خطأ: ' + (error.response?.data?.detail || JSON.stringify(error.response?.data) || 'فشل في حفظ البيانات'));
    } finally {
      setSaving(false);
    }
  };

  // Helper to convert book term number to stock term string
  const getTermString = (term?: number): string | undefined => {
    if (term === 1) return 'first';
    if (term === 2) return 'second';
    return undefined;
  };

  // Helper to get term display text in Arabic
  const getTermDisplay = (term?: number, term_display?: string): string => {
    if (term_display) return term_display;
    if (term === 1) return 'الأول';
    if (term === 2) return 'الثاني';
    return 'غير محدد';
  };

  const getCurrentQuantity = (bookId: number, term?: number): number => {
    const termString = getTermString(term);
    // إذا كان هناك مخزن محدد، عرض المخزون لهذا المخزن فقط
    if (selectedWarehouse) {
      const stock = currentStock.find(s => {
        const matchBook = s.book === bookId || s.book?.id === bookId;
        const matchTerm = !termString || s.term === termString;
        return matchBook && matchTerm;
      });
      return stock?.quantity || 0;
    }
    // إذا لم يكن هناك مخزن محدد، عرض المجموع من جميع المخازن
    const stocks = currentStock.filter(s => {
      const matchBook = s.book === bookId || s.book?.id === bookId;
      const matchTerm = !termString || s.term === termString;
      return matchBook && matchTerm;
    });
    return stocks.reduce((sum, s) => sum + (s.quantity || 0), 0);
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
                      {warehouse.name}
                      {warehouse.location && ` - ${warehouse.location}`}
                      {warehouse.province && ` - ${warehouse.province}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedWarehouse && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-blue-900">
                  <BookOpen className="w-5 h-5" />
                  <span className="font-semibold">
                    المخزون الحالي: {currentStock.length} نوع كتاب
                  </span>
                </div>
                <div className="text-sm text-blue-700">
                  <p>إجمالي الكميات: {currentStock.reduce((sum, s) => sum + (s.quantity || 0), 0)} كتاب</p>
                </div>
                {currentStock.length > 0 && (
                  <div className="mt-3 max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-2">
                      {currentStock.slice(0, 5).map((stock, idx) => (
                        <div key={idx} className="bg-white p-2 rounded text-sm flex justify-between items-center">
                          <span className="text-gray-700">
                            {stock.book_details?.subject_display} - {stock.book_details?.grade_display}
                          </span>
                          <Badge variant="default">{stock.quantity}</Badge>
                        </div>
                      ))}
                      {currentStock.length > 5 && (
                        <p className="text-xs text-blue-600 text-center">
                          وأكثر... ({currentStock.length - 5} أخرى)
                        </p>
                      )}
                    </div>
                  </div>
                )}
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

                {filteredBooks.length === 0 && searchTerm && (
                  <p className="text-center text-gray-500 py-4">
                    لم يتم العثور على كتب تطابق البحث
                  </p>
                )}

                {filteredBooks.length > 0 && (
                  <>
                    <div className="text-sm text-gray-600">
                      عرض {Math.min(10, filteredBooks.length)} من {filteredBooks.length} كتاب
                    </div>
                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>المادة</TableHead>
                            <TableHead>الصف</TableHead>
                            <TableHead>الفصل</TableHead>
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
                                <Badge variant="secondary">
                                  {getTermDisplay(book.term, book.term_display)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge>{getCurrentQuantity(book.id, book.term)}</Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addEntry(book)}
                                  disabled={entries.find(e => e.book_id === book.id) !== undefined}
                                >
                                  <Plus className="w-4 h-4 ml-1" />
                                  {entries.find(e => e.book_id === book.id) ? 'مضاف' : 'إضافة'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
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

      {!loading && warehouses.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">لا توجد مخازن متاحة</p>
        </div>
      )}

      {!loading && books.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">لا توجد كتب متاحة</p>
        </div>
      )}
    </div>
  );
}
