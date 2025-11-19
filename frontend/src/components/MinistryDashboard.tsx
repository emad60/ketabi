import { useState } from 'react';
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
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  LogOut,
  BookOpen,
  Users,
  Package,
  TrendingUp,
  School,
  FileText,
  Settings,
  Home,
  Building2,
  Warehouse,
  Truck,
  Navigation,
} from 'lucide-react';
import { MinistryWarehouseManagement } from './MinistryWarehouseManagement';
import { ShipmentManagement } from './ShipmentManagement';
import { ShipmentTracking } from './ShipmentTracking';
import { MinistryShipmentManagementPage } from './MinistryShipmentManagementPage';

interface MinistryDashboardProps {
  userName: string;
  onLogout: () => void;
}

export function MinistryDashboard({ userName, onLogout }: MinistryDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    {
      title: 'إجمالي الكتب الموزعة',
      value: '1,245,680',
      icon: BookOpen,
      color: 'bg-blue-500',
      change: '+12.5%',
    },
    {
      title: 'عدد المحافظات',
      value: '22',
      icon: Building2,
      color: 'bg-green-500',
      change: '100%',
    },
    {
      title: 'عدد المدارس',
      value: '15,847',
      icon: School,
      color: 'bg-purple-500',
      change: '+3.2%',
    },
    {
      title: 'عدد الطلاب',
      value: '4,892,340',
      icon: Users,
      color: 'bg-orange-500',
      change: '+5.8%',
    },
  ];

  const governorateData = [
    { id: 1, name: 'أمانة العاصمة', students: 485200, booksDistributed: 142350, schools: 1250, percentage: 95, status: 'مكتمل' },
    { id: 2, name: 'تعز', students: 623400, booksDistributed: 165820, schools: 1840, percentage: 87, status: 'جاري التوزيع' },
    { id: 3, name: 'الحديدة', students: 542300, booksDistributed: 151200, schools: 1620, percentage: 92, status: 'جاري التوزيع' },
    { id: 4, name: 'إب', students: 398500, booksDistributed: 112400, schools: 1340, percentage: 89, status: 'جاري التوزيع' },
    { id: 5, name: 'ذمار', students: 285600, booksDistributed: 78900, schools: 980, percentage: 78, status: 'جاري التوزيع' },
    { id: 6, name: 'صنعاء', students: 312400, booksDistributed: 89400, schools: 1120, percentage: 85, status: 'جاري التوزيع' },
    { id: 7, name: 'حضرموت', students: 256800, booksDistributed: 71200, schools: 890, percentage: 82, status: 'جاري التوزيع' },
    { id: 8, name: 'عدن', students: 198400, booksDistributed: 56300, schools: 650, percentage: 90, status: 'جاري التوزيع' },
  ];

  const monthlyDistribution = [
    { month: 'سبتمبر', distributed: 185000, target: 200000 },
    { month: 'أكتوبر', distributed: 235000, target: 220000 },
    { month: 'نوفمبر', distributed: 195000, target: 210000 },
    { month: 'ديسمبر', distributed: 165000, target: 180000 },
    { month: 'يناير', distributed: 145000, target: 150000 },
    { month: 'فبراير', distributed: 175000, target: 170000 },
  ];

  const distributionByType = [
    { name: 'كتب اللغة العربية', value: 285000, color: '#3b82f6' },
    { name: 'كتب الرياضيات', value: 265000, color: '#10b981' },
    { name: 'كتب العلوم', value: 235000, color: '#f59e0b' },
    { name: 'كتب الإنجليزية', value: 215000, color: '#8b5cf6' },
    { name: 'كتب أخرى', value: 245680, color: '#ef4444' },
  ];

  const recentActivities = [
    { id: 1, action: 'تم توزيع 5,200 كتاب', location: 'أمانة العاصمة', time: 'منذ ساعة', status: 'success' },
    { id: 2, action: 'طلب جديد من محافظة تعز', location: 'تعز', time: 'منذ ساعتين', status: 'pending' },
    { id: 3, action: 'اكتمال التوزيع', location: 'الحديدة - مديرية الصليف', time: 'منذ 3 ساعات', status: 'success' },
    { id: 4, action: 'تحديث بيانات المدارس', location: 'إب', time: 'منذ 5 ساعات', status: 'info' },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl">وزارة التربية والتعليم</h1>
                <p className="text-sm text-gray-600">نظام إدارة توزيع الكتب المدرسية</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-left">
                <p className="text-sm text-gray-600">مرحباً،</p>
                <p>{userName}</p>
              </div>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="w-4 h-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex gap-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span>نظرة عامة</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('governorates')}
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'governorates'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>المحافظات</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('warehouses')}
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'warehouses'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4" />
                <span>المخازن</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('shipments')}
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'shipments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                <span>الشحنات</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'tracking'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                <span>تتبع الشحنات</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>التقارير والإحصائيات</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>الإعدادات</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">{stat.title}</p>
                        <p className="text-2xl mb-1">{stat.value}</p>
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <TrendingUp className="w-4 h-4" />
                          <span>{stat.change}</span>
                        </div>
                      </div>
                      <div className={`${stat.color} p-3 rounded-lg`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>التوزيع الشهري للكتب</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="distributed" fill="#3b82f6" name="الموزع" />
                      <Bar dataKey="target" fill="#10b981" name="امستهدف" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>التوزيع حسب نوع الكتاب</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={distributionByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => entry.name}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {distributionByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>آخر الأنشطة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.status === 'success'
                              ? 'bg-green-500'
                              : activity.status === 'pending'
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <div>
                          <p>{activity.action}</p>
                          <p className="text-sm text-gray-600">{activity.location}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'governorates' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>بيانات المحافظات</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المحافظة</TableHead>
                      <TableHead className="text-right">عدد الطلاب</TableHead>
                      <TableHead className="text-right">الكتب الموزعة</TableHead>
                      <TableHead className="text-right">عدد المدارس</TableHead>
                      <TableHead className="text-right">نسبة الإنجاز</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {governorateData.map((gov) => (
                      <TableRow key={gov.id}>
                        <TableCell>{gov.name}</TableCell>
                        <TableCell>{gov.students.toLocaleString()}</TableCell>
                        <TableCell>{gov.booksDistributed.toLocaleString()}</TableCell>
                        <TableCell>{gov.schools.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${gov.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm">{gov.percentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              gov.status === 'مكتمل'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {gov.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'warehouses' && (
          <MinistryWarehouseManagement />
        )}

        {activeTab === 'shipments' && (
          <MinistryShipmentManagementPage />
        )}

        {activeTab === 'tracking' && (
          <ShipmentTracking type="ministry" />
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>التقارير والإحصائيات التفصيلية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="mb-4">الاتجاه العام للتوزيع</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="distributed"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          name="الموزع"
                        />
                        <Line
                          type="monotone"
                          dataKey="target"
                          stroke="#10b981"
                          strokeWidth={2}
                          name="المستهدف"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h3 className="mb-4">أداء المحافظات</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={governorateData.slice(0, 5)}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip />
                        <Bar dataKey="percentage" fill="#8b5cf6" name="نسبة الإنجاز" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle>الإعدادات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="mb-2">إعدادات النظام</h3>
                  <p className="text-gray-600">قم بتخصيص إعدادات النظام حسب احتياجاتك</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="mb-2">إدارة المستخدمين</h3>
                  <p className="text-gray-600">إضافة وإدارة مستخدمي النظام</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="mb-2">النسخ الاحتياطي</h3>
                  <p className="text-gray-600">إنشاء نسخة احتياطية من البيانات</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}