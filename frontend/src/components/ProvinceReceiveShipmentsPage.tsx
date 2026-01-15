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
  from_ministry_name?: string;
  to_province?: { id: number; name: string; province: string; };
  to_province_name?: string;
  books: any[];
  assigned_courier?: { id: number; username: string; full_name: string; };
  assigned_courier_details?: { id: number; username: string; full_name: string; };
  assigned_courier_name?: string;
  status: string;
  created_at: string;
  delivered_at: string | null;
  related_request?: { id: number; request_number?: string; };
  related_school_request?: { id: number; request_number?: string; };
  related_request_number?: string;
  related_school_request_number?: string;
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
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
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
      
      const response = await api.get('/warehouses/shipments/');
      const responseData = response.data.results || response.data || [];
      
      // Filter to show only ministry-to-province shipments coming to this user's province
      const userProvince = user?.province; // This is a string like "أمانة العاصمة"
      
      const filteredShipments = (Array.isArray(responseData) ? responseData : []).filter((s: any) => {
        // Only ministry-to-province shipments (type or shipment_type)
        const isMinistryToProvince = s.type === 'ministry_to_province' || s.shipment_type === 'ministry_to_province';
        
        // Check if destination matches user's province
        const destinationMatches = s.to_location === userProvince || 
                                    s.to_province === userProvince ||
                                    s.to_province?.province === userProvince;
        
        return isMinistryToProvince && destinationMatches;
      });

      console.log('📦 Total shipments from API:', responseData.length);
      console.log('🎯 Filtered for province', userProvince, ':', filteredShipments.length);
      
      setShipments(filteredShipments);
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
        `/warehouses/mobile/province/shipments/${selectedShipment.id}/receive/`,
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
                  <TableHead className="text-right">رقم الشحنة</TableHead>
                  <TableHead className="text-right">رقم التتبع</TableHead>
                  <TableHead className="text-right">رقم الطلب</TableHead>
                  <TableHead className="text-right">من</TableHead>
                  <TableHead className="text-right">المندوب</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-bold text-blue-600">
                      #{shipment.id}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {shipment.tracking_code}
                    </TableCell>
                    <TableCell>
                      {shipment.related_request_number || 
                       shipment.related_school_request_number ||
                       (shipment.related_request?.id ? `#${shipment.related_request.id}` : '') ||
                       (shipment.related_school_request?.id ? `#${shipment.related_school_request.id}` : '') ||
                       <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {shipment.from_ministry_name || shipment.from_ministry?.name || 'غير محدد'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        {shipment.assigned_courier_name || shipment.assigned_courier_details?.full_name || shipment.assigned_courier?.full_name || 'غير مسند'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(shipment.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedShipment(shipment);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          التفاصيل
                        </Button>
                        {shipment.status === 'delivered' && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleReceiveShipment(shipment)}
                          >
                            <Check className="w-4 h-4 ml-1" />
                            تأكيد
                          </Button>
                        )}
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

      {/* Shipment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الشحنة #{selectedShipment?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedShipment && (
            <div className="space-y-4">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">المعلومات الأساسية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">رقم الشحنة</p>
                      <p className="font-bold text-blue-600">#{selectedShipment.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">رقم التتبع</p>
                      <p className="font-mono font-semibold">{selectedShipment.tracking_code}</p>
                    </div>
                    {(selectedShipment.related_request_number || selectedShipment.related_school_request_number || selectedShipment.related_request || selectedShipment.related_school_request) && (
                      <div>
                        <p className="text-sm text-gray-600">رقم الطلب</p>
                        <p className="font-semibold">
                          {selectedShipment.related_request_number || 
                           selectedShipment.related_school_request_number ||
                           (selectedShipment.related_request?.id ? `#${selectedShipment.related_request.id}` : '') ||
                           (selectedShipment.related_school_request?.id ? `#${selectedShipment.related_school_request.id}` : '')}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">الحالة</p>
                      {getStatusBadge(selectedShipment.status)}
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">من</p>
                        <p className="font-semibold">{selectedShipment.from_ministry_name || selectedShipment.from_ministry?.name || 'غير محدد'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">إلى</p>
                        <p className="font-semibold">{selectedShipment.to_province_name || selectedShipment.to_province?.name || 'غير محدد'}</p>
                      </div>
                    </div>
                  </div>

                  {(selectedShipment.assigned_courier_details || selectedShipment.assigned_courier || selectedShipment.assigned_courier_name) && (
                    <div className="border-t pt-3">
                      <p className="text-sm text-gray-600">المندوب</p>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold">{selectedShipment.assigned_courier_name || selectedShipment.assigned_courier_details?.full_name || selectedShipment.assigned_courier?.full_name}</span>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-600">تاريخ الإنشاء</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(selectedShipment.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Books List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">الكتب ({selectedShipment.books?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedShipment.books?.map((book: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded border"
                      >
                        <span className="flex-1">{book.title || book.book_title || 'كتاب'}</span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-semibold">
                          {book.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`http://45.77.65.134/api/warehouses/shipments/${selectedShipment.id}/qr/`, '_blank')}
                >
                  <QrCode className="w-4 h-4 ml-2" />
                  عرض QR Code
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(`http://45.77.65.134/api/warehouses/shipments/${selectedShipment.id}/report/`, '_blank')}
                >
                  <Download className="w-4 h-4 ml-2" />
                  تحميل التقرير PDF
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
