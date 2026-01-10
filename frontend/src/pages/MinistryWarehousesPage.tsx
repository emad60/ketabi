import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import DashboardTopNav from '../components/DashboardTopNav';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Package,
  Plus,
  Warehouse,
  TrendingUp,
  AlertTriangle,
  Edit,
  Eye,
  MapPin,
  ArrowLeft,
  Loader2,
  Building2,
  Users,
  Search,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

interface MinistryWarehouse {
  id: number;
  name: string;
  location: string;
  staff: number[];
  staff_details?: Array<{
    id: number;
    full_name: string;
    email: string;
    role: string;
  }>;
  total_stock?: number;
  stock_items?: Array<{
    id: number;
    book: {
      id: number;
      title: string;
      subject_display: string;
      grade_display: string;
    };
    quantity: number;
    term: string;
  }>;
  deduction_reports?: Array<{
    id: number;
    shipment_id: number;
    tracking_code: string;
    deducted_at: string;
    books: Array<{
      book_title: string;
      quantity: number;
    }>;
  }>;
  created_at: string;
}

interface Staff {
  id: number;
  full_name: string;
  email: string;
  username: string;
  role: string;
}

export function MinistryWarehousesPage() {
  const [warehouses, setWarehouses] = useState<MinistryWarehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showReportsDialog, setShowReportsDialog] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<MinistryWarehouse | null>(null);
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState('warehouses');
  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    location: ''
  });
  
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchWarehouses();
    fetchAvailableStaff();
  }, []);

  const fetchAvailableStaff = async () => {
    try {
      const response = await api.get('/users/', {
        params: {
          role: 'ministry_staff',
          page_size: 100
        }
      });
      setAvailableStaff(response.data.results || response.data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/warehouses/ministry/');
      // Ensure warehouses is always an array
      const data = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setWarehouses(data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching warehouses:', err);
      setError('فشل تحميل المخازن');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/warehouses/ministry-warehouses/', newWarehouse);
      setNewWarehouse({ name: '', location: '' });
      setShowAddForm(false);
      fetchWarehouses();
    } catch (err: any) {
      console.error('Error adding warehouse:', err);
      setError('فشل إضافة المخزن');
    } finally {
      setLoading(false);
    }
  };

  const handleManageStaff = async (warehouse: MinistryWarehouse) => {
    setSelectedWarehouse(warehouse);
    setSelectedStaffIds(warehouse.staff || []);
    setShowStaffDialog(true);
  };

  const handleSaveStaff = async () => {
    if (!selectedWarehouse) return;
    
    try {
      setLoading(true);
      await api.patch(`/warehouses/ministry/${selectedWarehouse.id}/`, {
        staff: selectedStaffIds
      });
      alert('✅ تم تحديث الموظفين بنجاح!');
      setShowStaffDialog(false);
      fetchWarehouses();
    } catch (err) {
      console.error('Error updating staff:', err);
      alert('فشل في تحديث الموظفين');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStock = async (warehouse: MinistryWarehouse) => {
    try {
      setLoading(true);
      const response = await api.get('/warehouses/stocks/', {
        params: {
          ministry_warehouse: warehouse.id,
          page_size: 500
        }
      });
      
      setSelectedWarehouse({
        ...warehouse,
        stock_items: response.data.results || response.data || []
      });
      setShowStockDialog(true);
    } catch (err) {
      console.error('Error fetching stock:', err);
      alert('فشل تحميل المخزون');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReports = async (warehouse: MinistryWarehouse) => {
    try {
      setLoading(true);
      // جلب الشحنات التي خرجت من هذا المخزن
      const response = await api.get('/warehouses/shipments/', {
        params: {
          from_ministry: warehouse.id,
          status: 'confirmed',
          page_size: 100
        }
      });
      
      const shipments = response.data.results || response.data || [];
      const reports = shipments.map((s: any) => ({
        id: s.id,
        shipment_id: s.id,
        tracking_code: s.tracking_code,
        deducted_at: s.created_at,
        books: s.books_details || s.books || []
      }));
      
      setSelectedWarehouse({
        ...warehouse,
        deduction_reports: reports
      });
      setShowReportsDialog(true);
    } catch (err) {
      console.error('Error fetching reports:', err);
      alert('فشل تحميل التقارير');
    } finally {
      setLoading(false);
    }
  };

  const filteredWarehouses = warehouses.filter(w => 
    (w.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (w.location || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  if (loading && warehouses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <DashboardTopNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        role="ministry"
      />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">مخازن الوزارة</h1>
              <p className="text-sm text-gray-600 mt-1">إدارة وتتبع مخازن الوزارة</p>
            </div>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} size="lg">
            <Plus className="w-5 h-5 ml-2" />
            إضافة مخزن جديد
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Add Warehouse Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>إضافة مخزن جديد</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddWarehouse} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">اسم المخزن</Label>
                    <Input
                      id="name"
                      value={newWarehouse.name}
                      onChange={(e) => setNewWarehouse({...newWarehouse, name: e.target.value})}
                      placeholder="مثال: المخزن المركزي - صنعاء"
                      required
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">الموقع</Label>
                    <Input
                      id="location"
                      value={newWarehouse.location}
                      onChange={(e) => setNewWarehouse({...newWarehouse, location: e.target.value})}
                      placeholder="مثال: صنعاء - شارع الزبيري"
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
                    onClick={() => setShowAddForm(false)}
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
                placeholder="البحث عن مخزن..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
          </CardContent>
        </Card>

        {/* Warehouses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWarehouses.map((warehouse) => (
            <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-xl mt-4">{warehouse.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <MapPin className="w-4 h-4" />
                  {warehouse.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      الموظفين
                    </span>
                    <span className="font-semibold text-blue-600">
                      {warehouse.staff?.length || 0}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageStaff(warehouse)}
                    >
                      <Users className="w-4 h-4 ml-2" />
                      الموظفين
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewStock(warehouse)}
                    >
                      <Package className="w-4 h-4 ml-2" />
                      المخزون
                    </Button>
                  </div>
                  
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => handleViewReports(warehouse)}
                  >
                    <TrendingUp className="w-4 h-4 ml-2" />
                    تقارير الخصم
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredWarehouses.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                لا توجد مخازن
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'لم يتم العثور على نتائج للبحث' : 'ابدأ بإضافة مخزن جديد'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة مخزن
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Staff Management Dialog */}
      <Dialog open={showStaffDialog} onOpenChange={setShowStaffDialog}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>إدارة موظفي المخزن - {selectedWarehouse?.name}</DialogTitle>
            <DialogDescription>اختر الموظفين (يُنصح باختيار 2 موظفين لكل مخزن)</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {availableStaff.map(staff => (
              <div key={staff.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  id={`staff-${staff.id}`}
                  checked={selectedStaffIds.includes(staff.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStaffIds([...selectedStaffIds, staff.id]);
                    } else {
                      setSelectedStaffIds(selectedStaffIds.filter(id => id !== staff.id));
                    }
                  }}
                  className="ml-3 w-4 h-4"
                />
                <label htmlFor={`staff-${staff.id}`} className="flex-1 cursor-pointer">
                  <div className="font-medium">{staff.full_name}</div>
                  <div className="text-sm text-gray-600">{staff.email}</div>
                </label>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-sm text-gray-600">
              تم اختيار {selectedStaffIds.length} موظف
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowStaffDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveStaff}>
                حفظ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock View Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">مخزون {selectedWarehouse?.name}</DialogTitle>
            <DialogDescription>جميع الكتب المتوفرة في المخزن</DialogDescription>
          </DialogHeader>
          
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : selectedWarehouse?.stock_items && selectedWarehouse.stock_items.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {selectedWarehouse.stock_items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">إجمالي الكتب</div>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>المادة</TableHead>
                    <TableHead>الصف</TableHead>
                    <TableHead>الفصل</TableHead>
                    <TableHead className="text-center">الكمية</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedWarehouse.stock_items.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {item.book_details?.subject || item.book?.subject_display || item.book?.title || 'غير محدد'}
                      </TableCell>
                      <TableCell>{item.book_details?.grade || item.book?.grade_display || 'غير محدد'}</TableCell>
                      <TableCell>
                        {item.book_details?.term || (item.term === 'first' ? 'الأول' : item.term === 'second' ? 'الثاني' : item.term)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {item.quantity}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>لا يوجد مخزون</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deduction Reports Dialog */}
      <Dialog open={showReportsDialog} onOpenChange={setShowReportsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">تقارير الخصم التلقائي - {selectedWarehouse?.name}</DialogTitle>
            <DialogDescription>سجل الكتب المخصومة من المخزن بعد إنشاء الشحنات</DialogDescription>
          </DialogHeader>
          
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : selectedWarehouse?.deduction_reports && selectedWarehouse.deduction_reports.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {selectedWarehouse.deduction_reports.length}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">إجمالي عمليات الخصم</div>
                </div>
              </div>
              
              {selectedWarehouse.deduction_reports.map((report) => (
                <Card key={report.id} className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">شحنة #{report.tracking_code}</CardTitle>
                      <span className="text-sm text-gray-600">
                        {new Date(report.deducted_at).toLocaleDateString('ar-YE')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الكتاب</TableHead>
                          <TableHead className="text-center">الكمية المخصومة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.books.map((book: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>
                              {book.book_details?.subject || book.book?.subject_display || book.book?.title || book.book_title || 'غير محدد'}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                                -{book.quantity}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>لا توجد عمليات خصم</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
