import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
  DialogTrigger,
  DialogFooter,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Plus, Edit, Trash2, School, MapPin, Phone, Users, Search } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import schoolService, { School as SchoolType, Province } from '../services/schoolService';

interface SchoolData {
  id: number;
  name: string;
  province: string;
  district: string;
  address: string;
  phone?: string;
  principal?: string;
  student_count?: number;
  teacher_count?: number;
  type: string; // government, private
}

export function SchoolManagementPage() {
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    province: '',
    district: '',
    address: '',
    phone: '',
    principal: '',
    student_count: '',
    teacher_count: '',
    type: '',
  });

  useEffect(() => {
    fetchSchools();
    fetchProvinces();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const data = await schoolService.getSchools();
      const mapped = (data || []).map((s: SchoolType) => ({
        id: s.id,
        name: s.name,
        province: s.province_name || `محافظة ${s.province}`,
        district: '', // Not in backend model yet
        address: s.address || '',
        phone: s.phone || '',
        principal: s.principal_name || '',
        student_count: s.total_students || 0,
        teacher_count: s.total_teachers || 0,
        type: s.type,
      }));
      setSchools(mapped);
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const data = await schoolService.getProvinces();
      setProvinces(data || []);
    } catch (error) {
      console.error('Error fetching provinces:', error);
    }
  };

  const handleOpenDialog = (school?: SchoolData) => {
    if (school) {
      setEditingSchool(school);
      setFormData({
        name: school.name,
        province: school.province,
        district: school.district,
        address: school.address,
        phone: school.phone || '',
        principal: school.principal || '',
        student_count: school.student_count?.toString() || '',
        teacher_count: school.teacher_count?.toString() || '',
        type: school.type,
      });
    } else {
      setEditingSchool(null);
      setFormData({
        name: '',
        province: user?.role === 'province_admin' ? user.province_name || '' : '',
        district: '',
        address: '',
        phone: '',
        principal: '',
        student_count: '',
        teacher_count: '',
        type: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      // Find province ID by name or use first match
      const provinceObj = provinces.find(p => p.name === formData.province);
      const provinceId = provinceObj?.id || parseInt(formData.province) || 1;

      const payload: any = {
        name: formData.name,
        province: provinceId,
        type: formData.type,
        address: formData.address || undefined,
        phone: formData.phone || undefined,
        principal_name: formData.principal || undefined,
        total_students: formData.student_count ? parseInt(formData.student_count) : undefined,
        total_teachers: formData.teacher_count ? parseInt(formData.teacher_count) : undefined,
      };

      if (editingSchool) {
        await schoolService.updateSchool(editingSchool.id, payload);
        alert('تم تحديث المدرسة بنجاح');
      } else {
        await schoolService.createSchool(payload);
        alert('تم إضافة المدرسة بنجاح');
      }

      setIsDialogOpen(false);
      await fetchSchools();
    } catch (error) {
      console.error('Error saving school:', error);
      alert('حدث خطأ أثناء حفظ المدرسة');
    }
  };

  const handleDelete = async (schoolId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه المدرسة؟')) return;
    
    try {
      await schoolService.deleteSchool(schoolId);
      alert('تم حذف المدرسة بنجاح');
      await fetchSchools();
    } catch (error) {
      console.error('Error deleting school:', error);
      alert('حدث خطأ أثناء حذف المدرسة');
    }
  };

  const getTypeText = (type: string) => {
    const typeMap: { [key: string]: string } = {
      government: 'حكومية',
      private: 'خاصة',
    };
    return typeMap[type] || type;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'government':
        return 'bg-blue-100 text-blue-700';
      case 'private':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.district.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvince = filterProvince === 'all' || school.province === filterProvince;
    const matchesType = filterType === 'all' || school.type === filterType;
    return matchesSearch && matchesProvince && matchesType;
  });

  const schoolTypes = [
    { value: 'government', label: 'حكومية' },
    { value: 'private', label: 'خاصة' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">إدارة المدارس</h2>
          <p className="text-sm text-gray-600 mt-1">إضافة وتعديل وحذف بيانات المدارس</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => handleOpenDialog()}>
              <Plus className="ml-2 w-4 h-4" />
              إضافة مدرسة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingSchool ? 'تعديل مدرسة' : 'إضافة مدرسة جديدة'}</DialogTitle>
              <DialogDescription>
                أدخل معلومات المدرسة
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">اسم المدرسة *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: مدرسة الوحدة الابتدائية"
                />
              </div>

              <div>
                <Label htmlFor="province">المحافظة *</Label>
                <Select 
                  value={formData.province} 
                  onValueChange={(value) => setFormData({ ...formData, province: value })}
                  disabled={user?.role === 'province_admin'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((province) => (
                      <SelectItem key={province.id} value={province.name}>{province.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="district">المديرية *</Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="مثال: الصافية"
                />
              </div>

              <div>
                <Label htmlFor="type">نوع المدرسة *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01-234567"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">العنوان *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="مثال: شارع تعز - بجانب مسجد الوحدة"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="principal">مدير المدرسة</Label>
                <Input
                  id="principal"
                  value={formData.principal}
                  onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                  placeholder="الاسم الكامل"
                />
              </div>

              <div>
                <Label htmlFor="student_count">عدد الطلاب</Label>
                <Input
                  id="student_count"
                  type="number"
                  value={formData.student_count}
                  onChange={(e) => setFormData({ ...formData, student_count: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="teacher_count">عدد المعلمين</Label>
                <Input
                  id="teacher_count"
                  type="number"
                  value={formData.teacher_count}
                  onChange={(e) => setFormData({ ...formData, teacher_count: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                إلغاء
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleSubmit}
                disabled={!formData.name || !formData.province || !formData.district || !formData.address || !formData.type}
              >
                {editingSchool ? 'حفظ التعديلات' : 'إضافة المدرسة'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">إجمالي المدارس</p>
                <p className="text-3xl font-bold">{schools.length}</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <School className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">مدارس حكومية</p>
                <p className="text-3xl font-bold">
                  {schools.filter(s => s.type === 'government').length}
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <School className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">مدارس خاصة</p>
                <p className="text-3xl font-bold">
                  {schools.filter(s => s.type === 'private').length}
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <School className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">إجمالي الطلاب</p>
                <p className="text-3xl font-bold">
                  {schools.reduce((sum, s) => sum + (s.student_count || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">إجمالي المعلمين</p>
                <p className="text-3xl font-bold">
                  {schools.reduce((sum, s) => sum + (s.teacher_count || 0), 0)}
                </p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="بحث عن مدرسة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={filterProvince} onValueChange={setFilterProvince}>
              <SelectTrigger>
                <SelectValue placeholder="تصفية حسب المحافظة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المحافظات</SelectItem>
                {provinces.map((province) => (
                  <SelectItem key={province.id} value={province.name}>{province.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="تصفية حسب النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {schoolTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المدارس ({filteredSchools.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم المدرسة</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">المحافظة</TableHead>
                <TableHead className="text-right">المديرية</TableHead>
                <TableHead className="text-right">الطلاب</TableHead>
                <TableHead className="text-right">المعلمين</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell className="font-medium">{school.name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-sm ${getTypeColor(school.type)}`}>
                      {getTypeText(school.type)}
                    </span>
                  </TableCell>
                  <TableCell>{school.province}</TableCell>
                  <TableCell>{school.district}</TableCell>
                  <TableCell>{school.student_count?.toLocaleString() || '-'}</TableCell>
                  <TableCell>{school.teacher_count || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(school)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(school.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
