import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { FileText, Download, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import DashboardTopNav from '../components/DashboardTopNav';
import { useAuthStore } from '../store/authStore';

const REPORT_TYPES = [
  { id: 'inventory', label: 'تقرير المخزون', icon: BarChart3 },
  { id: 'shipments', label: 'تقرير الشحنات', icon: FileText },
  { id: 'requests', label: 'تقرير الطلبات', icon: PieChart },
  { id: 'distribution', label: 'تقرير التوزيع', icon: TrendingUp },
];

const TIME_PERIODS = [
  { value: 'today', label: 'اليوم' },
  { value: 'week', label: 'هذا الأسبوع' },
  { value: 'month', label: 'هذا الشهر' },
  { value: 'quarter', label: 'هذا الربع' },
  { value: 'year', label: 'هذا العام' },
  { value: 'custom', label: 'فترة مخصصة' },
];

export function ReportsPage() {
  const { user } = useAuthStore();
  const [selectedReport, setSelectedReport] = useState('');
  const [timePeriod, setTimePeriod] = useState('month');
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to generate report
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('تم إنشاء التقرير بنجاح');
    } catch (err) {
      alert('فشل إنشاء التقرير');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    // TODO: Implement report download
    alert('جاري تحميل التقرير...');
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <DashboardTopNav 
        activeTab="reports" 
        onTabChange={() => {}} 
        role={user?.role === 'ministry_admin' ? 'ministry' : 'province'} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">التقارير والإحصائيات</h1>
          <p className="text-sm text-gray-600 mt-1">إنشاء وتحميل تقارير شاملة عن النظام</p>
        </div>

        {/* Report Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {REPORT_TYPES.map((report) => {
            const Icon = report.icon;
            return (
              <Card 
                key={report.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedReport === report.id ? 'ring-2 ring-purple-600 shadow-md' : ''
                }`}
                onClick={() => setSelectedReport(report.id)}
              >
                <CardContent className="p-6 text-center">
                  <Icon className={`w-8 h-8 mx-auto mb-3 ${
                    selectedReport === report.id ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                  <p className="font-medium text-sm">{report.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Report Configuration */}
        {selectedReport && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>إعدادات التقرير</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>الفترة الزمنية</Label>
                  <Select value={timePeriod} onValueChange={setTimePeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_PERIODS.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>تنسيق الملف</Label>
                  <Select defaultValue="pdf">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleGenerateReport} disabled={loading}>
                  <BarChart3 className="w-4 h-4 ml-2" />
                  {loading ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
                </Button>
                <Button variant="outline" onClick={handleDownloadReport}>
                  <Download className="w-4 h-4 ml-2" />
                  تحميل
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>التقارير السابقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'تقرير المخزون - نوفمبر 2024', date: '2024-11-10', size: '2.4 MB' },
                { name: 'تقرير الشحنات - أكتوبر 2024', date: '2024-10-28', size: '1.8 MB' },
                { name: 'تقرير التوزيع - الربع الثالث 2024', date: '2024-10-01', size: '3.2 MB' },
              ].map((report, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-sm">{report.name}</p>
                      <p className="text-xs text-gray-600">{report.date} • {report.size}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
