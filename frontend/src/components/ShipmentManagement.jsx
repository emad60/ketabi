/**
 * Shipment Management Component
 * مكون إدارة الشحنات
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TruckIcon, Package, MapPin, Calendar, User, 
  CheckCircle, Clock, AlertCircle, X, Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const statusConfig = {
  preparing: { label: 'قيد التحضير', color: 'warning', icon: Clock },
  in_transit: { label: 'في الطريق', color: 'default', icon: TruckIcon },
  delivered: { label: 'تم التسليم', color: 'success', icon: CheckCircle },
  cancelled: { label: 'ملغي', color: 'destructive', icon: X },
};

export default function ShipmentManagement() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/warehouses/shipments/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShipments(response.data.results || response.data);
    } catch (error) {
      console.error('خطأ في تحميل الشحنات:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch = 
      shipment.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.destination_school?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.driver?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || shipment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TruckIcon className="w-6 h-6 text-blue-600" />
            إدارة الشحنات
          </CardTitle>
          <CardDescription>
            متابعة وإدارة شحنات الكتب المدرسية
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="بحث برقم التتبع، المدرسة، أو السائق..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                الكل
              </Button>
              {Object.entries(statusConfig).map(([status, config]) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  onClick={() => setFilterStatus(status)}
                  size="sm"
                >
                  {config.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Shipments Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم التتبع</TableHead>
                  <TableHead>المدرسة</TableHead>
                  <TableHead>السائق</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      لا توجد شحنات
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShipments.map((shipment) => {
                    const StatusIcon = statusConfig[shipment.status]?.icon || AlertCircle;
                    return (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-mono font-semibold">
                          {shipment.tracking_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>{shipment.destination_school?.name || 'غير محدد'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span>{shipment.driver?.full_name || 'غير مخصص'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[shipment.status]?.color || 'default'}>
                            <StatusIcon className="w-3 h-3 ml-1" />
                            {statusConfig[shipment.status]?.label || shipment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {new Date(shipment.created_at).toLocaleDateString('ar-YE')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            عرض التفاصيل
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
