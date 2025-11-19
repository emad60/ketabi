import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Truck, UserCheck, Clock, Navigation, BarChart as BarChartIcon } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAuthStore } from '../store/authStore';

export function ProvinceCourierManagementPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [couriers, setCouriers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(false);
      // Temporary mock data
      setCouriers([
        {
          id: 1,
          name: 'أحمد محمد علي',
          phone: '771234567',
          vehicle_number: 'أ ب ج 1234',
          status: 'available',
          deliveries: 15,
        },
        {
          id: 2,
          name: 'محمد حسن الشرفي',
          phone: '777654321',
          vehicle_number: 'أ ب ج 5678',
          status: 'in_delivery',
          deliveries: 23,
        },
        {
          id: 3,
          name: 'عبدالله صالح المطري',
          phone: '773456789',
          vehicle_number: 'أ ب ج 9012',
          status: 'available',
          deliveries: 18,
        },
        {
          id: 4,
          name: 'ياسر عبده قائد',
          phone: '779876543',
          vehicle_number: 'أ ب ج 3456',
          status: 'in_delivery',
          deliveries: 20,
        },
      ]);
    } catch (error) {
      console.error('Error fetching couriers:', error);
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <UserCheck className="w-5 h-5 text-green-600" />;
      case 'in_delivery':
        return <Navigation className="w-5 h-5 text-blue-600" />;
      case 'offline':
        return <Clock className="w-5 h-5 text-gray-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      available: 'متاح',
      in_delivery: 'في توصيل',
      offline: 'غير متصل',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'in_delivery':
        return 'bg-blue-100 text-blue-700';
      case 'offline':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const deliveryData = couriers.map(courier => ({
    name: courier.name.split(' ')[0], // First name only for chart
    deliveries: courier.deliveries,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">إجمالي السائقين</p>
                <p className="text-3xl font-bold">{couriers.length}</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">متاح</p>
                <p className="text-3xl font-bold">
                  {couriers.filter(c => c.status === 'available').length}
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">في توصيل</p>
                <p className="text-3xl font-bold">
                  {couriers.filter(c => c.status === 'in_delivery').length}
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Navigation className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">إجمالي التوصيلات</p>
                <p className="text-3xl font-bold">
                  {couriers.reduce((sum, c) => sum + c.deliveries, 0)}
                </p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <BarChartIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>عدد التوصيلات لكل سائق</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deliveryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="deliveries" fill="#8B5CF6" name="عدد التوصيلات" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Couriers Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>قائمة السائقين</CardTitle>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Truck className="ml-2 w-4 h-4" />
              إضافة سائق
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">رقم الهاتف</TableHead>
                <TableHead className="text-right">رقم المركبة</TableHead>
                <TableHead className="text-right">عدد التوصيلات</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {couriers.map((courier) => (
                <TableRow key={courier.id}>
                  <TableCell className="font-medium">{courier.name}</TableCell>
                  <TableCell>{courier.phone}</TableCell>
                  <TableCell>{courier.vehicle_number}</TableCell>
                  <TableCell>{courier.deliveries}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(courier.status)}
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(courier.status)}`}>
                        {getStatusText(courier.status)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        عرض
                      </Button>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        تعيين مهمة
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
