import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
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
  DialogFooter,
} from './ui/dialog';
import { 
  Package, 
  Building2, 
  Users, 
  TruckIcon, 
  Loader2,
  FileText,
  MinusCircle
} from 'lucide-react';
import api from '../services/api';

interface ProvinceWarehouse {
  id: number;
  name: string;
  province: number;
  staff: number[];
  staff_count: number;
  staff_details?: Array<{
    id: number;
    full_name: string;
    email: string;
    role: string;
  }>;
  stock_items?: Array<{
    id: number;
    book: any;
    quantity: number;
    term: string;
  }>;
  deduction_reports?: Array<{
    id: number;
    shipment_id: number;
    tracking_code: string;
    deducted_at: string;
    books: any[];
  }>;
}

interface Staff {
  id: number;
  full_name: string;
  email: string;
  username: string;
  role: string;
}

export function ProvinceWarehouseManagementPage() {
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<ProvinceWarehouse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialogs state
  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showReportsDialog, setShowReportsDialog] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<ProvinceWarehouse | null>(null);
  
  // Staff management
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);

  useEffect(() => {
    fetchWarehouses();
    fetchAvailableStaff();
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/warehouses/province/');
      setWarehouses(Array.isArray(response.data) ? response.data : (response.data.results || []));
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStaff = async () => {
    try {
      const response = await api.get('/users/', { params: { role: 'province_staff' } });
      const data = response.data.results || response.data || [];
      setAvailableStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleManageStaff = (warehouse: ProvinceWarehouse) => {
    setSelectedWarehouse(warehouse);
    setSelectedStaffIds(warehouse.staff || []);
    setShowStaffDialog(true);
  };

  const handleSaveStaff = async () => {
    if (!selectedWarehouse) return;
    
    try {
      setLoading(true);
      await api.patch(`/warehouses/province/${selectedWarehouse.id}/`, {
        staff: selectedStaffIds
      });
      alert('✅ تم تحديث الموظفين بنجاح!');
      setShowStaffDialog(false);
      fetchWarehouses();
    } catch (err) {
      console.error('Error updating staff:', err);
      alert('فشل في تحديث الموظفين');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStock = async (warehouse: ProvinceWarehouse) => {
    try {
      setLoading(true);
      const response = await api.get('/warehouses/stocks/', {
        params: {
          province_warehouse: warehouse.id,
          page_size: 500
        }
      });
      
      const stockData = response.data.results || response.data || [];
      setSelectedWarehouse({
        ...warehouse,
        stock_items: stockData
      });
      setShowStockDialog(true);
    } catch (error) {
      console.error('Error fetching stock:', error);
      alert('فشل تحميل المخزون');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReports = async (warehouse: ProvinceWarehouse) => {
    try {
      setLoading(true);
      const response = await api.get('/warehouses/shipments/', {
        params: {
          from_province: warehouse.id,
          status: 'confirmed',
          page_size: 100
        }
      });
      
      const shipments = response.data.results || response.data || [];
      const reports = shipments.map((s: any) => ({
        id: s.id,
        shipment_id: s.id,
        tracking_code: s.tracking_code,
        deducted_at: s.created_at,
        books: s.books_details || s.books || []
      }));
      
      setSelectedWarehouse({
        ...warehouse,
        deduction_reports: reports
      });
      setShowReportsDialog(true);
    } catch (err) {
      console.error('Error fetching reports:', err);
      alert('فشل تحميل التقارير');
    } finally {
      setLoading(false);
    }
  };

  const filteredWarehouses = warehouses.filter(w => 
    (w.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  if (loading && warehouses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة مخازن المحافظة</h1>
          <p className="text-sm text-gray-600 mt-1">إدارة المخازن والموظفين والمخزون</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="ابحث عن مخزن..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">إجمالي المخازن</p>
                <p className="text-3xl font-bold">{warehouses.length}</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">إجمالي الموظفين</p>
                <p className="text-3xl font-bold">
                  {warehouses.reduce((sum, w) => sum + (w.staff_count || 0), 0)}
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">المخازن النشطة</p>
                <p className="text-3xl font-bold">{warehouses.length}</p>
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
                <p className="text-sm text-gray-600 mb-2">متوسط الموظفين</p>
                <p className="text-3xl font-bold">
                  {warehouses.length > 0 
                    ? Math.round(warehouses.reduce((sum, w) => sum + (w.staff_count || 0), 0) / warehouses.length)
                    : 0}
                </p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <TruckIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWarehouses.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد مخازن مسجلة</p>
            </CardContent>
          </Card>
        ) : (
          filteredWarehouses.map((warehouse) => (
            <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                      <Badge className="mt-1 bg-gray-50 text-gray-700 border border-gray-200">
                        <Users className="w-3 h-3 ml-1" />
                        {warehouse.staff_count || 0} موظف
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleManageStaff(warehouse)}
                  >
                    <Users className="w-4 h-4 ml-1" />
                    الموظفين
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleViewStock(warehouse)}
                  >
                    <Package className="w-4 h-4 ml-1" />
                    المخزون
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleViewReports(warehouse)}
                  >
                    <FileText className="w-4 h-4 ml-1" />
                    التقارير
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Staff Management Dialog */}
      <Dialog open={showStaffDialog} onOpenChange={setShowStaffDialog}>
        <DialogContent dir="rtl" className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إدارة موظفي المخزن - {selectedWarehouse?.name}</DialogTitle>
            <DialogDescription>
              اختر الموظفين المسؤولين عن هذا المخزن
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">الموظفين المحددين:</span>
              <Badge className="bg-blue-600">{selectedStaffIds.length}</Badge>
            </div>

            {availableStaff.map((staff) => (
              <div
                key={staff.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedStaffIds.includes(staff.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStaffIds([...selectedStaffIds, staff.id]);
                    } else {
                      setSelectedStaffIds(selectedStaffIds.filter(id => id !== staff.id));
                    }
                  }}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <p className="font-medium">{staff.full_name}</p>
                  <p className="text-sm text-gray-600">{staff.email}</p>
                </div>
                <Badge variant="outline">{staff.role}</Badge>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStaffDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveStaff} disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock View Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent dir="rtl" className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>مخزون {selectedWarehouse?.name}</DialogTitle>
            <DialogDescription>
              عرض تفصيلي لجميع المواد المخزنة
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedWarehouse?.stock_items && selectedWarehouse.stock_items.length > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600">
                    إجمالي الأصناف: {selectedWarehouse.stock_items.length}
                  </Badge>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">المادة</TableHead>
                      <TableHead className="text-right">الصف</TableHead>
                      <TableHead className="text-right">الفصل</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedWarehouse.stock_items.map((item: any, index: number) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {item.book_details?.subject || item.book?.subject?.name || 'غير محدد'}
                        </TableCell>
                        <TableCell>{item.book_details?.grade || item.book?.grade?.name || 'غير محدد'}</TableCell>
                        <TableCell>{item.book_details?.term || item.book?.term?.name || item.term || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.quantity}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">لا يوجد مخزون حالياً</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Deduction Reports Dialog */}
      <Dialog open={showReportsDialog} onOpenChange={setShowReportsDialog}>
        <DialogContent dir="rtl" className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تقارير الخصم التلقائي - {selectedWarehouse?.name}</DialogTitle>
            <DialogDescription>
              سجل الشحنات التي تم خصمها من المخزون
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedWarehouse?.deduction_reports && selectedWarehouse.deduction_reports.length > 0 ? (
              <>
                <Badge className="bg-red-100 text-red-800">
                  إجمالي التقارير: {selectedWarehouse.deduction_reports.length}
                </Badge>

                <div className="space-y-3">
                  {selectedWarehouse.deduction_reports.map((report: any) => (
                    <Card key={report.id} className="border-l-4 border-l-red-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MinusCircle className="w-5 h-5 text-red-600" />
                            <span className="font-semibold">شحنة #{report.tracking_code}</span>
                          </div>
                          <Badge variant="outline">
                            {new Date(report.deducted_at).toLocaleDateString('ar-YE')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-right">المادة</TableHead>
                              <TableHead className="text-right">الصف</TableHead>
                              <TableHead className="text-right">الفصل</TableHead>
                              <TableHead className="text-right">الكمية المخصومة</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(report.books || []).map((book: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell>{book.book?.subject_display || book.subject || '-'}</TableCell>
                                <TableCell>{book.book?.grade_display || book.grade || '-'}</TableCell>
                                <TableCell>{book.term || '-'}</TableCell>
                                <TableCell>
                                  <Badge className="bg-red-100 text-red-800">
                                    -{book.quantity}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">لا توجد تقارير خصم</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
