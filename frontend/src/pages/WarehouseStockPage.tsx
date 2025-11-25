import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Package, 
  Plus, 
  Search,
  ArrowLeft,
  Loader2,
  BookOpen,
  AlertTriangle,
  Edit,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import api from '../services/api';

interface Book {
  id: number;
  subject: string;
  grade_level: string;
  term: number;
  title: string;
  subject_display: string;
  grade_display: string;
  term_display: string;
}

interface StockItem {
  id: number;
  book: Book;
  term: string;
  quantity: number;
  min_threshold: number;
  updated_at: string;
}

export function WarehouseStockPage() {
  const { warehouseId } = useParams();
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [formData, setFormData] = useState({
    book_id: '',
    term: 'first',
    quantity: 0,
    min_threshold: 50
  });
  
  const navigate = useNavigate();
  const warehouseType = window.location.pathname.includes('/ministry/') ? 'ministry' : 'province';

  useEffect(() => {
    fetchStocks();
    fetchBooks();
  }, [warehouseId]);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/warehouses/stocks/`, {
        params: {
          [`${warehouseType}_warehouse`]: warehouseId,
          page_size: 100,
        }
      });
      const data = response.data.results || response.data;
      setStocks(Array.isArray(data) ? data : []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching stocks:', err);
      setError('فشل تحميل المخزون');
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const response = await api.get('/books/');
      const data = response.data.results || response.data;
      setBooks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching books:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const payload: any = {
        [`${warehouseType}_warehouse`]: parseInt(warehouseId!),
        book: parseInt(formData.book_id),
        term: formData.term,
        quantity: formData.quantity,
        min_threshold: formData.min_threshold,
      };

      // Include complementary warehouse field as null to satisfy backend serializer
      const warehouseKey = `${warehouseType}_warehouse`;
      const complementaryKey = warehouseKey === 'ministry_warehouse' ? 'province_warehouse' : 'ministry_warehouse';
      payload[complementaryKey] = null;

      if (editingStock) {
        await api.put(`/warehouses/stocks/${editingStock.id}/`, payload);
      } else {
        await api.post('/warehouses/stocks/', payload);
      }
      
      setShowAddForm(false);
      setEditingStock(null);
      setFormData({ book_id: '', term: 'first', quantity: 0, min_threshold: 50 });
      fetchStocks();
    } catch (err: any) {
      console.error('Error saving stock:', err);
      setError(editingStock ? 'فشل تحديث المخزون' : 'فشل إضافة المخزون');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (stock: StockItem) => {
    setEditingStock(stock);
    setFormData({
      book_id: String((stock as any).book),
      term: stock.term,
      quantity: stock.quantity,
      min_threshold: stock.min_threshold
    });
    setShowAddForm(true);
  };

  const handleAdjustQuantity = async (stockId: number, adjustment: number) => {
    try {
      const stock = stocks.find(s => s.id === stockId);
      if (!stock) return;

      await api.patch(`/warehouses/stocks/${stockId}/`, {
        quantity: stock.quantity + adjustment
      });
      
      fetchStocks();
    } catch (err) {
      console.error('Error adjusting quantity:', err);
      setError('فشل تعديل الكمية');
    }
  };

  const filteredStocks = stocks.filter(s => 
    (String((s as any).book_label || (s as any).book || '')).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = stocks.filter(s => s.quantity <= s.min_threshold);
  const totalBooks = stocks.reduce((sum, s) => sum + s.quantity, 0);

  if (loading && stocks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة
              </Button>
              <div className="bg-green-600 p-2 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">إدارة المخزون</h1>
                <p className="text-sm text-gray-600">وزارة التربية والتعليم</p>
              </div>
            </div>
            <Button onClick={() => {
              setShowAddForm(true);
              setEditingStock(null);
              setFormData({ book_id: '', term: 'first', quantity: 0, min_threshold: 50 });
            }}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة كتاب
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الكتب</CardTitle>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalBooks}</div>
              <p className="text-xs text-gray-600 mt-1">كتاب في المخزن</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">أنواع الكتب</CardTitle>
              <Package className="w-8 h-8 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stocks.length}</div>
              <p className="text-xs text-gray-600 mt-1">نوع مختلف</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">تنبيه مخزون منخفض</CardTitle>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{lowStockItems.length}</div>
              <p className="text-xs text-gray-600 mt-1">يحتاج إعادة تموين</p>
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingStock ? 'تعديل المخزون' : 'إضافة كتاب للمخزون'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="book">الكتاب</Label>
                    <select
                      id="book"
                      value={formData.book_id}
                      onChange={(e) => setFormData({...formData, book_id: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md text-right"
                      required
                      disabled={!!editingStock}
                    >
                      <option value="">اختر كتاب...</option>
                      {books.map(book => (
                        <option key={book.id} value={book.id}>
                          {book.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="term">الفصل الدراسي</Label>
                    <select
                      id="term"
                      value={formData.term}
                      onChange={(e) => setFormData({...formData, term: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md text-right"
                      required
                      disabled={!!editingStock}
                    >
                      <option value="first">الفصل الأول</option>
                      <option value="second">الفصل الثاني</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">الكمية</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                      min="0"
                      required
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_threshold">الحد الأدنى للتنبيه</Label>
                    <Input
                      id="min_threshold"
                      type="number"
                      value={formData.min_threshold}
                      onChange={(e) => setFormData({...formData, min_threshold: parseInt(e.target.value)})}
                      min="0"
                      required
                      className="text-right"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                    حفظ
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingStock(null);
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="البحث عن كتاب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stock List */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة المخزون</CardTitle>
            <CardDescription>جميع الكتب المتوفرة في المخزن</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredStocks.map((stock) => (
                <div
                  key={stock.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    stock.quantity <= stock.min_threshold 
                      ? 'bg-yellow-50 border-yellow-200' 
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{(stock as any).book_label || `كتاب #${stock.book}`}</h3>
                      <p className="text-sm text-gray-600">
                        {stock.term === 'first' ? 'الفصل الأول' : 'الفصل الثاني'}
                      </p>
                      {stock.quantity <= stock.min_threshold && (
                        <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3" />
                          مخزون منخفض
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{stock.quantity}</div>
                      <div className="text-xs text-gray-600">كتاب</div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAdjustQuantity(stock.id, 100)}
                      >
                        <TrendingUp className="w-4 h-4 ml-1" />
                        +100
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAdjustQuantity(stock.id, -100)}
                        disabled={stock.quantity < 100}
                      >
                        <TrendingDown className="w-4 h-4 ml-1" />
                        -100
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(stock)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredStocks.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    لا توجد كتب في المخزون
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'لم يتم العثور على نتائج' : 'ابدأ بإضافة كتب للمخزن'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
