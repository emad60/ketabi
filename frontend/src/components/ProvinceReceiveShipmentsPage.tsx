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
  Package,
  CheckCircle,
  Clock,
  Truck,
  MapPin,
  Calendar,
  Eye,
  User,
  QrCode,
  Download,
  Check,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

interface ShipmentType {
  id: number;
  tracking_code: string;
  from_ministry?: { id: number; name: string; };
  to_province?: { id: number; name: string; province: string; };
  books: any[];
  assigned_courier?: { id: number; username: string; full_name: string; };
  status: string;
  created_at: string;
  delivered_at: string | null;
}

interface ReceiveDialogData {
  receiver_name: string;
  notes: string;
  condition: string;
}

export function ProvinceReceiveShipmentsPage() {
  const { user } = useAuthStore();
  const [shipments, setShipments] = useState<ShipmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentType | null>(null);
  const [receiving, setReceiving] = useState(false);
  const [receiveData, setReceiveData] = useState<ReceiveDialogData>({
    receiver_name: user?.full_name || '',
    notes: '',
    condition: 'good'
  });

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      
      // Get shipments for this province
      // If `user.province` is a numeric ID, send it to backend.
      // Otherwise omit the param and filter by name client-side (some test users may have only province_name).
      const params: any = { status: 'out_for_delivery' };
      if (typeof user?.province === 'number') {
        params.to_province = user.province;
      }

      const response = await api.get('/warehouses/shipments/', { params });
      let data = response.data.results || response.data || [];

      // If we didn't filter by numeric province id (because user.province was a name),
      // filter locally by `province_name` or province.name field.
      if (typeof user?.province !== 'number' && user?.province_name) {
        const pname = user.province_name;
        data = (Array.isArray(data) ? data : []).filter((s: any) => {
          return s.to_province?.province === pname || s.to_province?.name === pname || s.to_province === pname;
        });
      }

      setShipments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveShipment = (shipment: ShipmentType) => {
    setSelectedShipment(shipment);
    setReceiveData({
      receiver_name: user?.full_name || '',
      notes: '',
      condition: 'good'
    });
    setShowReceiveDialog(true);
  };

  const confirmReceive = async () => {
    if (!selectedShipment || !receiveData.receiver_name) {
      alert('يرجى إدخال اسم المستلم');
      return;
    }

    try {
      setReceiving(true);
      
      await api.post(
        `/warehouses/mobile/school/deliveries/${selectedShipment.id}/receive/`,
        {
          receiver_name: receiveData.receiver_name,
          notes: receiveData.notes,
          condition: receiveData.condition
        }
      );

      alert('✅ تم تأكيد استلام الشحنة بنجاح!');
      setShowReceiveDialog(false);
      setSelectedShipment(null);
      fetchShipments();
    } catch (error: any) {
      console.error('Error receiving shipment:', error);
      const errorMsg = error.response?.data?.error || 'حدث خطأ أثناء تأكيد الاستلام';
      alert(`❌ ${errorMsg}`);
    } finally {
      setReceiving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; color: string; icon: any }> = {
      out_for_delivery: { 
        text: 'قيد التوصيل', 
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Truck
      },
      delivered: { 
        text: 'تم التسليم', 
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: Package
      },
      confirmed: { 
        text: 'مؤكد', 
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: CheckCircle
      },
    };

    const badge = badges[status] || { 
      text: status, 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Clock
    };

    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.text}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">استلام الشحنات</h2>
          <p className="text-gray-600 mt-1">
            الشحنات الواردة من الوزارة للمحافظة
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">قيد التوصيل</p>
                <p className="text-2xl font-bold text-blue-600">
                  {shipments.filter(s => s.status === 'out_for_delivery').length}
                </p>
              </div>
              <Truck className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">في انتظار الاستلام</p>
                <p className="text-2xl font-bold text-green-600">
                  {shipments.filter(s => s.status === 'delivered').length}
                </p>
              </div>
              <Package className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الشحنات</p>
                <p className="text-2xl font-bold text-purple-600">
                  {shipments.length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الشحنات</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="mr-3 text-gray-600">جاري التحميل...</span>
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">لا توجد شحنات حالياً</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم التتبع</TableHead>
                  <TableHead className="text-right">من</TableHead>
                  <TableHead className="text-right">المندوب</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-mono font-semibold">
                      {shipment.tracking_code}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {shipment.from_ministry?.name || 'غير محدد'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {shipment.assigned_courier?.full_name || 'غير مسند'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(shipment.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(shipment.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {shipment.status === 'delivered' && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleReceiveShipment(shipment)}
                          >
                            <Check className="w-4 h-4 ml-1" />
                            تأكيد الاستلام
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`http://localhost:8000/api/warehouses/shipments/${shipment.id}/qr/`, '_blank')}
                        >
                          <QrCode className="w-4 h-4 ml-1" />
                          QR
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`http://localhost:8000/api/warehouses/shipments/${shipment.id}/report/`, '_blank')}
                        >
                          <Download className="w-4 h-4 ml-1" />
                          PDF
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Receive Confirmation Dialog */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 text-xl">
              <CheckCircle className="h-5 w-5 text-green-600" />
              تأكيد استلام الشحنة
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Shipment Info */}
            {selectedShipment && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">رقم الشحنة:</span>
                  <span className="font-semibold font-mono">{selectedShipment.tracking_code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">من:</span>
                  <span className="font-semibold">{selectedShipment.from_ministry?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">عدد الكتب:</span>
                  <span className="font-semibold">{selectedShipment.books?.length || 0}</span>
                </div>
              </div>
            )}

            {/* Receiver Name */}
            <div className="space-y-2">
              <Label htmlFor="receiver_name" className="text-right block">
                اسم المستلم <span className="text-red-500">*</span>
              </Label>
              <Input
                id="receiver_name"
                value={receiveData.receiver_name}
                onChange={(e) => setReceiveData({ ...receiveData, receiver_name: e.target.value })}
                placeholder="أدخل اسم المستلم"
                className="text-right"
              />
            </div>

            {/* Condition */}
            <div className="space-y-2">
              <Label className="text-right block">
                حالة الشحنة عند الاستلام
              </Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="condition"
                    value="good"
                    checked={receiveData.condition === 'good'}
                    onChange={(e) => setReceiveData({ ...receiveData, condition: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span>جيدة</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="condition"
                    value="damaged"
                    checked={receiveData.condition === 'damaged'}
                    onChange={(e) => setReceiveData({ ...receiveData, condition: e.target.value })}
                    className="w-4 h-4"
                  />
                  <span className="text-red-600">تالفة</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-right block">
                ملاحظات (اختياري)
              </Label>
              <Textarea
                id="notes"
                value={receiveData.notes}
                onChange={(e) => setReceiveData({ ...receiveData, notes: e.target.value })}
                placeholder="أي ملاحظات على الشحنة..."
                className="text-right min-h-[80px]"
              />
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800 text-right">
                ⚠️ بعد التأكيد، سيتم خصم الكتب من مخزون الوزارة وإضافتها لمخزون المحافظة
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowReceiveDialog(false)}
              disabled={receiving}
            >
              إلغاء
            </Button>
            <Button
              onClick={confirmReceive}
              disabled={!receiveData.receiver_name || receiving}
              className="bg-green-600 hover:bg-green-700"
            >
              {receiving ? 'جاري التأكيد...' : 'تأكيد الاستلام'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
