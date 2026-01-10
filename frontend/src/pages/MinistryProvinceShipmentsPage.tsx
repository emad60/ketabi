import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Package,
  Search,
  CheckCircle,
  TruckIcon,
  Building2,
  Calendar,
  User,
  QrCode,
  Download,
  AlertTriangle,
} from 'lucide-react';
import apiService, { ProvinceRequest } from '../services/apiService';
import { useNavigate } from 'react-router-dom';

interface Shipment {
  id: number;
  tracking_code: string;
  status: string;
  created_at: string;
}

export default function MinistryProvinceShipmentsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ProvinceRequest | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    courier_id: '',
    notes: '',
  });

  // Fetch approved province requests (exclude those with shipments)
  const { data: approvedRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['approvedProvinceRequests'],
    queryFn: async () => {
      const res = await apiService.getProvinceRequests({ 
        status: 'approved',
        exclude_shipped: 'true'  // 🔥 استبعاد الطلبات التي لها شحنات
      });
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch couriers
  const { data: couriers = [] } = useQuery({
    queryKey: ['ministryCouriers'],
    queryFn: async () => {
      // Backend uses 'ministry_driver' for User.role but 'ministry_courier' for Shipment.courier_role
      const res = await apiService.getCouriers({ role: 'ministry_driver' });
      return Array.isArray(res) ? res : [];
    },
  });

  // Create shipment mutation
  const createShipmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiService.createShipment(data);
    },
    onSuccess: (shipment: any) => {
      queryClient.invalidateQueries({ queryKey: ['approvedProvinceRequests'] });
      alert(`✅ تم إنشاء الشحنة بنجاح!\nرقم التتبع: ${shipment.tracking_code}\n\n📦 تم إخفاء الطلب من القائمة تلقائياً\n🔔 تم إرسال إشعار للمحافظة مع التقرير وكود QR`);
      setShowCreateDialog(false);
      setSelectedRequest(null);
      setFormData({ courier_id: '', notes: '' });
      // Navigate to shipment details
      navigate(`/shipments/${shipment.id}`);
    },
    onError: (error: any) => {
      console.error('Error creating shipment:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.detail || 
                       error.response?.data?.message || 
                       JSON.stringify(error.response?.data) ||
                       'حدث خطأ أثناء إنشاء الشحنة';
      alert(`خطأ: ${errorMsg}`);
    },
  });

  const handleCreateShipment = async () => {
    if (!selectedRequest) return;

    // First, fetch province warehouse to get its ID
    let provinceWarehouseId = null;
    try {
      console.log('🔍 Searching for warehouse, province:', selectedRequest.province_name);
      const warehouses = await apiService.getProvinceWarehouses({ 
        search: selectedRequest.province_name 
      });
      console.log('📥 Received warehouses:', warehouses);
      
      if (warehouses && warehouses.length > 0) {
        provinceWarehouseId = warehouses[0].id;
        console.log('✅ Found province warehouse:', warehouses[0].name, 'ID:', provinceWarehouseId);
      } else {
        console.warn('⚠️ No warehouse found for province:', selectedRequest.province_name);
        // Fallback: try to get all warehouses and filter manually
        const allWarehouses = await apiService.getProvinceWarehouses();
        console.log('📦 All warehouses:', allWarehouses);
        const matchingWarehouse = allWarehouses.find(w => 
          w.province === selectedRequest.province_name
        );
        if (matchingWarehouse) {
          provinceWarehouseId = matchingWarehouse.id;
          console.log('✅ Found via fallback:', matchingWarehouse.name, 'ID:', provinceWarehouseId);
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch province warehouse:', error);
    }

    // Don't create shipment if we couldn't find the province warehouse
    if (!provinceWarehouseId) {
      alert('⚠️ لم يتم العثور على مخزن المحافظة. يرجى التأكد من وجود مخزن للمحافظة المطلوبة.');
      return;
    }

    const shipmentData = {
      from_ministry: 1, // Ministry main warehouse ID
      to_province: provinceWarehouseId, // Province warehouse ID for notifications
      to_school_name: selectedRequest.province_name,
      courier_role: 'ministry_courier',
      assigned_courier: formData.courier_id ? parseInt(formData.courier_id) : null,
      books: selectedRequest.items
        .filter((item) => item.book) // Only include items with valid book_id
        .map((item) => ({
          book_id: item.book!, // Use book field (ID of the actual book)
          quantity: item.approved_quantity || item.quantity,
          term: 'first', // Default term
        })),
      delivery_notes: formData.notes || `شحنة لطلب المحافظة رقم ${selectedRequest.request_number}`,
      related_request: selectedRequest.id,
    };

    console.log('📦 Creating shipment with data:', shipmentData);
    console.log('📚 Books to ship:', shipmentData.books);
    console.log('🏢 Province warehouse ID:', provinceWarehouseId);
    createShipmentMutation.mutate(shipmentData);
  };

  const filteredRequests = approvedRequests.filter((req: ProvinceRequest) =>
    req.province_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.request_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <TruckIcon className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  شحنات طلبات المحافظات
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  إنشاء وإدارة شحنات الكتب للمحافظات
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">الطلبات المعتمدة</CardTitle>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{approvedRequests.length}</div>
              <p className="text-xs text-gray-600 mt-1">جاهزة للشحن</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الكتب</CardTitle>
              <Package className="w-8 h-8 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {approvedRequests.reduce((sum: number, req: ProvinceRequest) => sum + (req.total_quantity || 0), 0)}
              </div>
              <p className="text-xs text-gray-600 mt-1">كتاب معتمد</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">المناديب المتاحين</CardTitle>
              <User className="w-8 h-8 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{couriers.length}</div>
              <p className="text-xs text-gray-600 mt-1">مندوب نشط</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="البحث عن طلب أو محافظة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>الطلبات المعتمدة الجاهزة للشحن</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              💡 يتم إخفاء الطلبات التي تم إنشاء شحنات لها تلقائياً
            </p>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <p className="text-center text-gray-600 py-8">جاري التحميل...</p>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد طلبات معتمدة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request: ProvinceRequest) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">رقم الطلب</p>
                            <p className="font-semibold">{request.request_number}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">المحافظة</p>
                            <p className="font-semibold flex items-center gap-1">
                              <Building2 className="w-4 h-4 text-gray-400" />
                              {request.province_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">عدد الكتب</p>
                            <p className="font-semibold">{request.total_quantity} كتاب</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">تاريخ الاعتماد</p>
                            <p className="font-semibold flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(request.reviewed_at || request.created_at).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-xs text-gray-500 mb-2">تفاصيل الطلب:</p>
                          <div className="space-y-1">
                            {request.items?.slice(0, 3).map((item, idx) => (
                              <p key={idx} className="text-sm">
                                • {item.book_title}: {item.approved_quantity} نسخة
                              </p>
                            ))}
                            {request.items?.length > 3 && (
                              <p className="text-sm text-gray-500">
                                + {request.items.length - 3} كتب أخرى
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowCreateDialog(true);
                        }}
                        className="bg-green-600 hover:bg-green-700 mr-4"
                      >
                        <TruckIcon className="w-4 h-4 ml-2" />
                        إنشاء شحنة
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Shipment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء شحنة جديدة</DialogTitle>
            <DialogDescription>
              سيتم إنشاء شحنة للمحافظة: {selectedRequest?.province_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Request Summary */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-semibold">رقم الطلب:</span>
                <span className="text-sm">{selectedRequest?.request_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold">إجمالي الكتب:</span>
                <span className="text-sm">{selectedRequest?.total_quantity} كتاب</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold">عدد الأصناف:</span>
                <span className="text-sm">{selectedRequest?.items?.length} صنف</span>
              </div>
            </div>

            {/* Courier Selection */}
            <div className="space-y-2">
              <Label htmlFor="courier">المندوب (اختياري)</Label>
              <select
                id="courier"
                value={formData.courier_id}
                onChange={(e) => setFormData({ ...formData, courier_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-right"
              >
                <option value="">اختر مندوب (يمكن الإسناد لاحقاً)</option>
                {couriers.map((courier: any) => (
                  <option key={courier.id} value={courier.id}>
                    {courier.full_name || courier.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-right min-h-[80px]"
                placeholder="أضف أي ملاحظات إضافية..."
              />
            </div>

            {/* Info Alert */}
            <Alert>
              <QrCode className="h-4 w-4" />
              <AlertDescription>
                <strong>ملاحظة:</strong> سيتم إرسال إشعار تلقائي للمحافظة يحتوي على:
                <ul className="list-disc mr-5 mt-2 space-y-1">
                  <li>تفاصيل الشحنة ورقم التتبع</li>
                  <li>تقرير PDF كامل بالكتب</li>
                  <li>QR Code لتأكيد الاستلام</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setSelectedRequest(null);
                  setFormData({ courier_id: '', notes: '' });
                }}
                disabled={createShipmentMutation.isPending}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleCreateShipment}
                disabled={createShipmentMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {createShipmentMutation.isPending ? (
                  <>جاري الإنشاء...</>
                ) : (
                  <>
                    <TruckIcon className="w-4 h-4 ml-2" />
                    إنشاء الشحنة
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
