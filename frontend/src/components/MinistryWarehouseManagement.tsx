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
  TrendingUp,
  AlertTriangle,
  Edit,
  Eye,
  MapPin,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function MinistryWarehouseManagement() {
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);

  const warehouses = [
    { id: 1, name: 'المخزن المركزي - صنعاء', location: 'أمانة العاصمة', capacity: 500000, current: 342500, status: 'نشط', manager: 'أحمد محمد' },
    { id: 2, name: 'مخزن تعز الرئيسي', location: 'تعز', capacity: 300000, current: 198400, status: 'نشط', manager: 'علي حسن' },
    { id: 3, name: 'مخزن الحديدة', location: 'الحديدة', capacity: 250000, current: 156200, status: 'نشط', manager: 'محمد أحمد' },
    { id: 4, name: 'مخزن إب', location: 'إب', capacity: 200000, current: 142300, status: 'نشط', manager: 'عبدالله سعيد' },
    { id: 5, name: 'مخزن ذمار', location: 'ذمار', capacity: 180000, current: 98400, status: 'نشط', manager: 'حسين علي' },
    { id: 6, name: 'مخزن صنعاء', location: 'صنعاء', capacity: 220000, current: 178600, status: 'صيانة', manager: 'خالد محمود' },
  ];

  const bookInventory = [
    { id: 1, title: 'اللغة العربية - الصف الأول', subject: 'لغة عربية', grade: 'الأول', quantity: 45200, minStock: 10000, warehouse: 'المخزن المركزي', status: 'متوفر' },
    { id: 2, title: 'الرياضيات - الصف الثاني', subject: 'رياضيات', grade: 'الثاني', quantity: 38400, minStock: 10000, warehouse: 'المخزن المركزي', status: 'متوفر' },
    { id: 3, title: 'العلوم - الصف الثالث', subject: 'علوم', grade: 'الثالث', quantity: 8200, minStock: 10000, warehouse: 'مخزن تعز', status: 'ناقص' },
    { id: 4, title: 'اللغة الإنجليزية - الصف الرابع', subject: 'إنجليزي', grade: 'الرابع', quantity: 32100, minStock: 10000, warehouse: 'المخزن المركزي', status: 'متوفر' },
    { id: 5, title: 'التربية الإسلامية - الصف الخامس', subject: 'تربية إسلامية', grade: 'الخامس', quantity: 4500, minStock: 10000, warehouse: 'مخزن الحديدة', status: 'حرج' },
    { id: 6, title: 'التاريخ - الصف السادس', subject: 'تاريخ', grade: 'السادس', quantity: 28900, minStock: 10000, warehouse: 'المخزن المركزي', status: 'متوفر' },
  ];

  const warehouseStats = [
    { name: 'المركزي', capacity: 500000, current: 342500 },
    { name: 'تعز', capacity: 300000, current: 198400 },
    { name: 'الحديدة', capacity: 250000, current: 156200 },
    { name: 'إب', capacity: 200000, current: 142300 },
    { name: 'ذمار', capacity: 180000, current: 98400 },
  ];

  const stockBySubject = [
    { name: 'اللغة العربية', value: 85200, color: '#3b82f6' },
    { name: 'الرياضيات', value: 72400, color: '#10b981' },
    { name: 'العلوم', value: 58200, color: '#f59e0b' },
    { name: 'الإنجليزية', value: 64100, color: '#8b5cf6' },
    { name: 'أخرى', value: 62600, color: '#ef4444' },
  ];

  const stats = [
    { title: 'إجمالي المخازن', value: '6', icon: Warehouse, color: 'bg-blue-500' },
    { title: 'إجمالي المخزون', value: '342,500', icon: Package, color: 'bg-green-500' },
    { title: 'كتب ناقصة', value: '3', icon: AlertTriangle, color: 'bg-red-500' },
    { title: 'معدل الاستخدام', value: '68.5%', icon: TrendingUp, color: 'bg-purple-500' },
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
            <CardTitle>سعة المخازن والمخزون الحالي</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={warehouseStats}>
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

        <Card>
          <CardHeader>
            <CardTitle>توزيع المخزون حسب المادة</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stockBySubject}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stockBySubject.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Warehouses Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>المخازن</CardTitle>
            <Dialog open={showAddWarehouse} onOpenChange={setShowAddWarehouse}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة مخزن
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة مخزن جديد</DialogTitle>
                  <DialogDescription>أدخل معلومات المخزن الجديد</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>اسم المخزن</Label>
                    <Input placeholder="مثال: مخزن عدن الرئيسي" className="text-right" />
                  </div>
                  <div>
                    <Label>الموقع</Label>
                    <Input placeholder="المحافظة" className="text-right" />
                  </div>
                  <div>
                    <Label>السعة الكلية</Label>
                    <Input type="number" placeholder="عدد الكتب" className="text-right" />
                  </div>
                  <div>
                    <Label>اسم المدير</Label>
                    <Input placeholder="اسم المدير المسؤول" className="text-right" />
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700">حفظ</Button>
                    <Button variant="outline" className="flex-1" onClick={() => setShowAddWarehouse(false)}>
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
                <TableHead className="text-right">اسم المخزن</TableHead>
                <TableHead className="text-right">الموقع</TableHead>
                <TableHead className="text-right">السعة الكلية</TableHead>
                <TableHead className="text-right">المخزون الحالي</TableHead>
                <TableHead className="text-right">نسبة الاستخدام</TableHead>
                <TableHead className="text-right">المدير</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((warehouse) => {
                const usage = ((warehouse.current / warehouse.capacity) * 100).toFixed(1);
                return (
                  <TableRow key={warehouse.id}>
                    <TableCell>{warehouse.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        {warehouse.location}
                      </div>
                    </TableCell>
                    <TableCell>{warehouse.capacity.toLocaleString()}</TableCell>
                    <TableCell>{warehouse.current.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                          <div
                            className={`h-2 rounded-full ${
                              parseFloat(usage) > 80 ? 'bg-red-500' : parseFloat(usage) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${usage}%` }}
                          />
                        </div>
                        <span className="text-sm">{usage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{warehouse.manager}</TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          warehouse.status === 'نشط' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {warehouse.status}
                      </span>
                    </TableCell>
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

      {/* Book Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>مخزون الكتب</CardTitle>
            <Dialog open={showAddBook} onOpenChange={setShowAddBook}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة كتب
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة كتب للمخزون</DialogTitle>
                  <DialogDescription>أدخل معلومات الكتب الجديدة</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>عنوان الكتاب</Label>
                    <Input placeholder="مثال: اللغة العربية - الصف الأول" className="text-right" />
                  </div>
                  <div>
                    <Label>المادة</Label>
                    <Input placeholder="لغة عربية" className="text-right" />
                  </div>
                  <div>
                    <Label>الصف</Label>
                    <Input placeholder="الأول" className="text-right" />
                  </div>
                  <div>
                    <Label>الكمية</Label>
                    <Input type="number" placeholder="عدد النسخ" className="text-right" />
                  </div>
                  <div>
                    <Label>المخزن</Label>
                    <Input placeholder="اسم المخزن" className="text-right" />
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700">حفظ</Button>
                    <Button variant="outline" className="flex-1" onClick={() => setShowAddBook(false)}>
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
                <TableHead className="text-right">المادة</TableHead>
                <TableHead className="text-right">الصف</TableHead>
                <TableHead className="text-right">الكمية</TableHead>
                <TableHead className="text-right">الحد الأدنى</TableHead>
                <TableHead className="text-right">المخزن</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookInventory.map((book) => (
                <TableRow key={book.id}>
                  <TableCell>{book.title}</TableCell>
                  <TableCell>{book.subject}</TableCell>
                  <TableCell>{book.grade}</TableCell>
                  <TableCell>{book.quantity.toLocaleString()}</TableCell>
                  <TableCell>{book.minStock.toLocaleString()}</TableCell>
                  <TableCell>{book.warehouse}</TableCell>
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
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
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
