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
  School,
  TrendingUp,
  Building2,
  FileText,
  Settings,
  Home,
  MapPin,
  Package,
  AlertCircle,
  Warehouse,
  Truck,
  Navigation,
  FileInput,
} from 'lucide-react';
import { CapitalWarehouseManagement } from './CapitalWarehouseManagement';
import { ShipmentManagement } from './ShipmentManagement';
import { ShipmentTracking } from './ShipmentTracking';
import { CreateBookRequest } from './CreateBookRequest';

interface CapitalDashboardProps {
  userName: string;
  onLogout: () => void;
}

export function CapitalDashboard({ userName, onLogout }: CapitalDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    {
      title: 'الكتب الموزعة',
      value: '142,350',
      icon: BookOpen,
      color: 'bg-purple-500',
      change: '+8.2%',
    },
    {
      title: 'عدد المديريات',
      value: '10',
      icon: MapPin,
      color: 'bg-blue-500',
      change: '100%',
    },
    {
      title: 'عدد المدارس',
      value: '1,250',
      icon: School,
      color: 'bg-green-500',
      change: '+2.1%',
    },
    {
      title: 'عدد الطلاب',
      value: '485,200',
      icon: Users,
      color: 'bg-orange-500',
      change: '+4.3%',
    },
  ];

  const directorateData = [
    { id: 1, name: 'مديرية الوحدة', students: 52400, booksDistributed: 15680, schools: 145, percentage: 98, status: 'مكتمل', requests: 2 },
    { id: 2, name: 'مديرية الصافية', students: 48200, booksDistributed: 14120, schools: 132, percentage: 96, status: 'مكتمل', requests: 1 },
    { id: 3, name: 'مديرية التحرير', students: 51600, booksDistributed: 15320, schools: 138, percentage: 94, status: 'جاري التوزيع', requests: 3 },
    { id: 4, name: 'مديرية الثورة', students: 49800, booksDistributed: 14650, schools: 128, percentage: 92, status: 'جاري التوزيع', requests: 2 },
    { id: 5, name: 'مديرية معين', students: 46300, booksDistributed: 13240, schools: 118, percentage: 89, status: 'جاري التوزيع', requests: 4 },
    { id: 6, name: 'مديرية شعوب', students: 44900, booksDistributed: 12850, schools: 112, percentage: 87, status: 'جاري التوزيع', requests: 3 },
    { id: 7, name: 'مديرية السبعين', students: 52100, booksDistributed: 14920, schools: 141, percentage: 93, status: 'جاري التوزيع', requests: 2 },
    { id: 8, name: 'مديرية بني الحارث', students: 38600, booksDistributed: 10840, schools: 98, percentage: 85, status: 'جاري التوزيع', requests: 5 },
    { id: 9, name: 'مديرية همدان', steps: 41500, booksDistributed: 11680, schools: 105, percentage: 88, status: 'جاري التوزيع', requests: 3 },
    { id: 10, name: 'مديرية آزال', students: 39800, booksDistributed: 11050, schools: 103, percentage: 86, status: 'جاري التوزيع', requests: 4 },
  ];

  const weeklyDistribution = [
    { week: 'الأسبوع 1', distributed: 18500, planned: 18000 },
    { week: 'الأسبوع 2', distributed: 22000, planned: 20000 },
    { week: 'الأسبوع 3', distributed: 19500, planned: 21000 },
    { week: 'الأسبوع 4', distributed: 21000, planned: 20000 },
    { week: 'الأسبوع 5', distributed: 17800, planned: 19000 },
    { week: 'الأسبوع 6', distributed: 20500, planned: 20000 },
  ];

  const distributionBySubject = [
    { name: 'اللغة العربية', value: 32500, color: '#8b5cf6' },
    { name: 'الرياضيات', value: 29800, color: '#3b82f6' },
    { name: 'العلوم', value: 26400, color: '#10b981' },
    { name: 'الإنجليزية', value: 24200, color: '#f59e0b' },
    { name: 'التربية الإسلامية', value: 29450, color: '#ef4444' },
  ];

  const recentRequests = [
    { id: 1, school: 'مدرسة الشهيد الحمدي', directorate: 'الوحدة', books: 320, date: '2024-11-14', status: 'معتمد' },
    { id: 2, school: 'مدرسة الثورة النموذجية', directorate: 'الثورة', books: 450, date: '2024-11-14', status: 'قيد المراجعة' },
    { id: 3, school: 'مدرسة الأندلس', directorate: 'معين', books: 280, date: '2024-11-13', status: 'معتمد' },
    { id: 4, school: 'مدرسة الزهراء', directorate: 'الصافية', books: 195, date: '2024-11-13', status: 'معتمد' },
    { id: 5, school: 'مدرسة الإيمان', directorate: 'بني الحارث', books: 340, date: '2024-11-12', status: 'قيد المراجعة' },
  ];

  const alerts = [
    { id: 1, message: 'نقص في كتب الرياضيات - مديرية بني الحارث', severity: 'warning', time: 'منذ ساعة' },
    { id: 2, message: 'طلب عاجل من مدرسة الأندلس', severity: 'urgent', time: 'منذ ساعتين' },
    { id: 3, message: 'اكتمال التوزيع في مديرية الوحدة', severity: 'success', time: 'منذ 4 ساعات' },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-purple-700 text-white sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl">أمانة العاصمة صنعاء</h1>
                <p className="text-sm text-purple-100">نظام إدارة توزيع الكتب المدرسية</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-left">
                <p className="text-sm text-purple-100">مرحباً،</p>
                <p>{userName}</p>
              </div>
              <Button variant="outline" onClick={onLogout} className="bg-white/10 border-white/20 text-white hover:bg-white/20">
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
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span>لوحة التحكم</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('directorates')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'directorates'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>المديريات</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'requests'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>طلبات المدارس</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'reports'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>التقارير</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('warehouse')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'warehouse'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4" />
                <span>إدارة المستودعات</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('shipments')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'shipments'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                <span>إدارة الشحنات</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'tracking'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                <span>تتبع الشحنات</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('createRequest')}
              className={`py-4 px-2 border-b-2 transition-colors ${
                activeTab === 'createRequest'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileInput className="w-4 h-4" />
                <span>إنشاء طلب جديد</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg flex items-center justify-between ${
                      alert.severity === 'urgent'
                        ? 'bg-red-50 border border-red-200'
                        : alert.severity === 'warning'
                        ? 'bg-yellow-50 border border-yellow-200'
                        : 'bg-green-50 border border-green-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle
                        className={`w-5 h-5 ${
                          alert.severity === 'urgent'
                            ? 'text-red-600'
                            : alert.severity === 'warning'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      />
                      <p>{alert.message}</p>
                    </div>
                    <span className="text-sm text-gray-600">{alert.time}</span>
                  </div>
                ))}
              </div>
            )}

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
                  <CardTitle>التوزيع الأسبوعي</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="distributed"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="الموزع"
                      />
                      <Line
                        type="monotone"
                        dataKey="planned"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="المخطط"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>التوزيع حسب المادة</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={distributionBySubject}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => entry.name}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {distributionBySubject.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Requests */}
            <Card>
              <CardHeader>
                <CardTitle>أحدث الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المدرسة</TableHead>
                      <TableHead className="text-right">المديرية</TableHead>
                      <TableHead className="text-right">عدد الكتب</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.school}</TableCell>
                        <TableCell>{request.directorate}</TableCell>
                        <TableCell>{request.books}</TableCell>
                        <TableCell>{request.date}</TableCell>
                        <TableCell>
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              request.status === 'معتمد'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {request.status}
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

        {activeTab === 'directorates' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>بيانات المديريات</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المديرية</TableHead>
                      <TableHead className="text-right">عدد الطلاب</TableHead>
                      <TableHead className="text-right">الكتب الموزعة</TableHead>
                      <TableHead className="text-right">عدد المدارس</TableHead>
                      <TableHead className="text-right">نسبة الإنجاز</TableHead>
                      <TableHead className="text-right">الطلبات المعلقة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {directorateData.map((dir) => (
                      <TableRow key={dir.id}>
                        <TableCell>{dir.name}</TableCell>
                        <TableCell>{dir.students?.toLocaleString()}</TableCell>
                        <TableCell>{dir.booksDistributed.toLocaleString()}</TableCell>
                        <TableCell>{dir.schools.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${dir.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm">{dir.percentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                            {dir.requests}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              dir.status === 'مكتمل'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {dir.status}
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

        {activeTab === 'requests' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>طلبات المدارس</CardTitle>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Package className="w-4 h-4 ml-2" />
                    طلب جديد
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المدرسة</TableHead>
                      <TableHead className="text-right">المديرية</TableHead>
                      <TableHead className="text-right">عدد الكتب</TableHead>
                      <TableHead className="text-right">تاريخ الطلب</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.school}</TableCell>
                        <TableCell>{request.directorate}</TableCell>
                        <TableCell>{request.books}</TableCell>
                        <TableCell>{request.date}</TableCell>
                        <TableCell>
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${
                              request.status === 'معتمد'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {request.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">عرض</Button>
                            {request.status !== 'معتمد' && (
                              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                اعتماد
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>التقارير والإحصائيات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="mb-4">أداء المديريات</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={directorateData.slice(0, 6)}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="percentage" fill="#8b5cf6" name="نسبة الإنجاز" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h3 className="mb-4">توزيع الطلاب حسب المديريات</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={directorateData.slice(0, 6)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="students" fill="#3b82f6" name="عدد الطلاب" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'warehouse' && (
          <CapitalWarehouseManagement />
        )}

        {activeTab === 'shipments' && (
          <ShipmentManagement type="capital" />
        )}

        {activeTab === 'tracking' && (
          <ShipmentTracking type="capital" />
        )}

        {activeTab === 'createRequest' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إنشاء طلب جديد</CardTitle>
              </CardHeader>
              <CardContent>
                <CreateBookRequest />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}