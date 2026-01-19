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
  XCircle,
  MapPin,
  Calendar,
  Eye,
  QrCode,
  Download,
} from 'lucide-react';
import api from '../services/api';
import { ShipmentDetailsDialog } from './ShipmentDetailsDialog';

interface ShipmentType {
  id: number;
  tracking_code: string;
  from_ministry?: { id: number; name: string; };
  to_province?: { id: number; name: string; province: string; };
  to_school_name?: string;
  books: any[];
  qr_code: string;
  status: string;
  created_at: string;
  delivered_at: string | null;
  assigned_courier?: { id: number; username: string; full_name: string; };
}

interface Stats {
  total_shipments: number;
  shipments_by_status: {
    pending: number;
    assigned: number;
    out_for_delivery: number;
    delivered: number;
    confirmed: number;
    canceled: number;
  };
}

export function ProvinceShipmentManagementPage() {
  const [shipments, setShipments] = useState<ShipmentType[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentType | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch shipments (filter for province - only province_to_school type)
      const shipmentsRes = await api.get('/warehouses/shipments/', {
        params: { shipment_type: 'province_to_school' }
      });
      const shipmentsData = shipmentsRes.data.results || shipmentsRes.data;
      setShipments(Array.isArray(shipmentsData) ? shipmentsData : []);

      // Fetch stats
      const statsRes = await api.get('/warehouses/stats/province/');
      setStats(statsRes.data);

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

  const handleDownloadQR = async (shipmentId: number) => {
    try {
      const response = await api.get(`/warehouses/shipments/${shipmentId}/qr/`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `shipment-${shipmentId}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR:', error);
    }
  };

  const handleDownloadReport = async (shipmentId: number) => {
    try {
      const response = await api.get(`/warehouses/shipments/${shipmentId}/report/`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `shipment-${shipmentId}-report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'out_for_delivery':
        return <Package className="w-5 h-5 text-blue-600" />;
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
                <p className="text-sm text-gray-600 mb-2">الشحنات الواردة</p>
                <p className="text-3xl font-bold">{stats?.total_shipments || 0}</p>
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
                <p className="text-sm text-gray-600 mb-2">في الطريق</p>
                <p className="text-3xl font-bold">{stats?.shipments_by_status?.out_for_delivery || 0}</p>
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
                <p className="text-sm text-gray-600 mb-2">تم الاستلام</p>
                <p className="text-3xl font-bold">{stats?.shipments_by_status?.delivered || 0}</p>
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
                <p className="text-sm text-gray-600 mb-2">مؤكدة</p>
                <p className="text-3xl font-bold">{stats?.shipments_by_status?.confirmed || 0}</p>
              </div>
              <div className="bg-green-600 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>الشحنات الواردة</CardTitle>
        </CardHeader>
        <CardContent>
          {shipments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد شحنات واردة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الشحنة</TableHead>
                  <TableHead className="text-right">من المخزن</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(shipments) && shipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">SH-{shipment.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        {shipment.from_ministry?.name || 'غير محدد'}
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
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(shipment.status)}`}>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadQR(shipment.id)}
                        >
                          <QrCode className="w-4 h-4 ml-1" />
                          QR
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadReport(shipment.id)}
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

      {/* Dialog */}
      <ShipmentDetailsDialog
        open={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedShipment(null);
        }}
        shipment={selectedShipment}
        onStatusChange={fetchData}
      />
    </div>
  );
}
