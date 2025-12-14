import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Search, Package, TruckIcon, CheckCircle, Clock, XCircle } from 'lucide-react';
import DashboardTopNav from '../components/DashboardTopNav';
import { useAuthStore } from '../store/authStore';

interface Shipment {
  id: string;
  shipment_number: string;
  status: 'pending' | 'assigned' | 'out_for_delivery' | 'delivered' | 'confirmed';
  destination: string;
  items_count: number;
  courier_name?: string;
  created_at: string;
  delivery_date?: string;
}

const STATUS_LABELS = {
  pending: 'معلق',
  assigned: 'مكلف',
  out_for_delivery: 'جاري التوصيل',
  delivered: 'تم التسليم',
  confirmed: 'مؤكد'
};

const STATUS_COLORS = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  assigned: 'bg-blue-50 text-blue-700 border-blue-200',
  out_for_delivery: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

const STATUS_ICONS = {
  pending: Clock,
  assigned: Package,
  out_for_delivery: TruckIcon,
  delivered: CheckCircle,
  confirmed: CheckCircle
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
        s.shipment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.destination.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredShipments(filtered);
    } else {
      setFilteredShipments(shipments);
    }
  }, [searchQuery, shipments]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockShipments: Shipment[] = [
        {
          id: '1',
          shipment_number: 'SH-2024-001',
          status: 'out_for_delivery',
          destination: 'مديرية الوحدة',
          items_count: 5200,
          courier_name: 'محمد أحمد الشامي',
          created_at: '2024-11-14',
          delivery_date: '2024-11-15'
        },
        {
          id: '2',
          shipment_number: 'SH-2024-002',
          status: 'delivered',
          destination: 'مديرية الصافية',
          items_count: 3800,
          courier_name: 'علي حسن المؤيد',
          created_at: '2024-11-12',
          delivery_date: '2024-11-14'
        },
        {
          id: '3',
          shipment_number: 'SH-2024-003',
          status: 'pending',
          destination: 'مديرية التحرير',
          items_count: 4200,
          created_at: '2024-11-13'
        }
      ];
      
      setShipments(mockShipments);
      setFilteredShipments(mockShipments);
    } catch (err: any) {
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
                            <h3 className="font-semibold text-lg">{shipment.shipment_number}</h3>
                            <Badge className={STATUS_COLORS[shipment.status]}>
                              {STATUS_LABELS[shipment.status]}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="block text-xs text-gray-500">الوجهة</span>
                              <span className="font-medium">{shipment.destination}</span>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500">عدد الكتب</span>
                              <span className="font-medium">{shipment.items_count.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500">تاريخ الإنشاء</span>
                              <span className="font-medium">{shipment.created_at}</span>
                            </div>
                            {shipment.courier_name && (
                              <div>
                                <span className="block text-xs text-gray-500">المندوب</span>
                                <span className="font-medium">{shipment.courier_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
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
