import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { 
  Truck, 
  Plus, 
  Search,
  ArrowLeft,
  Loader2,
  Package,
  MapPin,
  User,
  Calendar,
  QrCode
} from 'lucide-react';
import api from '../services/api';

interface Shipment {
  id: number;
  status: string;
  courier_role: string;
  assigned_courier: any;
  to_province: any;
  to_school_name: string;
  books: any[];
  qr_code: string;
  created_at: string;
  delivered_at: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'قيد الإنشاء', color: 'bg-gray-100 text-gray-800' },
  assigned: { label: 'مُسندة لمندوب', color: 'bg-blue-100 text-blue-800' },
  out_for_delivery: { label: 'خارجة للتسليم', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'تم التسليم', color: 'bg-green-100 text-green-800' },
  confirmed: { label: 'مؤكدة', color: 'bg-emerald-100 text-emerald-800' },
  canceled: { label: 'ملغاة', color: 'bg-red-100 text-red-800' },
};

export function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    to_province: '',
    to_school: '',
    books: [] as any[],
    courier_role: 'ministry_courier'
  });
  
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isMinistry = user?.role?.includes('ministry');

  useEffect(() => {
    fetchShipments();
    fetchWarehouses();
    fetchCouriers();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      // فلترة الشحنات حسب نوع المستخدم
      const params: any = {};
      
      if (!isMinistry) {
        // موظفو المحافظة: فقط الشحنات من المحافظة للمدارس
        params.from_province = user?.province;
        params.shipment_type = 'province_to_school';
      }
      
      const response = await api.get('/warehouses/shipments/', { params });
      setShipments(response.data.results || response.data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching shipments:', err);
      setError('فشل تحميل الشحنات');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await api.get('/warehouses/province/');
      const data = response.data.results || response.data;
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    }
  };

  const fetchCouriers = async () => {
    try {
      const response = await api.get('/users/', {
        params: { role: 'ministry_driver' }
      });
      const data = response.data.results || response.data;
      setCouriers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching couriers:', err);
    }
  };

  const handleAssignCourier = async (shipmentId: number, courierId: number) => {
    try {
      await api.post(`/warehouses/shipments/${shipmentId}/assign/`, {
        courier_id: courierId
      });
      fetchShipments();
    } catch (err) {
      console.error('Error assigning courier:', err);
      setError('فشل تعيين المندوب');
    }
  };

  const filteredShipments = shipments.filter(s => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = 
      (s.to_province?.name || '').toLowerCase().includes(q) ||
      (s.to_school_name || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: shipments.length,
    pending: shipments.filter(s => s.status === 'pending').length,
    inTransit: shipments.filter(s => s.status === 'out_for_delivery').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
  };

  if (loading && shipments.length === 0) {
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
              <div className="bg-purple-600 p-2 rounded-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">إدارة الشحنات</h1>
                <p className="text-sm text-gray-600">
                  {isMinistry ? 'وزارة التربية والتعليم' : 'أمانة العاصمة'}
                </p>
              </div>
            </div>
            {isMinistry && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 ml-2" />
                شحنة جديدة
              </Button>
            )}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الشحنات</CardTitle>
              <Package className="w-8 h-8 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">قيد الإعداد</CardTitle>
              <Package className="w-8 h-8 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">قيد التوصيل</CardTitle>
              <Truck className="w-8 h-8 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.inTransit}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">تم التسليم</CardTitle>
              <Package className="w-8 h-8 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.delivered}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="البحث عن شحنة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 text-right"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-right"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="pending">قيد الإنشاء</option>
                  <option value="assigned">مُسندة لمندوب</option>
                  <option value="out_for_delivery">خارجة للتسليم</option>
                  <option value="delivered">تم التسليم</option>
                  <option value="confirmed">مؤكدة</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipments List */}
        <div className="space-y-4">
          {filteredShipments.map((shipment) => (
            <Card key={shipment.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Truck className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          شحنة #{shipment.id}
                        </h3>
                        <Badge className={STATUS_LABELS[shipment.status]?.color}>
                          {STATUS_LABELS[shipment.status]?.label}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {shipment.to_province?.name || shipment.to_school_name || 'غير محدد'}
                          </span>
                        </div>
                        
                        {shipment.assigned_courier && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{shipment.assigned_courier.full_name}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(shipment.created_at).toLocaleDateString('ar-YE')}</span>
                        </div>
                        
                        {shipment.qr_code && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <QrCode className="w-4 h-4" />
                            <span className="font-mono text-xs">{shipment.qr_code}</span>
                          </div>
                        )}
                      </div>

                      {shipment.books && shipment.books.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-semibold text-gray-700 mb-2">محتويات الشحنة:</p>
                          <div className="space-y-1">
                            {shipment.books.map((book: any, idx: number) => (
                              <div key={idx} className="text-sm text-gray-600">
                                • {book.title || book.name} - الكمية: {book.quantity}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {shipment.status === 'pending' && isMinistry && (
                      <select
                        onChange={(e) => handleAssignCourier(shipment.id, parseInt(e.target.value))}
                        className="px-3 py-2 border rounded-md text-sm text-right"
                        defaultValue=""
                      >
                        <option value="" disabled>تعيين مندوب</option>
                        {couriers.map(courier => (
                          <option key={courier.id} value={courier.id}>
                            {courier.full_name}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/shipments/${shipment.id}`)}
                    >
                      التفاصيل
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredShipments.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  لا توجد شحنات
                </h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'لم يتم العثور على نتائج' 
                    : 'ابدأ بإنشاء شحنة جديدة'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
