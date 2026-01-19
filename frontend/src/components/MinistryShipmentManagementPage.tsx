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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  User,
  Calendar,
  Eye,
  AlertCircle,
  QrCode,
  Download,
  School as SchoolIcon,
  Building2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuthStore } from '../store/authStore';
import shipmentService from '../services/shipmentService';
import statisticsService from '../services/statisticsService';
import api from '../services/api';
import { CreateShipmentDialog } from './CreateShipmentDialog';
import { ShipmentDetailsDialog } from './ShipmentDetailsDialog';
import { AssignCourierDialog } from './AssignCourierDialog';

interface ShipmentType {
  id: number;
  tracking_code: string;
  from_warehouse?: any;
  to_warehouse?: any;
  to_school?: any;
  books?: any[];
  courier_role?: string;
  assigned_courier?: any;
  status: string;
  status_display?: string;
  created_at: string;
  delivered_at: string | null;
}

interface Stats {
  shipments: {
    total: number;
    by_status: {
      pending: number;
      assigned: number;
      out_for_delivery: number;
      delivered: number;
      confirmed: number;
      canceled: number;
    };
  };
  couriers: {
    total_ministry_couriers: number;
    active_couriers: number;
  };
}

export function MinistryShipmentManagementPage() {
  const { token } = useAuthStore();
  const [showCreateShipment, setShowCreateShipment] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentType | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAssignCourier, setShowAssignCourier] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkCourierId, setBulkCourierId] = useState('');
  const [couriers, setCouriers] = useState<any[]>([]);
  const [shipments, setShipments] = useState<ShipmentType[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    fetchCouriers();
  }, []);

  const fetchCouriers = async () => {
    try {
      const response = await api.get('/users/', { params: { role: 'ministry_driver' } });
      const data = response.data.results || response.data || [];
      setCouriers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching couriers:', error);
    }
  };

  const handleBulkAssignCourier = async () => {
    if (!bulkCourierId) {
      alert('الرجاء اختيار مندوب');
      return;
    }

    try {
      setLoading(true);
      // Find all unassigned shipments
      const unassignedShipments = shipments.filter(s => !s.assigned_courier);
      
      if (unassignedShipments.length === 0) {
        alert('جميع الشحنات مُسندة بالفعل');
        setShowBulkAssign(false);
        return;
      }

      // Assign courier to all unassigned shipments
      await Promise.all(
        unassignedShipments.map(shipment =>
          api.patch(`/warehouses/shipments/${shipment.id}/`, {
            assigned_courier: parseInt(bulkCourierId)
          })
        )
      );

      alert(`✅ تم إسناد ${unassignedShipments.length} شحنة للمندوب بنجاح!`);
      setShowBulkAssign(false);
      setBulkCourierId('');
      fetchData();
    } catch (error) {
      console.error('Error bulk assigning courier:', error);
      alert('فشل في إسناد الشحنات');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch shipments via shipmentService - only ministry_to_province type for ministry page
      try {
        const shipmentsData = await shipmentService.getShipments({ page_size: 100, shipment_type: 'ministry_to_province' });
        // shipmentService returns array or paginated response depending on backend
        const sData = Array.isArray(shipmentsData) ? shipmentsData : (shipmentsData.results || shipmentsData);
        const shipmentsArray = Array.isArray(sData) ? sData : [];
        
        // إزالة التكرارات بناءً على id
        const uniqueShipments = shipmentsArray.reduce((acc: ShipmentType[], current: ShipmentType) => {
          const duplicate = acc.find(item => item.id === current.id);
          if (!duplicate) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        setShipments(uniqueShipments);
      } catch (e) {
        console.error('Failed to fetch shipments via service:', e);
        setShipments([]);
      }

      // Fetch stats via statisticsService
      try {
        const statsData = await statisticsService.getMinistryStats();
        
        // معالجة البيانات المتداخلة
        const processedStats = {
          ...statsData,
          stock: statsData.stock || { total_books: 0 },
          school_requests: statsData.school_requests || { total: 0 },
        };
        
        setStats(processedStats);
      } catch (e) {
        console.error('Failed to fetch stats via service:', e);
        setStats(null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setShipments([]);
      setLoading(false);
    }
  };

  const handleViewDetails = (shipment: ShipmentType) => {
    setSelectedShipment(shipment);
    setShowDetails(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'out_for_delivery':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'assigned':
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'canceled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: 'قيد الإنشاء',
      assigned: 'مُسندة لمندوب',
      out_for_delivery: 'خارجة للتسليم',
      delivered: 'تم التسليم',
      confirmed: 'مؤكدة',
      canceled: 'ملغاة',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-700';
      case 'assigned':
        return 'bg-purple-100 text-purple-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'canceled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Chart data
  const statusChartData = stats && stats.shipments?.by_status
    ? [
        { name: 'قيد الإنشاء', value: stats.shipments.by_status.pending || 0, color: '#FCD34D' },
        { name: 'مُسندة', value: stats.shipments.by_status.assigned || 0, color: '#A78BFA' },
        { name: 'قيد التوصيل', value: stats.shipments.by_status.out_for_delivery || 0, color: '#60A5FA' },
        { name: 'تم التسليم', value: stats.shipments.by_status.delivered || 0, color: '#34D399' },
        { name: 'مؤكدة', value: stats.shipments.by_status.confirmed || 0, color: '#10B981' },
        { name: 'ملغاة', value: stats.shipments.by_status.canceled || 0, color: '#EF4444' },
      ]
    : [];

  const monthlyData = [
    { month: 'يناير', shipments: 45 },
    { month: 'فبراير', shipments: 52 },
    { month: 'مارس', shipments: 48 },
    { month: 'أبريل', shipments: 61 },
    { month: 'مايو', shipments: 55 },
    { month: 'يونيو', shipments: 67 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">إجمالي الشحنات</p>
                <p className="text-3xl font-bold">{stats?.shipments?.total || 0}</p>
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
                <p className="text-sm text-gray-600 mb-2">قيد التوصيل</p>
                <p className="text-3xl font-bold">{stats?.shipments?.by_status?.out_for_delivery || 0}</p>
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
                <p className="text-3xl font-bold">
                  {(stats?.shipments?.by_status?.delivered || 0) + (stats?.shipments?.by_status?.confirmed || 0)}
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
                <p className="text-sm text-gray-600 mb-2">المندوبين النشطين</p>
                <p className="text-3xl font-bold">
                  {stats?.couriers?.active_couriers || 0} / {stats?.couriers?.total_ministry_couriers || 0}
                </p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>الشحنات الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="shipments" fill="#3B82F6" name="الشحنات" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع حالات الشحنات</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name} (${((entry.percent || 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>الشحنات الأخيرة</CardTitle>
            <div className="flex gap-2">
              {shipments.filter(s => !s.assigned_courier).length > 0 && (
                <Button 
                  variant="outline"
                  className="bg-purple-50 border-purple-300 hover:bg-purple-100 text-purple-700"
                  onClick={() => setShowBulkAssign(true)}
                >
                  <User className="w-4 h-4 ml-2" />
                  إسناد جماعي ({shipments.filter(s => !s.assigned_courier).length})
                </Button>
              )}
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowCreateShipment(true)}
              >
                <Plus className="w-4 h-4 ml-2" />
                إنشاء شحنة جديدة
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {shipments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد شحنات حالياً</p>
              <p className="text-gray-400 text-sm mt-2">قم بإنشاء شحنة جديدة لبدء عملية الشحن</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الشحنة</TableHead>
                  <TableHead className="text-right">من المخزن</TableHead>
                  <TableHead className="text-right">إلى المحافظة</TableHead>
                  <TableHead className="text-right">المندوب</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(shipments) && shipments.map((shipment, index) => (
                  <TableRow key={`${shipment.id}-${shipment.tracking_code || index}`}>
                    <TableCell className="font-medium">SH-{shipment.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        {shipment.from_ministry_name || 'غير محدد'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        {shipment.to_province_name || 'غير محدد'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        {shipment.assigned_courier_name || 'غير مُسند'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {new Date(shipment.created_at).toLocaleDateString('ar-YE')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(shipment.status)}
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(shipment.status)}`}>
                          {getStatusText(shipment.status)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(shipment)}
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          عرض التفاصيل
                        </Button>
                        {(shipment.status === 'pending' || !shipment.assigned_courier) && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              setSelectedShipment(shipment);
                              setShowAssignCourier(true);
                            }}
                          >
                            <User className="w-4 h-4 ml-1" />
                            إسناد مندوب
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`http://localhost:8000/api/warehouses/shipments/${shipment.id}/qr/`, '_blank')}
                        >
                          <QrCode className="w-4 h-4 ml-1" />
                          QR Code
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

      {/* Alert for pending shipments */}
      {stats && stats.shipments_by_status && stats.shipments_by_status.pending > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900">تنبيه</h4>
                <p className="text-sm text-yellow-800 mt-1">
                  لديك {stats?.shipments_by_status?.pending || 0} شحنة قيد الإنشاء تحتاج إلى تعيين مندوب
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CreateShipmentDialog
        open={showCreateShipment}
        onClose={() => setShowCreateShipment(false)}
        onSuccess={fetchData}
      />
      <AssignCourierDialog
        open={showAssignCourier}
        onClose={() => {
          setShowAssignCourier(false);
          setSelectedShipment(null);
        }}
        shipment={selectedShipment}
        onAssigned={fetchData}
      />
      <ShipmentDetailsDialog
        open={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedShipment(null);
        }}
        shipment={selectedShipment}
        onStatusChange={fetchData}
      />

      {/* Bulk Assign Dialog */}
      <Dialog open={showBulkAssign} onOpenChange={setShowBulkAssign}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>إسناد جماعي للمندوب</DialogTitle>
            <DialogDescription>
              سيتم إسناد جميع الشحنات غير المُسندة ({shipments.filter(s => !s.assigned_courier).length} شحنة) للمندوب المحدد
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>اختر المندوب</Label>
              <Select value={bulkCourierId} onValueChange={setBulkCourierId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر مندوب..." />
                </SelectTrigger>
                <SelectContent>
                  {couriers.map((courier) => (
                    <SelectItem key={courier.id} value={courier.id.toString()}>
                      {courier.full_name || courier.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkAssign(false)}>
              إلغاء
            </Button>
            <Button 
              className="bg-purple-600 hover:bg-purple-700" 
              onClick={handleBulkAssignCourier}
              disabled={loading || !bulkCourierId}
            >
              {loading ? 'جاري الإسناد...' : 'إسناد الكل'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
