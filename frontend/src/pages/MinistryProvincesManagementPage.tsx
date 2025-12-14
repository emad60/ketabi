import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Building2, MapPin, Package, TruckIcon, AlertCircle, Plus, Edit, Trash2
} from 'lucide-react';
import { apiService } from '../services/apiService';

interface Province {
  id: number;
  name: string;
  code: string;
  warehouse_id?: number;
  warehouse_name?: string;
  total_schools: number;
  active_requests: number;
  pending_shipments: number;
  inventory_status: 'good' | 'low' | 'critical';
}

export const MinistryProvincesManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProvinces = async () => {
    setLoading(true);
    try {
      const data = await apiService.getProvinces();
      setProvinces(data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching provinces:', err);
      setError('فشل تحميل بيانات المحافظات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProvinces();
  }, []);

  const filteredProvinces = provinces.filter(province =>
    province.name.includes(searchTerm) ||
    province.code.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">⏳</div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <Button
            onClick={() => navigate('/ministry/dashboard')}
            variant="ghost"
            className="mb-4"
          >
            ← العودة
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">إدارة المحافظات</h1>
              <p className="text-gray-600 mt-2">
                إدارة جميع المحافظات والمخازن التابعة لها
              </p>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              إضافة محافظة
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardContent className="pt-6">
            <Input
              placeholder="بحث عن محافظة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProvinces.length > 0 ? (
            filteredProvinces.map((province) => (
              <Card key={province.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-50 p-2 rounded-lg">
                        <Building2 className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{province.name}</CardTitle>
                        <p className="text-sm text-gray-600">الرمز: {province.code}</p>
                      </div>
                    </div>
                    <Badge
                      className={
                        province.inventory_status === 'good'
                          ? 'bg-green-100 text-green-800'
                          : province.inventory_status === 'low'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {province.inventory_status === 'good'
                        ? 'جيد'
                        : province.inventory_status === 'low'
                        ? 'منخفض'
                        : 'حرج'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {province.warehouse_name && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Package className="w-4 h-4 text-blue-600" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-600">المستودع</p>
                        <p className="text-sm font-medium">{province.warehouse_name}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-blue-50 rounded text-center">
                      <p className="text-xs text-blue-600">المدارس</p>
                      <p className="text-lg font-bold text-blue-700">{province.total_schools}</p>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded text-center">
                      <p className="text-xs text-yellow-600">الطلبات</p>
                      <p className="text-lg font-bold text-yellow-700">{province.active_requests}</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded text-center">
                      <p className="text-xs text-purple-600">الشحنات</p>
                      <p className="text-lg font-bold text-purple-700">{province.pending_shipments}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/ministry/provinces/${province.id}`)}
                    >
                      <Edit className="w-4 h-4 ml-2" />
                      تفاصيل
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/ministry/province-requests?province=${province.id}`)}
                    >
                      <MapPin className="w-4 h-4 ml-2" />
                      الطلبات
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">لا توجد محافظات</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
