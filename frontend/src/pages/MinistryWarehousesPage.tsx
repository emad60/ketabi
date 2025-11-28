import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
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
  created_at: string;
}

export function MinistryWarehousesPage() {
  const [warehouses, setWarehouses] = useState<MinistryWarehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    location: ''
  });
  
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/warehouses/ministry-warehouses/');
      setWarehouses(response.data);
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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/ministry/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة
              </Button>
              <div className="bg-blue-600 p-2 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">مخازن الوزارة</h1>
                <p className="text-sm text-gray-600">وزارة التربية والتعليم - الجمهورية اليمنية</p>
              </div>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة مخزن
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/ministry/warehouse/${warehouse.id}/stock`)}
                  >
                    عرض المخزون
                  </Button>
                </div>
                <CardTitle className="text-xl mt-4">{warehouse.name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <MapPin className="w-4 h-4" />
                  {warehouse.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">الموظفين</span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Users className="w-4 h-4" />
                      {warehouse.staff.length}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/ministry/warehouse/${warehouse.id}/stock`)}
                    >
                      <Package className="w-4 h-4 ml-2" />
                      المخزون
                    </Button>
                  </div>
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
    </div>
  );
}
