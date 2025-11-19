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
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Truck,
  Plus,
  Package,
  User,
  MapPin,
  Calendar,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

interface ShipmentManagementProps {
  type: 'ministry' | 'capital';
}

export function ShipmentManagement({ type }: ShipmentManagementProps) {
  const [showCreateShipment, setShowCreateShipment] = useState(false);

  const representatives = [
    { id: 1, name: 'محمد أحمد الشامي', phone: '777123456', vehicle: 'شاحنة - ABC123', status: 'متاح' },
    { id: 2, name: 'علي حسن المؤيد', phone: '777234567', vehicle: 'شاحنة - DEF456', status: 'متاح' },
    { id: 3, name: 'عبدالله سعيد القحطاني', phone: '777345678', vehicle: 'شاحنة - GHI789', status: 'في مهمة' },
    { id: 4, name: 'أحمد محمود الحداد', phone: '777456789', vehicle: 'شاحنة - JKL012', status: 'متاح' },
  ];

  const shipments = [
    {
      id: 'SH-2024-001',
      destination: type === 'ministry' ? 'أمانة العاصمة' : 'مديرية الوحدة',
      representative: 'محمد أحمد الشامي',
      books: 5200,
      date: '2024-11-14',
      status: 'قيد التسليم',
      progress: 75,
    },
    {
      id: 'SH-2024-002',
      destination: type === 'ministry' ? 'تعز' : 'مديرية الصافية',
      representative: 'علي حسن المؤيد',
      books: 3800,
      date: '2024-11-14',
      status: 'تم التسليم',
      progress: 100,
    },
    {
      id: 'SH-2024-003',
      destination: type === 'ministry' ? 'الحديدة' : 'مديرية التحرير',
      representative: 'أحمد محمود الحداد',
      books: 4200,
      date: '2024-11-13',
      status: 'قيد التجهيز',
      progress: 25,
    },
    {
      id: 'SH-2024-004',
      destination: type === 'ministry' ? 'إب' : 'مديرية الثورة',
      representative: 'محمد أحمد الشامي',
      books: 2900,
      date: '2024-11-13',
      status: 'تم التسليم',
      progress: 100,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'تم التسليم':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'قيد التسليم':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'قيد التجهيز':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'ملغية':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'تم التسليم':
        return 'bg-green-100 text-green-700';
      case 'قيد التسليم':
        return 'bg-blue-100 text-blue-700';
      case 'قيد التجهيز':
        return 'bg-yellow-100 text-yellow-700';
      case 'ملغية':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">إجمالي الشحنات</p>
                <p className="text-2xl">248</p>
              </div>
              <div className={`${type === 'ministry' ? 'bg-blue-500' : 'bg-purple-500'} p-3 rounded-lg`}>
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">قيد التسليم</p>
                <p className="text-2xl">12</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">تم التسليم</p>
                <p className="text-2xl">230</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">المندوبين</p>
                <p className="text-2xl">{representatives.length}</p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Shipment */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>الشحنات</CardTitle>
            <Dialog open={showCreateShipment} onOpenChange={setShowCreateShipment}>
              <DialogTrigger asChild>
                <Button className={type === 'ministry' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}>
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء شحنة جديدة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إنشاء شحنة جديدة</DialogTitle>
                  <DialogDescription>أدخل معلومات الشحنة واختر المندوب</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>الوجهة</Label>
                      <Select>
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="اختر الوجهة" />
                        </SelectTrigger>
                        <SelectContent>
                          {type === 'ministry' ? (
                            <>
                              <SelectItem value="capital">أمانة العاصمة</SelectItem>
                              <SelectItem value="taiz">تعز</SelectItem>
                              <SelectItem value="hodeidah">الحديدة</SelectItem>
                              <SelectItem value="ibb">إب</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="wahda">مديرية الوحدة</SelectItem>
                              <SelectItem value="safia">مديرية الصافية</SelectItem>
                              <SelectItem value="tahrir">مديرية التحرير</SelectItem>
                              <SelectItem value="thawra">مديرية الثورة</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>تاريخ الشحن</Label>
                      <Input type="date" className="text-right" />
                    </div>
                  </div>

                  <div>
                    <Label>المندوب</Label>
                    <Select>
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر المندوب" />
                      </SelectTrigger>
                      <SelectContent>
                        {representatives
                          .filter((rep) => rep.status === 'متاح')
                          .map((rep) => (
                            <SelectItem key={rep.id} value={rep.id.toString()}>
                              {rep.name} - {rep.vehicle}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>محتويات الشحنة</Label>
                    <Textarea
                      placeholder="أدخل تفاصيل الكتب والكميات"
                      className="text-right"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>إجمالي عدد الكتب</Label>
                      <Input type="number" placeholder="0" className="text-right" />
                    </div>
                    <div>
                      <Label>عدد الصناديق</Label>
                      <Input type="number" placeholder="0" className="text-right" />
                    </div>
                  </div>

                  <div>
                    <Label>ملاحظات</Label>
                    <Textarea
                      placeholder="ملاحظات إضافية (اختياري)"
                      className="text-right"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      className={`flex-1 ${
                        type === 'ministry' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                    >
                      إنشاء الشحنة
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => setShowCreateShipment(false)}>
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
                <TableHead className="text-right">رقم الشحنة</TableHead>
                <TableHead className="text-right">الوجهة</TableHead>
                <TableHead className="text-right">المندوب</TableHead>
                <TableHead className="text-right">عدد الكتب</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">التقدم</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell>{shipment.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      {shipment.destination}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      {shipment.representative}
                    </div>
                  </TableCell>
                  <TableCell>{shipment.books.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {shipment.date}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                        <div
                          className={`h-2 rounded-full ${
                            shipment.progress === 100
                              ? 'bg-green-500'
                              : shipment.progress >= 50
                              ? 'bg-blue-500'
                              : 'bg-yellow-500'
                          }`}
                          style={{ width: `${shipment.progress}%` }}
                        />
                      </div>
                      <span className="text-sm">{shipment.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(shipment.status)}
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(shipment.status)}`}>
                        {shipment.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Representatives Table */}
      <Card>
        <CardHeader>
          <CardTitle>المندوبين</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">رقم الهاتف</TableHead>
                <TableHead className="text-right">المركبة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {representatives.map((rep) => (
                <TableRow key={rep.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      {rep.name}
                    </div>
                  </TableCell>
                  <TableCell>{rep.phone}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-500" />
                      {rep.vehicle}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        rep.status === 'متاح' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {rep.status}
                    </span>
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
