import { useState } from 'react';
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
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Package,
  Plus,
  Warehouse,
  TrendingDown,
  AlertTriangle,
  Edit,
  Eye,
  Building2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export function CapitalWarehouseManagement() {
  const [showAddStock, setShowAddStock] = useState(false);

  const localWarehouses = [
    { id: 1, name: 'مخزن الوحدة', district: 'الوحدة', capacity: 50000, current: 32400, manager: 'محمد صالح' },
    { id: 2, name: 'مخزن الصافية', district: 'الصافية', capacity: 45000, current: 28600, manager: 'أحمد علي' },
    { id: 3, name: 'مخزن التحرير', district: 'التحرير', capacity: 48000, current: 35200, manager: 'عبدالله حسين' },
  ];

  const bookStock = [
    { id: 1, title: '��للغة العربية - الصف الأول', grade: 'الأول', quantity: 12400, warehouse: 'مخزن الوحدة', lastUpdate: '2024-11-14', status: 'متوفر' },
    { id: 2, title: 'الرياضيات - الصف الثاني', grade: 'الثاني', quantity: 10800, warehouse: 'مخزن الصافية', lastUpdate: '2024-11-14', status: 'متوفر' },
    { id: 3, title: 'العلوم - الصف الثالث', grade: 'الثالث', quantity: 3200, warehouse: 'مخزن التحرير', lastUpdate: '2024-11-13', status: 'ناقص' },
    { id: 4, title: 'اللغة الإنجليزية - الصف الرابع', grade: 'الرابع', quantity: 9600, warehouse: 'مخزن الوحدة', lastUpdate: '2024-11-13', status: 'متوفر' },
    { id: 5, title: 'التربية الإسلامية - الصف الخامس', grade: 'الخامس', quantity: 1800, warehouse: 'مخزن الصافية', lastUpdate: '2024-11-12', status: 'حرج' },
  ];

  const monthlyConsumption = [
    { month: 'أكتوبر', distributed: 18500, received: 22000 },
    { month: 'نوفمبر', distributed: 22300, received: 19000 },
    { month: 'ديسمبر', distributed: 19800, received: 21000 },
  ];

  const stats = [
    { title: 'المخازن المحلية', value: '3', icon: Warehouse, color: 'bg-purple-500' },
    { title: 'إجمالي المخزون', value: '96,200', icon: Package, color: 'bg-green-500' },
    { title: 'كتب ناقصة', value: '2', icon: AlertTriangle, color: 'bg-red-500' },
    { title: 'الاستهلاك الشهري', value: '22,300', icon: TrendingDown, color: 'bg-blue-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                  <p className="text-2xl">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>المخازن المحلية</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={localWarehouses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="capacity" fill="#8b5cf6" name="السعة" />
                <Bar dataKey="current" fill="#10b981" name="المخزون" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الاستهلاك والوارد الشهري</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyConsumption}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="distributed" stroke="#ef4444" strokeWidth={2} name="الموزع" />
                <Line type="monotone" dataKey="received" stroke="#10b981" strokeWidth={2} name="الوارد" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Local Warehouses Table */}
      <Card>
        <CardHeader>
          <CardTitle>المخازن المحلية</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم المخزن</TableHead>
                <TableHead className="text-right">المديرية</TableHead>
                <TableHead className="text-right">السعة الكلية</TableHead>
                <TableHead className="text-right">المخزون الحالي</TableHead>
                <TableHead className="text-right">نسبة الاستخدام</TableHead>
                <TableHead className="text-right">المدير</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localWarehouses.map((warehouse) => {
                const usage = ((warehouse.current / warehouse.capacity) * 100).toFixed(1);
                return (
                  <TableRow key={warehouse.id}>
                    <TableCell>{warehouse.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        {warehouse.district}
                      </div>
                    </TableCell>
                    <TableCell>{warehouse.capacity.toLocaleString()}</TableCell>
                    <TableCell>{warehouse.current.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${usage}%` }}
                          />
                        </div>
                        <span className="text-sm">{usage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{warehouse.manager}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Book Stock Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>مخزون الكتب</CardTitle>
            <Dialog open={showAddStock} onOpenChange={setShowAddStock}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 ml-2" />
                  تحديث المخزون
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>تحديث مخزون الكتب</DialogTitle>
                  <DialogDescription>أدخل معلومات الكتب الواردة</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>عنوان الكتاب</Label>
                    <Input placeholder="اختر الكتاب" className="text-right" />
                  </div>
                  <div>
                    <Label>الكمية الواردة</Label>
                    <Input type="number" placeholder="عدد النسخ" className="text-right" />
                  </div>
                  <div>
                    <Label>المخزن</Label>
                    <Input placeholder="اختر المخزن" className="text-right" />
                  </div>
                  <div>
                    <Label>رقم الشحنة</Label>
                    <Input placeholder="رقم الشحنة من الوزارة" className="text-right" />
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-purple-600 hover:bg-purple-700">حفظ</Button>
                    <Button variant="outline" className="flex-1" onClick={() => setShowAddStock(false)}>
                      إلغاء
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">عنوان الكتاب</TableHead>
                <TableHead className="text-right">الصف</TableHead>
                <TableHead className="text-right">الكمية</TableHead>
                <TableHead className="text-right">المخزن</TableHead>
                <TableHead className="text-right">آخر تحديث</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookStock.map((book) => (
                <TableRow key={book.id}>
                  <TableCell>{book.title}</TableCell>
                  <TableCell>{book.grade}</TableCell>
                  <TableCell>{book.quantity.toLocaleString()}</TableCell>
                  <TableCell>{book.warehouse}</TableCell>
                  <TableCell>{book.lastUpdate}</TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        book.status === 'متوفر'
                          ? 'bg-green-100 text-green-700'
                          : book.status === 'ناقص'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {book.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
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
