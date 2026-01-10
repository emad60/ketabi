import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
import { Badge } from './ui/badge';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Loader2,
  Phone,
  Mail,
  TruckIcon,
  CheckCircle,
  XCircle
} from 'lucide-react';
import api from '../services/api';

interface Courier {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  province?: string;
  is_active: boolean;
  assigned_shipments_count?: number;
  assigned_shipments?: Array<{
    id: number;
    tracking_code: string;
    status: string;
    status_display?: string;
    to_school_name?: string;
    to_province_name?: string;
    created_at: string;
  }>;
}

interface CouriersManagementPageProps {
  courierType: 'ministry' | 'province';
}

export function CouriersManagementPage({ courierType }: CouriersManagementPageProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewCourier, setViewCourier] = useState<Courier | null>(null);
  const [loadingShipments, setLoadingShipments] = useState(false);
  
  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    password: '',
    province: ''
  });

  useEffect(() => {
    loadCouriers();
  }, []);

  const filteredCouriers = couriers.filter(c => {
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? c.is_active : !c.is_active);
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch = !q || (
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.username || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
    return matchesStatus && matchesSearch;
  });

  const loadCouriers = async () => {
    try {
      setLoading(true);
      const role = courierType === 'ministry' ? 'ministry_driver' : 'province_driver';
      
      const response = await api.get('/users/', {
        params: {
          role: role,
          page_size: 100
        }
      });

      const couriersList = response.data.results || response.data || [];
      
      // Load shipment counts for each courier
      const couriersWithCounts = await Promise.all(
        couriersList.map(async (courier: Courier) => {
          try {
            const shipmentsResponse = await api.get('/warehouses/shipments/', {
              params: {
                assigned_courier: courier.id,
                page_size: 1
              }
            });
            const count = shipmentsResponse.data.count || (shipmentsResponse.data.results?.length || 0);
            return { ...courier, assigned_shipments_count: count };
          } catch {
            return { ...courier, assigned_shipments_count: 0 };
          }
        })
      );

      setCouriers(couriersWithCounts);
    } catch (error) {
      console.error('Error loading couriers:', error);
      alert('فشل تحميل المناديب');
    } finally {
      setLoading(false);
    }
  };

  const loadCourierShipments = async (courierId: number) => {
    try {
      setLoadingShipments(true);
      const response = await api.get('/warehouses/shipments/', {
        params: {
          assigned_courier: courierId,
          page_size: 50
        }
      });
      
      return response.data.results || response.data || [];
    } catch (error) {
      console.error('Error loading courier shipments:', error);
      return [];
    } finally {
      setLoadingShipments(false);
    }
  };

  const handleViewCourier = async (courier: Courier) => {
    setViewCourier(courier);
    setShowViewDialog(true);
    
    // Load shipments for this courier
    const shipments = await loadCourierShipments(courier.id);
    setViewCourier({
      ...courier,
      assigned_shipments: shipments,
      assigned_shipments_count: shipments.length
    });
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      full_name: '',
      phone: '',
      password: '',
      province: ''
    });
  };

  const handleAdd = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const handleEdit = (courier: Courier) => {
    setSelectedCourier(courier);
    setFormData({
      username: courier.username,
      email: courier.email,
      full_name: courier.full_name,
      phone: courier.phone || '',
      password: '',
      province: courier.province || ''
    });
    setShowEditDialog(true);
  };

  const handleSaveNew = async () => {
    if (!formData.username || !formData.email || !formData.full_name || !formData.password) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setSaving(true);
      
      const payload = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        password: formData.password,
        role: courierType === 'ministry' ? 'ministry_driver' : 'province_driver',
        province: courierType === 'province' ? formData.province : null
      };

      await api.post('/users/', payload);
      
      alert('✅ تم إضافة المندوب بنجاح!');
      setShowAddDialog(false);
      resetForm();
      loadCouriers();
    } catch (error: any) {
      console.error('Error adding courier:', error);
      alert('حدث خطأ: ' + (error.response?.data?.detail || error.response?.data?.username?.[0] || 'فشل في إضافة المندوب'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedCourier) return;

    try {
      setSaving(true);
      
      const payload: any = {
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (courierType === 'province' && formData.province) {
        payload.province = formData.province;
      }

      await api.patch(`/users/${selectedCourier.id}/`, payload);
      
      alert('✅ تم تحديث المندوب بنجاح!');
      setShowEditDialog(false);
      resetForm();
      setSelectedCourier(null);
      loadCouriers();
    } catch (error: any) {
      console.error('Error updating courier:', error);
      alert('حدث خطأ: ' + (error.response?.data?.detail || 'فشل في تحديث المندوب'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (courier: Courier) => {
    if (!confirm(`هل تريد ${courier.is_active ? 'تعطيل' : 'تفعيل'} المندوب ${courier.full_name}؟`)) {
      return;
    }

    try {
      await api.patch(`/users/${courier.id}/`, {
        is_active: !courier.is_active
      });
      
      alert('✅ تم تحديث حالة المندوب!');
      loadCouriers();
    } catch (error) {
      console.error('Error toggling courier status:', error);
      alert('فشل في تحديث الحالة');
    }
  };

  const handleDelete = async (courier: Courier) => {
    if (!confirm(`هل أنت متأكد من حذف المندوب ${courier.full_name}؟\nهذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    try {
      await api.delete(`/users/${courier.id}/`);
      alert('✅ تم حذف المندوب!');
      loadCouriers();
    } catch (error) {
      console.error('Error deleting courier:', error);
      alert('فشل في حذف المندوب');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              إدارة المناديب
            </h1>
            <p className="text-sm text-gray-600">
              {courierType === 'ministry' ? 'مناديب الوزارة' : 'مناديب المحافظة'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة مندوب
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المناديب</p>
                <p className="text-2xl font-bold text-gray-900">{couriers.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المناديب النشطون</p>
                <p className="text-2xl font-bold text-green-600">
                  {couriers.filter(c => c.is_active).length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الشحنات المسندة</p>
                <p className="text-2xl font-bold text-blue-600">
                  {couriers.reduce((sum, c) => sum + (c.assigned_shipments_count || 0), 0)}
                </p>
              </div>
              <TruckIcon className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Input 
          value={searchTerm} 
          onChange={(e:any)=>setSearchTerm(e.target.value)} 
          placeholder="ابحث باسم أو بريد أو هاتف..." 
          className="max-w-md"
        />
        <Select value={statusFilter} onValueChange={(val:any)=>setStatusFilter(val)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="حالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="inactive">معطل</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              إجمالي المناديب
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{couriers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              المناديب النشطون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {couriers.filter(c => c.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              المناديب المعطلون
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {couriers.filter(c => !c.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Couriers Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المناديب</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-gray-600 mt-2">جاري التحميل...</p>
            </div>
          ) : filteredCouriers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>لا يوجد مناديب</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>اسم المستخدم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>الهاتف</TableHead>
                  {courierType === 'province' && <TableHead>المحافظة</TableHead>}
                  <TableHead>الحالة</TableHead>
                  <TableHead>الشحنات</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCouriers.map(courier => (
                  <TableRow key={courier.id}>
                    <TableCell className="font-medium">
                      {courier.full_name}
                    </TableCell>
                    <TableCell>{courier.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="w-4 h-4" />
                        {courier.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {courier.phone ? (
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Phone className="w-4 h-4 text-blue-600" />
                          <a href={`tel:${courier.phone}`} className="text-blue-600 hover:underline">
                            {courier.phone}
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">غير محدد</span>
                      )}
                    </TableCell>
                    {courierType === 'province' && (
                      <TableCell>{courier.province || '-'}</TableCell>
                    )}
                    <TableCell>
                      <Badge
                        className={courier.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {courier.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3 ml-1" />
                            نشط
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 ml-1" />
                            معطل
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className="bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                      >
                        <TruckIcon className="w-3 h-3 ml-1" />
                        {courier.assigned_shipments_count || 0} شحنة
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewCourier(courier)}
                        >
                          عرض
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(courier)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={courier.is_active ? 'outline' : 'default'}
                          onClick={() => handleToggleActive(courier)}
                        >
                          {courier.is_active ? 'تعطيل' : 'تفعيل'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(courier)}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add Dialog */}
      {/* View Courier Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">تفاصيل المندوب - {viewCourier?.full_name}</DialogTitle>
            <DialogDescription>
              معلومات المندوب والشحنات المسندة له
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-gray-600">الاسم الكامل</Label>
                <div className="font-medium mt-1">{viewCourier?.full_name}</div>
              </div>
              <div>
                <Label className="text-gray-600">اسم المستخدم</Label>
                <div className="font-medium mt-1">{viewCourier?.username}</div>
              </div>
              <div>
                <Label className="text-gray-600">البريد الإلكتروني</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{viewCourier?.email || '-'}</span>
                </div>
              </div>
              <div>
                <Label className="text-gray-600">رقم الهاتف</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">{viewCourier?.phone || '-'}</span>
                </div>
              </div>
              {courierType === 'province' && (
                <div>
                  <Label className="text-gray-600">المحافظة</Label>
                  <div className="font-medium mt-1">{viewCourier?.province || '-'}</div>
                </div>
              )}
              <div>
                <Label className="text-gray-600">الحالة</Label>
                <div className="mt-1">
                  <Badge className={viewCourier?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {viewCourier?.is_active ? (
                      <><CheckCircle className="w-3 h-3 ml-1" /> نشط</>
                    ) : (
                      <><XCircle className="w-3 h-3 ml-1" /> معطل</>
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Shipments Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TruckIcon className="w-5 h-5 text-blue-600" />
                  الشحنات المسندة ({viewCourier?.assigned_shipments_count || 0})
                </h3>
              </div>

              {loadingShipments ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                  <p className="text-sm text-gray-600 mt-2">جاري تحميل الشحنات...</p>
                </div>
              ) : viewCourier?.assigned_shipments && viewCourier.assigned_shipments.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {viewCourier.assigned_shipments.map((shipment: any) => (
                    <div key={shipment.id} className="p-3 border rounded-lg hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-blue-600">#{shipment.tracking_code}</span>
                            <Badge className={
                              shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              shipment.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                              shipment.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {shipment.status_display || shipment.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <span>المستلم:</span>
                              <span className="font-medium">{shipment.to_school_name || shipment.to_province_name || 'غير محدد'}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(shipment.created_at).toLocaleDateString('ar-YE')}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/shipments/${shipment.id}`, '_blank')}
                        >
                          عرض
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TruckIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>لا توجد شحنات مسندة</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة مندوب جديد</DialogTitle>
            <DialogDescription>
              {courierType === 'ministry' ? 'مندوب وزارة' : 'مندوب محافظة'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>الاسم الكامل *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                placeholder="أدخل الاسم الكامل"
              />
            </div>

            <div>
              <Label>اسم المستخدم *</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="أدخل اسم المستخدم"
              />
            </div>

            <div>
              <Label>البريد الإلكتروني *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="example@email.com"
              />
            </div>

            <div>
              <Label>رقم الهاتف</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="771234567"
              />
            </div>

            {courierType === 'province' && (
              <div>
                <Label>المحافظة *</Label>
                <Select value={formData.province} onValueChange={(val) => setFormData({...formData, province: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="أمانة العاصمة">أمانة العاصمة</SelectItem>
                    <SelectItem value="صنعاء">صنعاء</SelectItem>
                    <SelectItem value="عدن">عدن</SelectItem>
                    <SelectItem value="تعز">تعز</SelectItem>
                    <SelectItem value="حضرموت">حضرموت</SelectItem>
                    <SelectItem value="إب">إب</SelectItem>
                    <SelectItem value="ذمار">ذمار</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>كلمة المرور *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="أدخل كلمة المرور"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveNew} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المندوب</DialogTitle>
            <DialogDescription>
              {selectedCourier?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>الاسم الكامل *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>

            <div>
              <Label>البريد الإلكتروني *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <Label>رقم الهاتف</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            {courierType === 'province' && (
              <div>
                <Label>المحافظة</Label>
                <Select value={formData.province} onValueChange={(val) => setFormData({...formData, province: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="أمانة العاصمة">أمانة العاصمة</SelectItem>
                    <SelectItem value="صنعاء">صنعاء</SelectItem>
                    <SelectItem value="عدن">عدن</SelectItem>
                    <SelectItem value="تعز">تعز</SelectItem>
                    <SelectItem value="حضرموت">حضرموت</SelectItem>
                    <SelectItem value="إب">إب</SelectItem>
                    <SelectItem value="ذمار">ذمار</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>كلمة المرور الجديدة (اتركها فارغة لعدم التغيير)</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="أدخل كلمة مرور جديدة"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ التعديلات
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
