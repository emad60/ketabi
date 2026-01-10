import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  TruckIcon, 
  School, 
  Package, 
  Users, 
  ArrowLeft,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  Search,
  BookOpen,
  Building2
} from 'lucide-react';
import DashboardTopNav from '../components/DashboardTopNav';
import api from '../services/api';

interface Book {
  id: number;
  title: string;
  subject: string;
  grade: string;
  term: string;
  available_quantity: number;
}

interface School {
  id: number;
  name: string;
  province: string;
  directorate: string | null;
}

interface Courier {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
}

interface ShipmentItem {
  book_id: number;
  book_title: string;
  quantity: number;
  term: string;
}

export function ProvinceManualShipmentPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [books, setBooks] = useState<Book[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<number | null>(null);
  const [shipmentItems, setShipmentItems] = useState<ShipmentItem[]>([]);
  
  const [searchBook, setSearchBook] = useState('');
  const [searchSchool, setSearchSchool] = useState('');

  useEffect(() => {
    if (user?.role !== 'province_admin' && user?.role !== 'province_staff') {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch warehouse stock (books available)
      const stockRes = await api.get('/warehouses/stocks/');
      const stockData = stockRes.data;
      
      // Transform stock data to books list
      const booksData = (stockData.results || stockData || []).map((item: any) => ({
        id: item.book,  // book ID from API
        title: item.book_label || 'غير معروف',  // book_label contains full title
        subject: '',  // Not directly available, would need to parse from title or fetch separately
        grade: '',    // Not directly available
        term: item.term || 'second',
        available_quantity: item.quantity || 0,
      }));
      
      setBooks(booksData);
      
      // Fetch schools in province
      const schoolsRes = await api.get('/schools/');
      setSchools(schoolsRes.data.results || schoolsRes.data || []);
      
      // Fetch available couriers
      const couriersRes = await api.get('/users/', { 
        params: { role: 'province_driver' }
      });
      setCouriers(couriersRes.data.results || couriersRes.data || []);
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('فشل تحميل البيانات. الرجاء المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const addBookToShipment = (book: Book) => {
    // Check if book already added
    const exists = shipmentItems.find(item => item.book_id === book.id);
    if (exists) {
      setError('هذا الكتاب مضاف بالفعل');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setShipmentItems([...shipmentItems, {
      book_id: book.id,
      book_title: book.title,
      quantity: 1,
      term: book.term,
    }]);
  };

  const updateItemQuantity = (bookId: number, quantity: number) => {
    const book = books.find(b => b.id === bookId);
    if (book && quantity > book.available_quantity) {
      setError(`الكمية المتاحة للكتاب: ${book.available_quantity}`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setShipmentItems(shipmentItems.map(item => 
      item.book_id === bookId ? { ...item, quantity } : item
    ));
  };

  const removeItemFromShipment = (bookId: number) => {
    setShipmentItems(shipmentItems.filter(item => item.book_id !== bookId));
  };

  const handleCreateShipment = async () => {
    if (!selectedSchool) {
      setError('الرجاء اختيار المدرسة الوجهة');
      return;
    }
    
    if (!selectedCourier) {
      setError('الرجاء اختيار المندوب');
      return;
    }
    
    if (shipmentItems.length === 0) {
      setError('الرجاء إضافة كتب للشحنة');
      return;
    }

    try {
      setCreating(true);
      setError('');
      setSuccess('');

      const school = schools.find(s => s.id === selectedSchool);
      
      const payload = {
        to_school_name: school?.name || '',
        books: shipmentItems.map(item => ({
          book_id: item.book_id,
          quantity: item.quantity,
          term: item.term,
        })),
        courier_role: 'province_driver',
        assigned_courier: selectedCourier,
      };

      console.log('Creating shipment with payload:', payload);

      const response = await api.post('/warehouses/shipments/', payload);

      setSuccess(`تم إنشاء الشحنة بنجاح! رقم التتبع: ${response.data.tracking_code || response.data.id}`);
      
      // Reset form
      setTimeout(() => {
        setSelectedSchool(null);
        setSelectedCourier(null);
        setShipmentItems([]);
        fetchData();
      }, 2000);

    } catch (err: any) {
      console.error('Error creating shipment:', err);
      const errorMsg = err.response?.data?.error || 
                       err.response?.data?.message ||
                       JSON.stringify(err.response?.data) ||
                       'فشل إنشاء الشحنة. الرجاء المحاولة مرة أخرى.';
      setError(errorMsg);
    } finally {
      setCreating(false);
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchBook.toLowerCase()) ||
    book.subject.toLowerCase().includes(searchBook.toLowerCase()) ||
    book.grade.toLowerCase().includes(searchBook.toLowerCase())
  );

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchSchool.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardTopNav />
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardTopNav />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/province/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            العودة للوحة التحكم
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إنشاء شحنة جديدة</h1>
              <p className="text-gray-600">اختر الكتب والكميات والوجهة والمندوب</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Books Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Books List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  اختيار الكتب من المخزن
                </CardTitle>
                <CardDescription>
                  اختر الكتب وأضفها للشحنة (متوفر: {books.length} كتاب)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="ابحث عن كتاب..."
                      value={searchBook}
                      onChange={(e) => setSearchBook(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredBooks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>لا توجد كتب متاحة في المخزن</p>
                    </div>
                  ) : (
                    filteredBooks.map(book => (
                      <div
                        key={book.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{book.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {book.subject}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {book.grade}
                            </Badge>
                            <span className="text-xs text-gray-600">
                              المتاح: {book.available_quantity}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addBookToShipment(book)}
                          disabled={shipmentItems.some(item => item.book_id === book.id)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipment Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  محتويات الشحنة ({shipmentItems.length})
                </CardTitle>
                <CardDescription>
                  الكتب المضافة للشحنة - حدد الكميات
                </CardDescription>
              </CardHeader>
              <CardContent>
                {shipmentItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>لم يتم إضافة كتب بعد</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shipmentItems.map(item => {
                      const book = books.find(b => b.id === item.book_id);
                      return (
                        <div
                          key={item.book_id}
                          className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.book_title}</p>
                            <p className="text-xs text-gray-600">
                              المتاح: {book?.available_quantity || 0}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">الكمية:</Label>
                            <Input
                              type="number"
                              min="1"
                              max={book?.available_quantity || 1}
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.book_id, parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </div>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeItemFromShipment(item.book_id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                    
                    <div className="border-t pt-3 mt-3">
                      <p className="text-sm font-medium text-gray-700">
                        إجمالي الكتب: {shipmentItems.reduce((sum, item) => sum + item.quantity, 0)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Destination & Courier */}
          <div className="space-y-6">
            {/* School Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <School className="w-5 h-5" />
                  اختيار الوجهة
                </CardTitle>
                <CardDescription>
                  حدد المدرسة المستلمة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="ابحث عن مدرسة..."
                      value={searchSchool}
                      onChange={(e) => setSearchSchool(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredSchools.map(school => (
                    <div
                      key={school.id}
                      onClick={() => setSelectedSchool(school.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedSchool === school.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 mt-1 text-gray-600" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{school.name}</p>
                          <p className="text-xs text-gray-600">{school.province}</p>
                          {school.directorate && (
                            <p className="text-xs text-gray-500">{school.directorate}</p>
                          )}
                        </div>
                        {selectedSchool === school.id && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Courier Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  اختيار المندوب
                </CardTitle>
                <CardDescription>
                  حدد المندوب المسؤول عن التوصيل
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {couriers.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">لا يوجد مناديب متاحون</p>
                    </div>
                  ) : (
                    couriers.map(courier => (
                      <div
                        key={courier.id}
                        onClick={() => setSelectedCourier(courier.id)}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedCourier === courier.id
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{courier.full_name}</p>
                            <p className="text-xs text-gray-600">{courier.phone}</p>
                          </div>
                          {selectedCourier === courier.id && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Create Button */}
            <Button
              onClick={handleCreateShipment}
              disabled={creating || !selectedSchool || !selectedCourier || shipmentItems.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {creating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <TruckIcon className="w-5 h-5 mr-2" />
                  إنشاء الشحنة
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
