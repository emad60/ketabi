import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
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
  TruckIcon,
  Package,
  Eye,
  Loader2,
  ArrowUp,
  ArrowDown,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import api from '../services/api';
import shipmentsService from '../services/shipments';
import requestsService from '../services/requests';
import { Link } from 'react-router-dom';
import { ReceiveShipmentDialog } from './ReceiveShipmentDialog';

interface Shipment {
  id: number;
  shipment_number: string;
  status: string;
  status_display: string;
  from_ministry?: any;
  from_province?: any;
  to_province?: any;
  to_school_name?: string;
  courier?: any;
  created_at: string;
  updated_at: string;
  notes?: string;
  items?: any[];
  related_request?: number | null;
}

interface ShipmentsPageProps {
  direction: 'outgoing' | 'incoming';
  userType: 'ministry' | 'province';
}

export function ShipmentsPage({ direction, userType }: ShipmentsPageProps) {
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [relatedRequest, setRelatedRequest] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [shipmentToReceive, setShipmentToReceive] = useState<Shipment | null>(null);

  useEffect(() => {
    loadShipments();
  }, [direction, filterStatus]);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const dataResp = await shipmentsService.listShipments({
        page_size: 100,
        status: filterStatus !== 'all' ? filterStatus : undefined,
      });

      let data = dataResp.results || dataResp || [];

      // Filter based on direction and user type
      if (userType === 'ministry') {
        if (direction === 'outgoing') {
          // الشحنات الصادرة من الوزارة
          data = data.filter((s: Shipment) => s.from_ministry);
        } else {
          // الشحنات الواردة للوزارة (نادرة لكن ممكنة)
          data = data.filter((s: Shipment) => s.to_province === null && !s.to_school_name);
        }
      } else {
        // Province
        if (direction === 'outgoing') {
          // الشحنات الصادرة من المحافظة للمدارس
          data = data.filter((s: Shipment) => s.from_province && s.to_school_name);
        } else {
          // الشحنات الواردة للمحافظة من الوزارة
          data = data.filter((s: Shipment) => s.to_province && s.from_ministry);
        }
      }

      setShipments(data);
    } catch (error) {
      console.error('Error loading shipments:', error);
      alert('فشل تحميل الشحنات');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    const variants: any = {
      pending: 'secondary',
      assigned: 'default',
      out_for_delivery: 'default',
      delivered: 'default',
      confirmed: 'default',
      canceled: 'destructive'
    };

    const colors: any = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      out_for_delivery: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      confirmed: 'bg-green-600 text-white',
      canceled: 'bg-red-100 text-red-800'
    };

    if (!status) {
      return <Badge className="">-</Badge>;
    }

    return (
      <Badge className={colors[status] || ''}>
        {status === 'pending' && '⏳ معلقة'}
        {status === 'assigned' && '📋 تم التكليف'}
        {status === 'out_for_delivery' && '🚚 جاري التوصيل'}
        {status === 'delivered' && '📦 تم التسليم'}
        {status === 'confirmed' && '✅ مؤكدة'}
        {status === 'canceled' && '❌ ملغاة'}
      </Badge>
    );
  };

  const viewDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setShowDetails(true);
  };

  useEffect(() => {
    // When a shipment with related_request is selected, fetch the request details
    const loadRelated = async () => {
      if (!selectedShipment || !selectedShipment['related_request']) {
        setRelatedRequest(null);
        return;
      }

      try {
        const resp = await requestsService.getRequest(selectedShipment['related_request']);
        setRelatedRequest(resp);
      } catch (err) {
        console.error('Failed to load related request:', err);
        setRelatedRequest(null);
      }
    };

    loadRelated();
  }, [selectedShipment]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {direction === 'outgoing' ? (
            <ArrowUp className="w-8 h-8 text-blue-600" />
          ) : (
            <ArrowDown className="w-8 h-8 text-green-600" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {direction === 'outgoing' ? 'الشحنات الصادرة' : 'الشحنات الواردة'}
            </h1>
            <p className="text-sm text-gray-600">
              {userType === 'ministry' ? 'الوزارة' : 'المحافظة'}
            </p>
          </div>
        </div>

        <Button onClick={loadShipments} variant="outline" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          ) : (
            'تحديث'
          )}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'assigned', 'out_for_delivery', 'delivered', 'confirmed'].map(status => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' && 'الكل'}
                {status === 'pending' && 'معلقة'}
                {status === 'assigned' && 'مكلفة'}
                {status === 'out_for_delivery' && 'جاري التوصيل'}
                {status === 'delivered' && 'تم التسليم'}
                {status === 'confirmed' && 'مؤكدة'}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TruckIcon className="w-5 h-5" />
            قائمة الشحنات ({shipments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-gray-600 mt-2">جاري التحميل...</p>
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>لا توجد شحنات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الشحنة</TableHead>
                  <TableHead>من</TableHead>
                  <TableHead>إلى</TableHead>
                  <TableHead>المندوب</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map(shipment => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">
                      {shipment.shipment_number}
                    </TableCell>
                    <TableCell>
                      {shipment.from_ministry?.name || shipment.from_province?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {shipment.to_province?.name || shipment.to_school_name || '-'}
                    </TableCell>
                    <TableCell>
                      {shipment.courier?.full_name || 'لم يعين'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(shipment.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(shipment.created_at).toLocaleDateString('ar-EG')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewDetails(shipment)}
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          تفاصيل
                        </Button>
                        {direction === 'incoming' && shipment.status === 'delivered' && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setShipmentToReceive(shipment);
                              setShowReceiveDialog(true);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 ml-1" />
                            استلام
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

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الشحنة</DialogTitle>
            <DialogDescription>
              رقم الشحنة: {selectedShipment?.shipment_number}
            </DialogDescription>
          </DialogHeader>

          {selectedShipment && (
            <div className="space-y-4">
              {/* معلومات الشحنة */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">من</Label>
                  <p className="font-medium">
                    {selectedShipment.from_ministry?.name || selectedShipment.from_province?.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">إلى</Label>
                  <p className="font-medium">
                    {selectedShipment.to_province?.name || selectedShipment.to_school_name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">الحالة</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedShipment.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">المندوب</Label>
                  <p className="font-medium">
                    {selectedShipment.courier?.full_name || 'لم يعين'}
                  </p>
                </div>
              </div>

              {/* الكتب */}
              {selectedShipment.items && selectedShipment.items.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">الكتب</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الكتاب</TableHead>
                        <TableHead>الكمية</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedShipment.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            {item.book?.title || item.book_title || 'غير محدد'}
                          </TableCell>
                          <TableCell>
                            <Badge>{item.quantity}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* ملاحظات */}
              {selectedShipment.notes && (
                <div>
                  <Label className="text-sm text-gray-600">ملاحظات</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded mt-1">
                    {selectedShipment.notes}
                  </p>
                </div>
              )}

              {/* Related request */}
              {relatedRequest && (
                <div>
                  <Label className="text-sm text-gray-600">الطلب المرتبط</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded mt-1">
                    <Link
                      to={
                        userType === 'ministry'
                          ? `/ministry/province-requests?id=${relatedRequest.id}`
                          : `/province/book-requests?id=${relatedRequest.id}`
                      }
                      className="text-blue-600 hover:underline"
                    >
                      {relatedRequest.request_number || `#${relatedRequest.id}`} - {relatedRequest.get_status_display?.toString?.() || relatedRequest.status}
                    </Link>
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receive Shipment Dialog */}
      {shipmentToReceive && (
        <ReceiveShipmentDialog
          open={showReceiveDialog}
          onClose={() => {
            setShowReceiveDialog(false);
            setShipmentToReceive(null);
          }}
          onSuccess={() => {
            loadShipments();
            setShowReceiveDialog(false);
            setShipmentToReceive(null);
          }}
          shipment={shipmentToReceive}
          userType={userType}
        />
      )}
    </div>
  );
}

function Label({ children, className }: any) {
  return <label className={className}>{children}</label>;
}
