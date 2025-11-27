import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
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
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Truck, 
  XCircle,
  Navigation,
  Eye,
  Search
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface ShipmentLocation {
  timestamp: string;
  location: string;
  status: string;
  notes?: string;
}

interface Shipment {
  id: number;
  tracking_number: string;
  from_warehouse: string;
  to_warehouse: string;
  courier_name?: string;
  courier_phone?: string;
  status: string;
  created_at: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  total_books: number;
  tracking_history: ShipmentLocation[];
}

export function ShipmentTrackingPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(false);
      // Mock data - replace with actual API call
      setShipments([
        {
          id: 1,
          tracking_number: 'SHP-2024-001',
          from_warehouse: 'مخزن الوزارة المركزي',
          to_warehouse: 'مخزن أمانة العاصمة',
          courier_name: 'أحمد محمد علي',
          courier_phone: '771234567',
          status: 'in_transit',
          created_at: '2024-11-15 08:00',
          estimated_delivery: '2024-11-16 14:00',
          total_books: 500,
          tracking_history: [
            {
              timestamp: '2024-11-15 08:00',
              location: 'مخزن الوزارة المركزي',
              status: 'picked_up',
              notes: 'تم استلام الشحنة من المخزن'
            },
            {
              timestamp: '2024-11-15 10:30',
              location: 'محافظة صنعاء - نقطة التفتيش الأولى',
              status: 'in_transit',
              notes: 'تم تجاوز نقطة التفتيش بنجاح'
            },
            {
              timestamp: '2024-11-15 14:00',
              location: 'أمانة العاصمة - مدخل المدينة',
              status: 'in_transit',
              notes: 'اقتراب من الوجهة'
            },
          ],
        },
        {
          id: 2,
          tracking_number: 'SHP-2024-002',
          from_warehouse: 'مخزن الوزارة المركزي',
          to_warehouse: 'مخزن محافظة تعز',
          courier_name: 'محمد حسن الشرفي',
          courier_phone: '777654321',
          status: 'delivered',
          created_at: '2024-11-14 09:00',
          estimated_delivery: '2024-11-15 16:00',
          actual_delivery: '2024-11-15 15:30',
          total_books: 750,
          tracking_history: [
            {
              timestamp: '2024-11-14 09:00',
              location: 'مخزن الوزارة المركزي',
              status: 'picked_up',
            },
            {
              timestamp: '2024-11-15 15:30',
              location: 'مخزن محافظة تعز',
              status: 'delivered',
              notes: 'تم التسليم بنجاح'
            },
          ],
        },
        {
          id: 3,
          tracking_number: 'SHP-2024-003',
          from_warehouse: 'مخزن الوزارة المركزي',
          to_warehouse: 'مخزن محافظة الحديدة',
          courier_name: 'عبدالله صالح المطري',
          courier_phone: '773456789',
          status: 'pending',
          created_at: '2024-11-16 07:00',
          estimated_delivery: '2024-11-17 18:00',
          total_books: 600,
          tracking_history: [
            {
              timestamp: '2024-11-16 07:00',
              location: 'مخزن الوزارة المركزي',
              status: 'pending',
              notes: 'في انتظار الشاحن'
            },
          ],
        },
        {
          id: 4,
          tracking_number: 'SHP-2024-004',
          from_warehouse: 'مخزن أمانة العاصمة',
          to_warehouse: 'مخزن محافظة صنعاء',
          courier_name: 'ياسر عبده قائد',
          courier_phone: '779876543',
          status: 'cancelled',
          created_at: '2024-11-13 10:00',
          total_books: 400,
          tracking_history: [
            {
              timestamp: '2024-11-13 10:00',
              location: 'مخزن أمانة العاصمة',
              status: 'cancelled',
              notes: 'تم إلغاء الشحنة بناءً على طلب المحافظة'
            },
          ],
        },
      ]);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      setLoading(false);
    }
  };

  const handleViewDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsDetailDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_transit':
        return <Navigation className="w-5 h-5 text-blue-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'picked_up':
        return <Truck className="w-5 h-5 text-purple-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'في الانتظار',
      picked_up: 'تم الاستلام',
      in_transit: 'في الطريق',
      delivered: 'تم التسليم',
      cancelled: 'ملغي',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'in_transit':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'picked_up':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredShipments = shipments.filter(shipment => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      (shipment.tracking_number || '').toLowerCase().includes(q) ||
      (shipment.from_warehouse || '').toLowerCase().includes(q) ||
      (shipment.to_warehouse || '').toLowerCase().includes(q) ||
      ((shipment.courier_name || '').toLowerCase().includes(q));
    
    const matchesStatus = filterStatus === 'all' || shipment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">تتبع الشحنات</h2>
        <p className="text-sm text-gray-600 mt-1">تتبع حالة الشحنات في الوقت الفعلي</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">إجمالي الشحنات</p>
                <p className="text-3xl font-bold">{shipments.length}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">في الانتظار</p>
                <p className="text-3xl font-bold">
                  {shipments.filter(s => s.status === 'pending').length}
                </p>
              </div>
              <div className="bg-yellow-500 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">في الطريق</p>
                <p className="text-3xl font-bold">
                  {shipments.filter(s => s.status === 'in_transit').length}
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
                <p className="text-sm text-gray-600 mb-2">تم التسليم</p>
                <p className="text-3xl font-bold">
                  {shipments.filter(s => s.status === 'delivered').length}
                </p>
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
                <p className="text-sm text-gray-600 mb-2">ملغي</p>
                <p className="text-3xl font-bold">
                  {shipments.filter(s => s.status === 'cancelled').length}
                </p>
              </div>
              <div className="bg-red-500 p-3 rounded-lg">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="بحث برقم التتبع، المخزن، أو السائق..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الشحنات</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="picked_up">تم الاستلام</SelectItem>
                <SelectItem value="in_transit">في الطريق</SelectItem>
                <SelectItem value="delivered">تم التسليم</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الشحنات ({filteredShipments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم التتبع</TableHead>
                <TableHead className="text-right">من</TableHead>
                <TableHead className="text-right">إلى</TableHead>
                <TableHead className="text-right">السائق</TableHead>
                <TableHead className="text-right">عدد الكتب</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell className="font-medium">{shipment.tracking_number}</TableCell>
                  <TableCell className="text-sm">{shipment.from_warehouse}</TableCell>
                  <TableCell className="text-sm">{shipment.to_warehouse}</TableCell>
                  <TableCell className="text-sm">{shipment.courier_name || '-'}</TableCell>
                  <TableCell>{shipment.total_books}</TableCell>
                  <TableCell className="text-sm">{shipment.created_at}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(shipment.status)}
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(shipment.status)}`}>
                        {getStatusText(shipment.status)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(shipment)}
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      تتبع
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الشحنة</DialogTitle>
            <DialogDescription>
              {selectedShipment?.tracking_number}
            </DialogDescription>
          </DialogHeader>

          {selectedShipment && (
            <div className="space-y-6">
              {/* Shipment Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">من</p>
                  <p className="font-medium">{selectedShipment.from_warehouse}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">إلى</p>
                  <p className="font-medium">{selectedShipment.to_warehouse}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">السائق</p>
                  <p className="font-medium">{selectedShipment.courier_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">رقم الهاتف</p>
                  <p className="font-medium">{selectedShipment.courier_phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">عدد الكتب</p>
                  <p className="font-medium">{selectedShipment.total_books}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الحالة</p>
                  <span className={`px-3 py-1 rounded-full text-sm inline-block ${getStatusColor(selectedShipment.status)}`}>
                    {getStatusText(selectedShipment.status)}
                  </span>
                </div>
                {selectedShipment.estimated_delivery && (
                  <div>
                    <p className="text-sm text-gray-600">الوقت المتوقع للتسليم</p>
                    <p className="font-medium">{selectedShipment.estimated_delivery}</p>
                  </div>
                )}
                {selectedShipment.actual_delivery && (
                  <div>
                    <p className="text-sm text-gray-600">وقت التسليم الفعلي</p>
                    <p className="font-medium text-green-600">{selectedShipment.actual_delivery}</p>
                  </div>
                )}
              </div>

              {/* Tracking Timeline */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  سجل التتبع
                </h3>
                <div className="relative">
                  <div className="absolute top-0 bottom-0 right-5 w-0.5 bg-gray-300"></div>
                  <div className="space-y-4">
                    {selectedShipment.tracking_history.map((location, index) => (
                      <div key={index} className="relative pr-12 pb-4">
                        <div className="absolute right-3 top-0 w-5 h-5 rounded-full bg-white border-4 border-blue-500 z-10"></div>
                        <div className="bg-white p-4 rounded-lg border">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(location.status)}
                              <span className={`px-2 py-1 rounded text-sm ${getStatusColor(location.status)}`}>
                                {getStatusText(location.status)}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">{location.timestamp}</span>
                          </div>
                          <p className="font-medium mb-1">{location.location}</p>
                          {location.notes && (
                            <p className="text-sm text-gray-600">{location.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
