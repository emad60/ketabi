import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Package,
  Truck,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Download,
  Plus,
  Search,
  Filter,
  Eye,
  Printer,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  BookOpen,
  Hash,
  Building2,
} from 'lucide-react';
import apiService from '../services/apiService';
import { useAuthStore } from '../store/authStore';

interface SchoolRequest {
  id: number;
  school_name: string;
  principal_name: string;
  phone: string;
  email: string;
  status: string;
  items: Array<{
    book_id: number;
    book_title: string;
    quantity_requested: number;
    quantity_approved: number;
  }>;
  created_at: string;
}

interface ShipmentItem {
  book_id: number;
  book_title: string;
  quantity: number;
}

interface Shipment {
  id: number;
  tracking_code: string;
  to_school_name: string;
  books: ShipmentItem[];
  status: 'pending' | 'assigned' | 'out_for_delivery' | 'delivered' | 'confirmed';
  assigned_courier?: { id: number; full_name: string };
  qr_code: string;
  created_at: string;
}

interface Courier {
  id: number;
  full_name: string;
  phone: string;
  email: string;
}

export default function ProvinceShipmentPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state: any) => state.user);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<SchoolRequest | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedCourierId, setSelectedCourierId] = useState<string>('');
  const [qrScanData, setQrScanData] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);

  // جلب طلبات المدارس المعتمدة
  const {
    data: schoolRequests,
    isLoading: isLoadingRequests,
    error: requestsError,
  } = useQuery({
    queryKey: ['approvedSchoolRequests'],
    queryFn: async () => {
      const response = await apiService.getSchoolRequests({
        status: 'approved',
      });
      return response;
    },
  });

  // جلب الشحنات
  const {
    data: shipments,
    isLoading: isLoadingShipments,
    error: shipmentsError,
  } = useQuery({
    queryKey: ['provinceShipments', filterStatus],
    queryFn: async () => {
      const response = await apiService.getShipments({
        status: filterStatus === 'all' ? undefined : filterStatus,
        courier_role: 'province_courier',
      });
      return Array.isArray(response) ? response : (response as any).results || [];
    },

  });

  // جلب المندوبين
  const {
    data: couriers,
    isLoading: isLoadingCouriers,
  } = useQuery({
    queryKey: ['provinceCouriers'],
    queryFn: async () => {
      const response = await apiService.getCouriers({
        // backend user roles use 'province_driver' / 'ministry_driver'
        role: 'province_driver',
      });
      return Array.isArray(response) ? response : (response as any).results || [];
    },
  });

  // إنشاء شحنة
  const createShipmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiService.createShipment(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provinceShipments'] });
      setIsCreateDialogOpen(false);
      setSelectedRequest(null);
    },
  });

  // إسناد شحنة للمندوب
  const assignShipmentMutation = useMutation({
    mutationFn: async ({ shipmentId, courierId }: any) => {
      return await apiService.assignCourierToShipment(shipmentId, courierId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provinceShipments'] });
      setIsAssignDialogOpen(false);
      setSelectedShipment(null);
    },
  });

  // تأكيد التسليم بـ QR Code
  const confirmDeliveryMutation = useMutation({
    mutationFn: async (qrData: string) => {
      return await apiService.processQRCode(qrData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provinceShipments'] });
      setQrScanData('');
      setShowQrScanner(false);
    },
  });

  const handleCreateShipment = async () => {
    if (!selectedRequest) return;

    const shipmentData = {
      to_school_name: selectedRequest.school_name,
      books: selectedRequest.items.map((item) => ({
        book_id: item.book_id,
        book_title: item.book_title,
        quantity: item.quantity_approved,
      })),
      courier_role: 'province_courier',
      related_request: selectedRequest.id,
    };

    createShipmentMutation.mutate(shipmentData);
  };

  const handleAssignCourier = async () => {
    if (!selectedShipment || !selectedCourierId) return;
    assignShipmentMutation.mutate({
      shipmentId: selectedShipment.id,
      courierId: parseInt(selectedCourierId),
    });
  };

  const handleQrScan = async () => {
    if (!qrScanData) return;
    confirmDeliveryMutation.mutate(qrScanData);
  };

  const filteredRequests = (schoolRequests || []).filter((req: SchoolRequest) => {
    const school = (req.school_name || '').toString().toLowerCase();
    const principal = (req.principal_name || '').toString().toLowerCase();
    const q = searchTerm.toString().toLowerCase();
    return school.includes(q) || principal.includes(q);
  });

  const filteredShipments = (shipments || []).filter((ship: Shipment) => {
    const school = (ship?.to_school_name || '').toString().toLowerCase();
    const tracking = (ship?.tracking_code || '').toString().toLowerCase();
    const q = searchTerm.toString().toLowerCase();
    return school.includes(q) || tracking.includes(q);
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-green-200 text-green-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'قيد الإنشاء';
      case 'assigned':
        return 'مُسندة للمندوب';
      case 'out_for_delivery':
        return 'خارجة للتسليم';
      case 'delivered':
        return 'تم التسليم';
      case 'confirmed':
        return 'مؤكدة';
      default:
        return status;
    }
  };

  const generateQRReport = (shipment: Shipment) => {
    // في التطبيق الحقيقي، ستكون هناك مكتبة QR code
    const reportHTML = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير الشحنة</title>
        <style>
          body { font-family: Arial; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .info { margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .items { margin-top: 20px; }
          .items table { width: 100%; border-collapse: collapse; }
          .items th, .items td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          .qr-section { text-align: center; margin: 30px 0; padding: 20px; border: 2px dashed #666; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير شحنة</h1>
          <p>نظام توزيع الكتب المدرسية</p>
        </div>
        
        <div class="info">
          <div class="info-row">
            <span><strong>رقم التتبع:</strong> ${shipment.tracking_code}</span>
            <span><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-EG')}</span>
          </div>
          <div class="info-row">
            <span><strong>المدرسة:</strong> ${shipment.to_school_name}</span>
          </div>
        </div>
        
        <div class="items">
          <h3>تفاصيل الكتب:</h3>
          <table>
            <thead>
              <tr>
                <th>اسم الكتاب</th>
                <th>الكمية</th>
              </tr>
            </thead>
            <tbody>
              ${shipment.books
                .map(
                  (item) =>
                    `<tr><td>${item.book_title}</td><td>${item.quantity}</td></tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
        
        <div class="qr-section">
          <p style="margin-bottom: 20px;"><strong>اسح الكود أدناه عند التسليم:</strong></p>
          <div style="font-size: 24px; font-weight: bold; font-family: monospace; padding: 20px;">
            ${shipment.qr_code || shipment.tracking_code}
          </div>
          <p style="margin-top: 20px; color: #666;">
            يرجى حفظ هذا التقرير وإرساله للمدرسة<br/>
            عند التسليم، اسح الكود للتأكيد
          </p>
        </div>
        
        <div class="footer">
          <p>نظام توزيع الكتب المدرسية - المحافظة</p>
        </div>
      </body>
      </html>
    `;

    const win = window.open('', '', 'width=800,height=600');
    if (win) {
      win.document.write(reportHTML);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8 text-blue-600" />
            إدارة الشحنات
          </h1>
          <p className="text-gray-600 mt-1">
            إنشاء وإدارة شحنات للمدارس المعتمدة
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests">طلبات المدارس المعتمدة</TabsTrigger>
          <TabsTrigger value="shipments">الشحنات</TabsTrigger>
          <TabsTrigger value="scanner">فحص QR Code</TabsTrigger>
        </TabsList>

        {/* Tab 1: Approved School Requests */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>طلبات المدارس المعتمدة</CardTitle>
              <CardDescription>
                اختر طلب مدرسة معتمد لإنشاء شحنة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                  <Input
                    placeholder="ابحث عن المدرسة أو مدير المدرسة..."
                    value={searchTerm}
                    onChange={(e: any) => setSearchTerm(e.target.value)}
                    className="w-full pr-9"
                  />
                </div>
              </div>

              {isLoadingRequests && (
                <div className="text-center py-8 text-gray-500">
                  جاري التحميل...
                </div>
              )}

              {requestsError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    حدث خطأ في تحميل الطلبات
                  </AlertDescription>
                </Alert>
              )}

              {filteredRequests && filteredRequests.length > 0 ? (
                <div className="space-y-3">
                  {filteredRequests.map((request: SchoolRequest) => (
                    <Card
                      key={request.id}
                      className="cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-600">المدرسة</p>
                              <p className="font-semibold">
                                {request.school_name}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">
                                مدير المدرسة
                              </p>
                              <p className="font-semibold">
                                {request.principal_name}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">الهاتف</p>
                              <p className="font-mono">{request.phone}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">البريد</p>
                              <p className="font-mono text-sm">{request.email}</p>
                            </div>
                          </div>

                          <div className="border-t pt-3">
                            <p className="text-sm font-semibold mb-2">
                              الكتب المطلوبة:
                            </p>
                            <div className="space-y-2">
                              {(request.items || []).map((item) => (
                                <div
                                  key={item.book_id}
                                  className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                                >
                                  <span>{item.book_title}</span>
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                    {item.quantity_approved} نسخة
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {selectedRequest?.id === request.id && (
                            <Dialog
                              open={isCreateDialogOpen}
                              onOpenChange={setIsCreateDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  className="w-full mt-4 bg-green-600 hover:bg-green-700"
                                  onClick={() => setIsCreateDialogOpen(true)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  إنشاء شحنة
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>إنشاء شحنة جديدة</DialogTitle>
                                  <DialogDescription>
                                    سيتم إنشاء شحنة لـ{' '}
                                    {selectedRequest?.school_name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="bg-blue-50 p-4 rounded space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-sm font-semibold">
                                        إجمالي الكتب:
                                      </span>
                                      <span>
                                        {(selectedRequest?.items || []).reduce(
                                          (sum, item) =>
                                            sum + item.quantity_approved,
                                          0
                                        )}{' '}
                                        نسخة
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    onClick={handleCreateShipment}
                                    disabled={
                                      createShipmentMutation.isPending
                                    }
                                    className="w-full bg-green-600 hover:bg-green-700"
                                  >
                                    {createShipmentMutation.isPending
                                      ? 'جاري الإنشاء...'
                                      : 'تأكيد الإنشاء'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}

                          {selectedRequest?.id !== request.id && (
                            <Button
                              className="w-full mt-4"
                              variant="outline"
                              onClick={() => setSelectedRequest(request)}
                            >
                              اختيار هذا الطلب
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>لا توجد طلبات معتمدة</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Shipments */}
        <TabsContent value="shipments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الشحنات</CardTitle>
              <CardDescription>
                قائمة الشحنات والحالات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-2 flex-wrap">
                <div className="flex-1 relative min-w-60">
                  <Search className="w-4 h-4 absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                  <Input
                    placeholder="ابحث عن المدرسة أو رقم التتبع..."
                    value={searchTerm}
                    onChange={(e: any) => setSearchTerm(e.target.value)}
                    className="w-full pr-9"
                  />
                </div>
                <Select
                  value={filterStatus}
                  onValueChange={(val: any) => setFilterStatus(val)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="pending">قيد الإنشاء</SelectItem>
                    <SelectItem value="assigned">مُسندة</SelectItem>
                    <SelectItem value="out_for_delivery">
                      خارجة للتسليم
                    </SelectItem>
                    <SelectItem value="delivered">
                      تم التسليم
                    </SelectItem>
                    <SelectItem value="confirmed">
                      مؤكدة
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoadingShipments && (
                <div className="text-center py-8 text-gray-500">
                  جاري التحميل...
                </div>
              )}

              {shipmentsError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    حدث خطأ في تحميل الشحنات
                  </AlertDescription>
                </Alert>
              )}

              {filteredShipments && filteredShipments.length > 0 ? (
                <div className="grid gap-3">
                  {filteredShipments.map((shipment: Shipment) => (
                    <Card
                      key={shipment.id}
                      className="hover:shadow-md transition cursor-pointer"
                      onClick={() => setSelectedShipment(shipment)}
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Hash className="w-4 h-4 text-gray-600" />
                                <p className="font-mono text-sm font-semibold">
                                  {shipment.tracking_code}
                                </p>
                              </div>
                              <p className="text-lg font-semibold">
                                {shipment.to_school_name}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                                shipment.status
                              )}`}
                            >
                              {getStatusLabel(shipment.status)}
                            </span>
                          </div>

                          {shipment.assigned_courier && (
                            <div className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded">
                              <User className="w-4 h-4 text-blue-600" />
                              <span>
                                المندوب: {shipment.assigned_courier.full_name}
                              </span>
                            </div>
                          )}

                          <div className="border-t pt-3">
                            <p className="text-sm font-semibold mb-2">
                              الكتب ({shipment.books.length}):
                            </p>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {(shipment.books || []).map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between text-xs text-gray-700 p-1"
                                >
                                  <span>{item.book_title}</span>
                                  <span className="font-semibold text-blue-600">
                                    {item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-3">
                            {shipment.status === 'pending' && (
                              <Dialog
                                open={
                                  isAssignDialogOpen &&
                                  selectedShipment?.id === shipment.id
                                }
                                onOpenChange={setIsAssignDialogOpen}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    onClick={() => {
                                      setSelectedShipment(shipment);
                                      setIsAssignDialogOpen(true);
                                    }}
                                  >
                                    <Truck className="w-4 h-4 mr-2" />
                                    إسناد للمندوب
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>
                                      إسناد الشحنة للمندوب
                                    </DialogTitle>
                                    <DialogDescription>
                                      اختر المندوب المسؤول عن توصيل هذه
                                      الشحنة
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="courier">
                                        المندوب
                                      </Label>
                                      <Select
                                        value={selectedCourierId}
                                        onValueChange={setSelectedCourierId}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="اختر مندوباً" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {(couriers || []).map(
                                            (courier: Courier) => (
                                              <SelectItem
                                                key={courier.id}
                                                value={courier.id.toString()}
                                              >
                                                {courier.full_name}
                                              </SelectItem>
                                            )
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button
                                      onClick={handleAssignCourier}
                                      disabled={
                                        !selectedCourierId ||
                                        assignShipmentMutation.isPending
                                      }
                                      className="w-full bg-blue-600 hover:bg-blue-700"
                                    >
                                      {assignShipmentMutation.isPending
                                        ? 'جاري الإسناد...'
                                        : 'تأكيد الإسناد'}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => generateQRReport(shipment)}
                              className="flex-1"
                            >
                              <Printer className="w-4 h-4 mr-2" />
                              طباعة التقرير
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedShipment(shipment)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Truck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>لا توجد شحنات</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: QR Code Scanner */}
        <TabsContent value="scanner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <QrCode className="w-6 h-6 text-blue-600" />
                  فحص QR Code
                </div>
              </CardTitle>
              <CardDescription>
                اسح كود QR من تقرير الشحنة لتأكيد التسليم
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <QrCode className="h-4 w-4" />
                <AlertDescription>
                  عندما يقوم المندوب بفحص كود QR، سيتم تأكيد التسليم تلقائياً
                  وخصم الكمية من المخزن
                </AlertDescription>
              </Alert>

              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <Label htmlFor="qr-input">أدخل بيانات QR Code:</Label>
                <Input
                  id="qr-input"
                  placeholder="الصق بيانات QR Code هنا أو اسح الكود..."
                  value={qrScanData}
                  onChange={(e: any) => setQrScanData(e.target.value)}
                  onKeyPress={(e: any) => {
                    if (e.key === 'Enter') {
                      handleQrScan();
                    }
                  }}
                  className="font-mono text-sm"
                  autoFocus
                />

                <Button
                  onClick={handleQrScan}
                  disabled={
                    !qrScanData || confirmDeliveryMutation.isPending
                  }
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  {confirmDeliveryMutation.isPending
                    ? 'جاري التأكيد...'
                    : 'تأكيد التسليم'}
                </Button>
              </div>

              {confirmDeliveryMutation.isSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    تم تأكيد التسليم بنجاح وخصم الكمية من المخزن
                  </AlertDescription>
                </Alert>
              )}

              {confirmDeliveryMutation.isError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    حدث خطأ في تأكيد التسليم
                  </AlertDescription>
                </Alert>
              )}

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base">
                    كيفية العمل:
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>
                      يقوم المندوب بتوصيل الشحنة إلى المدرسة
                    </li>
                    <li>
                      يطلب من المدرسة فتح تقرير الشحنة
                    </li>
                    <li>
                      ينسخ بيانات QR Code من التقرير
                    </li>
                    <li>
                      يلصق البيانات في هذا الحقل ويضغط Enter أو الزر
                    </li>
                    <li>
                      تلقائياً سيتم تأكيد التسليم وخصم الكمية من المخزن
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selected Shipment Details Modal */}
      {selectedShipment && (
        <Dialog
          open={!!selectedShipment}
          onOpenChange={() => setSelectedShipment(null)}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تفاصيل الشحنة</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">رقم التتبع</p>
                  <p className="font-mono font-bold text-lg">
                    {selectedShipment.tracking_code}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">الحالة</p>
                  <p
                    className={`font-semibold ${getStatusBadgeColor(
                      selectedShipment.status
                    ).replace('text', 'inline-flex items-center px-2 py-1 rounded')}`}
                  >
                    {getStatusLabel(selectedShipment.status)}
                  </p>
                </div>
              </div>

              {/* School Info */}
              <Card className="bg-gray-50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">معلومات المدرسة</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-600" />
                      <span>{selectedShipment.to_school_name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Courier Info */}
              {selectedShipment.assigned_courier && (
                <Card className="bg-blue-50">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">المندوب</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span>{selectedShipment.assigned_courier.full_name}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-3">الكتب</h3>
                <div className="space-y-2">
                  {selectedShipment.books.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded"
                    >
                      <span className="flex-1">{item.book_title}</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-semibold">
                        {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => generateQRReport(selectedShipment)}
                  variant="outline"
                  className="flex-1"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  طباعة التقرير
                </Button>
                <Button
                  onClick={() => setSelectedShipment(null)}
                  variant="ghost"
                  className="flex-1"
                >
                  إغلاق
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
