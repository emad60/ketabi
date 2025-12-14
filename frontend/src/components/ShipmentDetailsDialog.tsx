import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  QrCode,
  Download,
  Package,
  MapPin,
  Calendar,
  User,
  School as SchoolIcon,
  Building2,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import api from '../services/api';
interface Shipment {
  id: number;
  tracking_code: string;
  qr_code_url?: string;
  from_warehouse?: { id: number; name: string; location?: string; };
  to_warehouse?: { id: number; name: string; province?: string; };
  to_school?: { id: number; name: string; province?: string; };
  books?: Array<{ book?: { id: number; subject_display?: string; grade_display?: string; }; quantity: number; }>;
  courier_role?: string;
  assigned_courier?: { id: number; username: string; full_name: string; };
  status: string;
  status_display?: string;
  created_at: string;
  delivered_at: string | null;
}

interface ShipmentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  onStatusChange?: () => void; // callback بعد تغيير الحالة
}

export function ShipmentDetailsDialog({ open, onClose, shipment, onStatusChange }: ShipmentDetailsDialogProps) {
  const [downloadingQR, setDownloadingQR] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  // Load QR image via authenticated API and convert to object URL
  // Keep this effect unconditional (hook order stable) but guard inside for missing shipment
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const loadQr = async () => {
      if (!shipment?.id) return;
      try {
        const res = await api.get(`/warehouses/shipments/${shipment.id}/qr/`, {
          responseType: 'blob',
        });
        if (!active) return;
        const blob = new Blob([res.data], { type: res.data.type || 'image/png' });
        objectUrl = window.URL.createObjectURL(blob);
        setQrUrl(objectUrl);
      } catch (err) {
        console.warn('Could not load shipment QR via authenticated API', err);
        setQrUrl(null);
      }
    };

    loadQr();

    return () => {
      active = false;
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
      setQrUrl(null);
    };
  }, [shipment?.id]);

  if (!shipment) return null;

  const handleStatusChange = async (newStatus: string) => {
    try {
      setChangingStatus(true);
      await api.patch(`/warehouses/shipments/${shipment.id}/`, {
        status: newStatus
      });
      alert('تم تغيير حالة الشحنة بنجاح! ✅');
      if (onStatusChange) {
        onStatusChange();
      }
      onClose();
    } catch (error: any) {
      console.error('Error changing status:', error);
      alert('حدث خطأ أثناء تغيير الحالة');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleDownloadQR = async () => {
    try {
      setDownloadingQR(true);
      // Fetch QR image via authenticated api client and download
      const res = await api.get(`/warehouses/shipments/${shipment.id}/qr/`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: res.data.type || 'image/png' });
      const link = document.createElement('a');
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      link.download = `shipment-${shipment.tracking_code}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR:', error);
      alert('حدث خطأ أثناء تحميل QR Code');
    } finally {
      setDownloadingQR(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setDownloadingReport(true);
      // Download full report PDF
      const link = document.createElement('a');
      link.href = `http://localhost:8000/api/warehouses/shipments/${shipment.id}/report/`;
      link.download = `shipment-${shipment.tracking_code}-report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('حدث خطأ أثناء تحميل التقرير');
    } finally {
      setDownloadingReport(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      out_for_delivery: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      confirmed: 'bg-green-100 text-green-800',
      canceled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const totalBooks = shipment.books?.reduce((sum: number, book: any) => sum + (book.quantity || 0), 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl">تفاصيل الشحنة #{shipment.tracking_code}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Badge */}
          <div className="flex justify-between items-start">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(shipment.status)}`}>
              {shipment.status_display || shipment.status}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadQR}
                disabled={downloadingQR}
              >
                <QrCode className="ml-2 w-4 h-4" />
                {downloadingQR ? 'جاري التحميل...' : 'تحميل QR'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadReport}
                disabled={downloadingReport}
              >
                <Download className="ml-2 w-4 h-4" />
                {downloadingReport ? 'جاري التحميل...' : 'تحميل التقرير'}
              </Button>
            </div>
          </div>

          {/* QR Code Display */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">QR Code للشحنة</h3>
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <img
                    src={qrUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EQR Code%3C/text%3E%3C/svg%3E'}
                    alt="Shipment QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="mt-3 text-sm text-gray-600">كود التتبع: {shipment.tracking_code}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* From */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">المرسل</h4>
                    <p className="font-medium">{shipment.from_warehouse?.name}</p>
                    <p className="text-sm text-gray-500">{shipment.from_warehouse?.location || ''}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* To */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  {shipment.to_school ? (
                    <SchoolIcon className="w-5 h-5 text-green-600 mt-1" />
                  ) : (
                    <Building2 className="w-5 h-5 text-green-600 mt-1" />
                  )}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">المستلم</h4>
                    <p className="font-medium">
                      {shipment.to_school?.name || shipment.to_warehouse?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {shipment.to_school?.province || shipment.to_warehouse?.province}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Created Date */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">تاريخ الإنشاء</h4>
                    <p className="font-medium">
                      {new Date(shipment.created_at).toLocaleDateString('ar-YE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Courier */}
            {shipment.assigned_courier && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-semibold text-sm text-gray-600 mb-1">السائق</h4>
                      <p className="font-medium">{shipment.assigned_courier.full_name}</p>
                      <p className="text-sm text-gray-500">{shipment.courier_role === 'ministry_courier' ? 'سائق الوزارة' : 'سائق المحافظة'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Books List */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">الكتب ({totalBooks} كتاب)</h3>
              </div>
              <div className="space-y-3">
                {shipment.books && shipment.books.length > 0 ? (
                  shipment.books.map((book: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{book.book?.subject_display || 'كتاب'}</p>
                        <p className="text-sm text-gray-600">{book.book?.grade_display || ''}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {book.quantity} نسخة
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">لا توجد كتب</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Confirmation */}
          {shipment.delivered_at && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">تم التسليم بنجاح</h4>
                    <p className="text-sm text-green-700">
                      {new Date(shipment.delivered_at).toLocaleString('ar-YE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Change Section */}
          <Card className="border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">تغيير حالة الشحنة</h3>
                </div>
                <Select 
                  value={shipment.status} 
                  onValueChange={handleStatusChange}
                  disabled={changingStatus}
                >
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">قيد الإنشاء</SelectItem>
                    <SelectItem value="assigned">مُسندة لمندوب</SelectItem>
                    <SelectItem value="out_for_delivery">خارجة للتسليم</SelectItem>
                    <SelectItem value="delivered">تم التسليم</SelectItem>
                    <SelectItem value="confirmed">مؤكدة</SelectItem>
                    <SelectItem value="canceled">ملغاة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                ملاحظة: عند تغيير الحالة إلى "مؤكدة" سيتم خصم الكميات من المخزون تلقائياً
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
