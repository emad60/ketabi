import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Building2,
  Users,
  Package,
  TruckIcon,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  School as SchoolIcon,
} from 'lucide-react';
import api from '../services/api';

interface Province {
  id: number;
  name: string;
  code?: string;
  warehouses_count?: number;
  schools_count?: number;
  drivers_count?: number;
  pending_requests?: number;
  approved_requests?: number;
  total_shipments?: number;
  pending_shipments?: number;
  delivered_shipments?: number;
}

interface Warehouse {
  id: number;
  name: string;
  location: string;
  province: string;
  capacity: number;
  current_stock: number;
}

interface School {
  id: number;
  name: string;
  address: string;
  province: string;
  province_name?: string;
  type: string;
  directorate?: string;
}

interface Driver {
  id: number;
  full_name: string;
  username: string;
  email: string;
  phone?: string;
  is_active: boolean;
  assigned_shipments_count?: number;
}

export default function ProvinceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [province, setProvince] = useState<Province | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    if (id) {
      loadProvinceData();
    }
  }, [id]);

  const loadProvinceData = async () => {
    try {
      setLoading(true);
      
      // Load province info (we'll get it from the first warehouse or school)
      const [warehousesRes, schoolsRes, driversRes] = await Promise.all([
        api.get('/warehouses/province/', { params: { page_size: 100 } }),
        api.get('/schools/', { params: { page_size: 100 } }),
        api.get('/users/', { params: { role: 'province_driver', page_size: 100 } })
      ]);

      const allWarehouses = warehousesRes.data.results || warehousesRes.data || [];
      const allSchools = schoolsRes.data.results || schoolsRes.data || [];
      const allDrivers = driversRes.data.results || driversRes.data || [];

      // Find province name from first warehouse or school
      const provinceWarehouse = allWarehouses.find((w: any) => w.id === parseInt(id!));
      const provinceName = provinceWarehouse?.province || 'محافظة';

      // Filter data for this province
      const provinceWarehouses = allWarehouses.filter((w: any) => w.id === parseInt(id!) || w.province === provinceName);
      const provinceSchools = allSchools.filter((s: any) => s.province_name === provinceName || s.province === provinceName);
      const provinceDrivers = allDrivers.filter((d: any) => d.province === provinceName);

      setWarehouses(provinceWarehouses);
      setSchools(provinceSchools);
      setDrivers(provinceDrivers);

      // Build province summary
      setProvince({
        id: parseInt(id!),
        name: provinceName,
        warehouses_count: provinceWarehouses.length,
        schools_count: provinceSchools.length,
        drivers_count: provinceDrivers.length,
        pending_requests: 0, // يمكن إضافة API call هنا
        approved_requests: 0,
        total_shipments: 0,
        pending_shipments: 0,
        delivered_shipments: 0,
      });

    } catch (error) {
      console.error('Error loading province data:', error);
      alert('فشل تحميل بيانات المحافظة');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل بيانات المحافظة...</p>
        </div>
      </div>
    );
  }

  if (!province) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">لم يتم العثور على المحافظة</h2>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            العودة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 ml-2" />
                العودة
              </Button>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {province.name}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    تفاصيل المحافظة والإحصائيات
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">المستودعات</CardTitle>
              <Package className="w-8 h-8 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{province.warehouses_count || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">المدارس</CardTitle>
              <SchoolIcon className="w-8 h-8 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{province.schools_count || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">المناديب</CardTitle>
              <Users className="w-8 h-8 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{province.drivers_count || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">الشحنات</CardTitle>
              <TruckIcon className="w-8 h-8 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{province.total_shipments || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Warehouses */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              المستودعات ({warehouses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {warehouses.length === 0 ? (
              <p className="text-center text-gray-500 py-8">لا توجد مستودعات</p>
            ) : (
              <div className="space-y-3">
                {warehouses.map(warehouse => (
                  <div key={warehouse.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{warehouse.name}</h3>
                        <p className="text-sm text-gray-600">{warehouse.location}</p>
                      </div>
                      <Badge variant="outline">
                        {warehouse.current_stock || 0} / {warehouse.capacity || 0}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Schools */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SchoolIcon className="w-5 h-5 text-green-600" />
              المدارس ({schools.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {schools.length === 0 ? (
              <p className="text-center text-gray-500 py-8">لا توجد مدارس</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {schools.map(school => (
                  <div key={school.id} className="p-3 border rounded-lg hover:bg-gray-50">
                    <h4 className="font-medium">{school.name}</h4>
                    <p className="text-sm text-gray-600">{school.address}</p>
                    <Badge variant="outline" className="mt-2">
                      {school.type === 'primary' ? 'ابتدائي' : school.type === 'secondary' ? 'ثانوي' : school.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Drivers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              المناديب ({drivers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {drivers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">لا يوجد مناديب</p>
            ) : (
              <div className="space-y-3">
                {drivers.map(driver => (
                  <div key={driver.id} className="p-3 border rounded-lg hover:bg-gray-50 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{driver.full_name}</h4>
                      <p className="text-sm text-gray-600">{driver.email}</p>
                      {driver.phone && <p className="text-sm text-gray-500">{driver.phone}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <TruckIcon className="w-3 h-3 ml-1" />
                        {driver.assigned_shipments_count || 0} شحنات
                      </Badge>
                      <Badge className={driver.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {driver.is_active ? (
                          <><CheckCircle className="w-3 h-3 ml-1" /> نشط</>
                        ) : (
                          <><XCircle className="w-3 h-3 ml-1" /> معطل</>
                        )}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
