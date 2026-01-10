import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { 
  FileText, 
  Download, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Package, 
  TruckIcon, 
  Loader2,
  FileSpreadsheet,
  Calendar,
  User
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import DashboardTopNav from '../components/DashboardTopNav';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface Report {
  id: number;
  title: string;
  report_type: string;
  scope: string;
  description: string;
  file_url: string;
  uploaded_by_name: string;
  province_name?: string;
  created_at: string;
  file_size_mb: number;
  downloads_count: number;
}

const REPORT_TYPES = [
  { id: 'ministry_statistics', label: 'إحصائيات الوزارة', icon: TrendingUp, ministry: true },
  { id: 'province_statistics', label: 'إحصائيات المحافظة', icon: BarChart3, province: true },
  { id: 'warehouse_stock', label: 'مخزون المستودعات', icon: Package, both: true },
  { id: 'shipments', label: 'تقرير الشحنات', icon: TruckIcon, both: true },
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
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const isMinistry = user?.role === 'ministry_admin' || user?.role === 'ministry_staff';

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const scope = isMinistry ? 'ministry' : 'province';
      const response = await api.get('/warehouses/excel-reports/', {
        params: { scope, page_size: 100 }
      });
      setReports(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      alert('الرجاء اختيار نوع التقرير');
      return;
    }

    setGenerating(true);
    try {
      let endpoint = '';
      let requestData: any = {};

      switch (selectedReport) {
        case 'ministry_statistics':
          endpoint = '/warehouses/excel/generate/ministry-statistics/';
          break;
        case 'province_statistics':
          endpoint = '/warehouses/excel/generate/province-statistics/';
          break;
        case 'warehouse_stock':
          const warehouseId = prompt('أدخل رقم المستودع:');
          if (!warehouseId) {
            setGenerating(false);
            return;
          }
          endpoint = '/warehouses/excel/generate/warehouse-stock/';
          requestData = {
            warehouse_id: parseInt(warehouseId),
            warehouse_type: isMinistry ? 'ministry' : 'province'
          };
          break;
        case 'shipments':
          endpoint = '/warehouses/excel/generate/shipments/';
          break;
      }

      const response = await api.post(endpoint, requestData, { 
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      // تحميل الملف مباشرة بدون blob URL
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const filename = `report_${selectedReport}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // استخدام طريقة التحميل المباشر
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // تنظيف
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }, 100);
      
      alert('✅ تم توليد التقرير وتحميله بنجاح!');
      loadReports();
    } catch (err) {
      console.error('Error generating report:', err);
      alert('فشل إنشاء التقرير');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = (report: Report) => {
    if (report.file_url) {
      window.open(report.file_url, '_blank');
    }
  };

  const getReportTypeLabel = (type: string) => {
    const report = REPORT_TYPES.find(r => r.id === type);
    return report?.label || type;
  };

  const filteredReportTypes = REPORT_TYPES.filter(report => {
    if (isMinistry) return report.ministry || report.both;
    return report.province || report.both;
  });

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
          {filteredReportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card 
                key={report.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedReport === report.id ? 'ring-2 ring-blue-600 shadow-md' : ''
                }`}
                onClick={() => setSelectedReport(report.id)}
              >
                <CardContent className="p-6 text-center">
                  <Icon className={`w-8 h-8 mx-auto mb-3 ${
                    selectedReport === report.id ? 'text-blue-600' : 'text-gray-400'
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
              <CardTitle>توليد تقرير {getReportTypeLabel(selectedReport)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                سيتم توليد تقرير Excel شامل يحتوي على جميع البيانات والإحصائيات المطلوبة
              </p>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleGenerateReport} disabled={generating} className="bg-blue-600 hover:bg-blue-700">
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التوليد...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4 ml-2" />
                      توليد وتحميل التقرير (Excel)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>التقارير المحفوظة</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">جاري التحميل...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">لا توجد تقارير محفوظة</p>
                <p className="text-gray-400 text-sm mt-2">قم بتوليد تقرير جديد من الخيارات أعلاه</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">بواسطة</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الحجم</TableHead>
                    <TableHead className="text-right">التحميلات</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getReportTypeLabel(report.report_type)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{report.uploaded_by_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{new Date(report.created_at).toLocaleDateString('ar-YE')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{report.file_size_mb} MB</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">
                          <Download className="w-3 h-3 ml-1" />
                          {report.downloads_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadReport(report)}
                        >
                          <Download className="w-4 h-4 ml-1" />
                          تحميل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
