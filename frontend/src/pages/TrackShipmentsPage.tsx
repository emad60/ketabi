import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Search, Package, TruckIcon, CheckCircle, Clock, XCircle } from 'lucide-react';
import DashboardTopNav from '../components/DashboardTopNav';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface Shipment {
  id: number;
  tracking_code: string;
  status: 'pending' | 'assigned' | 'out_for_delivery' | 'delivered' | 'confirmed' | 'canceled';
  to_school_name?: string;
  to_province_name?: string;
  books: any[];
  assigned_courier_name?: string;
  created_at: string;
  delivered_at?: string;
}

const STATUS_LABELS = {
  pending: 'قيد الإنشاء',
  assigned: 'مُسندة لمندوب',
  out_for_delivery: 'خارجة للتسليم',
  delivered: 'تم التسليم',
  confirmed: 'مؤكدة',
  canceled: 'ملغاة'
};

const STATUS_COLORS = {
  pending: 'bg-gray-50 text-gray-700 border-gray-200',
  assigned: 'bg-blue-50 text-blue-700 border-blue-200',
  out_for_delivery: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  canceled: 'bg-red-50 text-red-700 border-red-200'
};

const STATUS_ICONS = {
  pending: Clock,
  assigned: Package,
  out_for_delivery: TruckIcon,
  delivered: CheckCircle,
  confirmed: CheckCircle,
  canceled: XCircle
};

export function TrackShipmentsPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchShipments();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = shipments.filter(s =>
        s.tracking_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.to_school_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.to_province_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.assigned_courier_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredShipments(filtered);
    } else {
      setFilteredShipments(shipments);
    }
  }, [searchQuery, shipments]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      setError('');
      
      // جلب الشحنات من الـ API
      const params: any = {};
      
      // فلترة حسب دور المستخدم
      if (user?.role) {
        if (['ministry_admin', 'ministry_staff'].includes(user.role)) {
          // الوزارة: عرض جميع الشحنات من الوزارة للمحافظات
          // لا نحتاج فلترة إضافية، الـ Backend سيعرض كل شيء للوزارة
        } else if (['province_admin', 'province_staff'].includes(user.role)) {
          // المحافظة: فقط الشحنات من المحافظة للمدارس
          params.shipment_type = 'province_to_school';
          params.from_province = user.province;
        }
      }
      
      const response = await api.get('/warehouses/shipments/', { params });
      const data = response.data.results || response.data || [];
      
      setShipments(Array.isArray(data) ? data : []);
      setFilteredShipments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching shipments:', err);
      setError('فشل تحميل الشحنات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <DashboardTopNav 
        activeTab="track-shipments" 
        onTabChange={() => {}} 
        role={user?.role === 'ministry_admin' ? 'ministry' : 'province'} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">تتبع الشحنات</h1>
          <p className="text-sm text-gray-600 mt-1">تتبع حالة الشحنات الصادرة والواردة</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث برقم الشحنة أو الوجهة..."
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Shipments List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-600">جاري التحميل...</p>
              </CardContent>
            </Card>
          ) : filteredShipments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد شحنات</p>
              </CardContent>
            </Card>
          ) : (
            filteredShipments.map((shipment) => {
              const StatusIcon = STATUS_ICONS[shipment.status];
              const totalBooks = shipment.books?.reduce((sum, book) => sum + (book.quantity || 0), 0) || 0;
              const destination = shipment.to_school_name || shipment.to_province_name || 'غير محدد';
              
              return (
                <Card key={shipment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`p-3 rounded-lg ${STATUS_COLORS[shipment.status].split(' ')[0]}`}>
                          <StatusIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{shipment.tracking_code}</h3>
                            <Badge className={STATUS_COLORS[shipment.status]}>
                              {STATUS_LABELS[shipment.status]}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="block text-xs text-gray-500">الوجهة</span>
                              <span className="font-medium">{destination}</span>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500">عدد الكتب</span>
                              <span className="font-medium">{totalBooks.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500">تاريخ الإنشاء</span>
                              <span className="font-medium">
                                {new Date(shipment.created_at).toLocaleDateString('ar-YE')}
                              </span>
                            </div>
                            {shipment.assigned_courier_name && (
                              <div>
                                <span className="block text-xs text-gray-500">المندوب</span>
                                <span className="font-medium">{shipment.assigned_courier_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/shipments/${shipment.id}`}
                      >
                        التفاصيل
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
