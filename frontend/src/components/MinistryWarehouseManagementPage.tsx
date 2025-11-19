import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
  Eye,
  MapPin,
  Users,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

interface MinistryWarehouse {
  id: number;
  name: string;
  location: string;
  staff: number[];
}

export function MinistryWarehouseManagementPage() {
  const [warehouses, setWarehouses] = useState<MinistryWarehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    location: ''
  });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/warehouses/ministry/');
      const data = response.data.results || response.data;
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWarehouse = async () => {
    try {
      await api.post('/warehouses/ministry/', newWarehouse);
      setNewWarehouse({ name: '', location: '' });
      setShowAddWarehouse(false);
      fetchWarehouses();
    } catch (err) {
      console.error('Error adding warehouse:', err);
    }
  };

  const stats = [
    { title: 'إجمالي المخازن', value: warehouses.length.toString(), icon: Warehouse, color: 'bg-blue-500' },
    { title: 'المخازن النشطة', value: warehouses.length.toString(), icon: Package, color: 'bg-green-500' },
    { title: 'السعة الكلية', value: '2,150,000', icon: TrendingUp, color: 'bg-purple-500' },
    { title: 'معدل الاستخدام', value: '68.5%', icon: AlertTriangle, color: 'bg-orange-500' },
  ];

  const warehouseChartData = warehouses.map(w => ({
    name: w.name.split(' - ')[0],
    capacity: 500000,
    current: Math.floor(Math.random() * 400000) + 100000
  }));

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إدارة المخازن</h2>
          <p className="text-gray-600 mt-1">وزارة التربية والتعليم - الجمهورية اليمنية</p>
        </div>
        <Dialog open={showAddWarehouse} onOpenChange={setShowAddWarehouse}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="ml-2 h-4 w-4" />
              إضافة مخزن جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مخزن جديد</DialogTitle>
              <DialogDescription>
                أدخل معلومات المخزن الجديد
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse-name">اسم المخزن</Label>
                <Input
                  id="warehouse-name"
                  placeholder="مثال: المخزن المركزي - صنعاء"
                  value={newWarehouse.name}
                  onChange={(e) => setNewWarehouse({...newWarehouse, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse-location">الموقع</Label>
                <Input
                  id="warehouse-location"
                  placeholder="مثال: صنعاء - شارع الزبيري"
                  value={newWarehouse.location}
                  onChange={(e) => setNewWarehouse({...newWarehouse, location: e.target.value})}
                />
              </div>
              <Button onClick={handleAddWarehouse} className="w-full">
                حفظ المخزن
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>سعة المخازن والاستخدام</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={warehouseChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="capacity" fill="#3b82f6" name="السعة الكلية" />
              <Bar dataKey="current" fill="#10b981" name="المخزون الحالي" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Warehouses Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المخازن</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المخزن</TableHead>
                <TableHead className="text-right">الموقع</TableHead>
                <TableHead className="text-right">الموظفين</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Warehouse className="h-4 w-4 text-blue-600" />
                      {warehouse.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {warehouse.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4" />
                      {warehouse.staff.length} موظف
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      نشط
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 ml-2" />
                      عرض التفاصيل
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {warehouses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    لا توجد مخازن مضافة حالياً
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
