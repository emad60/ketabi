import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  FileSpreadsheet,
  Download,
  Upload,
  TrendingUp,
  Package,
  TruckIcon,
  Loader2,
  Calendar,
  User
} from 'lucide-react';
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

export function MinistryReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/warehouses/excel-reports/', {
        params: { scope: 'ministry', page_size: 100 }
      });
      setReports(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      alert('فشل تحميل التقارير');
    } finally {
      setLoading(false);
    }
  };

  const generateMinistryStatistics = async () => {
    try {
      setGenerating('ministry');
      const response = await api.post(
        '/warehouses/excel/generate/ministry-statistics/',
        {},
        { responseType: 'blob' }
      );
      
      // تحميل الملف
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ministry_statistics_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert('✅ تم توليد التقرير بنجاح!');
      loadReports();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('فشل في توليد التقرير');
    } finally {
      setGenerating(null);
    }
  };

  const generateWarehouseStock = async () => {
    const warehouseId = prompt('أدخل رقم المستودع:');
    if (!warehouseId) return;

    try {
      setGenerating('warehouse');
      const response = await api.post(
        '/warehouses/excel/generate/warehouse-stock/',
        {
          warehouse_id: parseInt(warehouseId),
          warehouse_type: 'ministry'
        },
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `warehouse_stock_${warehouseId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert('✅ تم توليد التقرير بنجاح!');
      loadReports();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('فشل في توليد التقرير');
    } finally {
      setGenerating(null);
    }
  };

  const generateShipmentsReport = async () => {
    try {
      setGenerating('shipments');
      const response = await api.post(
        '/warehouses/excel/generate/shipments/',
        {},
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `shipments_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert('✅ تم توليد التقرير بنجاح!');
      loadReports();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('فشل في توليد التقرير');
    } finally {
      setGenerating(null);
    }
  };

  const downloadReport = async (report: Report) => {
    try {
      window.open(report.file_url, '_blank');
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('فشل تحميل التقرير');
    }
  };

  const getReportTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      ministry_statistics: 'إحصائيات الوزارة',
      warehouse_stock: 'مخزون المستودعات',
      shipments: 'تقرير الشحنات',
      books_distribution: 'توزيع الكتب',
      schools_status: 'حالة المدارس',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تقارير الوزارة</h1>
            <p className="text-sm text-gray-600">توليد وإدارة التقارير الإحصائية</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition" onClick={generateMinistryStatistics}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-2">إحصائيات الوزارة</h3>
                <p className="text-sm text-gray-600">تقرير شامل للإحصائيات</p>
              </div>
              {generating === 'ministry' ? (
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              ) : (
                <TrendingUp className="w-8 h-8 text-blue-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition" onClick={generateWarehouseStock}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-2">مخزون المستودعات</h3>
                <p className="text-sm text-gray-600">تقرير مفصل للمخزون</p>
              </div>
              {generating === 'warehouse' ? (
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
              ) : (
                <Package className="w-8 h-8 text-green-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition" onClick={generateShipmentsReport}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-2">تقرير الشحنات</h3>
                <p className="text-sm text-gray-600">سجل الشحنات الكامل</p>
              </div>
              {generating === 'shipments' ? (
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              ) : (
                <TruckIcon className="w-8 h-8 text-purple-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
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
              <p className="text-gray-500 text-lg">لا توجد تقارير حالياً</p>
              <p className="text-gray-400 text-sm mt-2">قم بتوليد تقرير جديد من الأزرار أعلاه</p>
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
                        {report.uploaded_by_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {new Date(report.created_at).toLocaleDateString('ar-YE')}
                      </div>
                    </TableCell>
                    <TableCell>{report.file_size_mb} MB</TableCell>
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
    </div>
  );
}
