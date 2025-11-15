/**
 * Report Service
 * خدمة التقارير و تصدير البيانات
 */

import api from './api';
import { ENDPOINTS } from '../config/api';

export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  warehouse_id?: number;
  province?: string;
  status?: string;
  driver_id?: number;
}

export interface ShipmentReport {
  total_shipments: number;
  delivered: number;
  in_transit: number;
  pending: number;
  failed: number;
  total_books: number;
  on_time_delivery_rate: number;
  average_delivery_time: number;
}

export interface WarehouseReport {
  warehouse_name: string;
  total_capacity: number;
  current_stock: number;
  utilization_rate: number;
  books_by_subject: Record<string, number>;
  low_stock_items: number;
}

export const reportService = {
  // ==================== Report Generation ====================

  /**
   * إنشاء تقرير الشحنات
   */
  async generateShipmentReport(
    filters: ReportFilters,
    format: 'pdf' | 'excel' = 'pdf'
  ): Promise<Blob> {
    const response = await api.post(
      ENDPOINTS.REPORTS.SHIPMENTS,
      { ...filters, format },
      { responseType: 'blob' }
    );
    return response.data;
  },

  /**
   * إنشاء تقرير المخازن
   */
  async generateWarehouseReport(
    filters: ReportFilters,
    format: 'pdf' | 'excel' = 'pdf'
  ): Promise<Blob> {
    const response = await api.post(
      ENDPOINTS.REPORTS.WAREHOUSES,
      { ...filters, format },
      { responseType: 'blob' }
    );
    return response.data;
  },

  /**
   * إنشاء تقرير الأداء
   */
  async generatePerformanceReport(
    filters: ReportFilters,
    format: 'pdf' | 'excel' = 'pdf'
  ): Promise<Blob> {
    const response = await api.post(
      ENDPOINTS.REPORTS.PERFORMANCE,
      { ...filters, format },
      { responseType: 'blob' }
    );
    return response.data;
  },

  /**
   * إنشاء تقرير الكتب
   */
  async generateBookReport(
    filters: ReportFilters,
    format: 'pdf' | 'excel' = 'pdf'
  ): Promise<Blob> {
    const response = await api.post(
      ENDPOINTS.REPORTS.BOOKS,
      { ...filters, format },
      { responseType: 'blob' }
    );
    return response.data;
  },

  // ==================== Report Data (JSON) ====================

  /**
   * الحصول على بيانات تقرير الشحنات (JSON)
   */
  async getShipmentReportData(
    filters: ReportFilters
  ): Promise<ShipmentReport> {
    const response = await api.get<ShipmentReport>(
      '/reports/shipments/data/',
      { params: filters }
    );
    return response.data;
  },

  /**
   * الحصول على بيانات تقرير المخازن (JSON)
   */
  async getWarehouseReportData(
    filters: ReportFilters
  ): Promise<WarehouseReport[]> {
    const response = await api.get<WarehouseReport[]>(
      '/reports/warehouses/data/',
      { params: filters }
    );
    return response.data;
  },

  /**
   * الحصول على بيانات الأداء (JSON)
   */
  async getPerformanceData(
    filters: ReportFilters
  ): Promise<any> {
    const response = await api.get('/reports/performance/data/', {
      params: filters,
    });
    return response.data;
  },

  // ==================== Export Functions ====================

  /**
   * تحميل ملف التقرير
   */
  downloadReport(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * إنشاء وتحميل تقرير الشحنات
   */
  async downloadShipmentReport(
    filters: ReportFilters,
    format: 'pdf' | 'excel' = 'pdf'
  ): Promise<void> {
    const blob = await this.generateShipmentReport(filters, format);
    const extension = format === 'pdf' ? 'pdf' : 'xlsx';
    const timestamp = new Date().toISOString().split('T')[0];
    this.downloadReport(blob, `shipments_report_${timestamp}.${extension}`);
  },

  /**
   * إنشاء وتحميل تقرير المخازن
   */
  async downloadWarehouseReport(
    filters: ReportFilters,
    format: 'pdf' | 'excel' = 'pdf'
  ): Promise<void> {
    const blob = await this.generateWarehouseReport(filters, format);
    const extension = format === 'pdf' ? 'pdf' : 'xlsx';
    const timestamp = new Date().toISOString().split('T')[0];
    this.downloadReport(blob, `warehouse_report_${timestamp}.${extension}`);
  },

  /**
   * إنشاء وتحميل تقرير الأداء
   */
  async downloadPerformanceReport(
    filters: ReportFilters,
    format: 'pdf' | 'excel' = 'pdf'
  ): Promise<void> {
    const blob = await this.generatePerformanceReport(filters, format);
    const extension = format === 'pdf' ? 'pdf' : 'xlsx';
    const timestamp = new Date().toISOString().split('T')[0];
    this.downloadReport(blob, `performance_report_${timestamp}.${extension}`);
  },

  // ==================== CSV Export ====================

  /**
   * تحويل البيانات إلى CSV
   */
  convertToCSV(data: any[], headers: string[]): string {
    const csvRows: string[] = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  },

  /**
   * تصدير البيانات كـ CSV
   */
  exportToCSV(data: any[], filename: string, headers: string[]): void {
    const csv = this.convertToCSV(data, headers);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadReport(blob, `${filename}.csv`);
  },

  /**
   * تصدير الشحنات كـ CSV
   */
  async exportShipmentsToCSV(filters: ReportFilters): Promise<void> {
    const response = await api.get('/shipments/', { params: filters });
    const shipments = response.data;
    
    const headers = [
      'id',
      'tracking_number',
      'status',
      'warehouse_name',
      'recipient_name',
      'recipient_address',
      'total_books',
      'created_at',
      'delivered_at',
    ];
    
    const timestamp = new Date().toISOString().split('T')[0];
    this.exportToCSV(shipments, `shipments_${timestamp}`, headers);
  },

  // ==================== Print Functions ====================

  /**
   * فتح نافذة الطباعة
   */
  printReport(htmlContent: string): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بفتح النوافذ المنبثقة');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>طباعة التقرير</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            direction: rtl;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
          }
          th {
            background-color: #f2f2f2;
          }
          @media print {
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <button onclick="window.print()">طباعة</button>
      </body>
      </html>
    `);
    printWindow.document.close();
  },

  // ==================== Scheduled Reports ====================

  /**
   * جدولة تقرير دوري
   */
  async scheduleReport(
    reportType: 'shipments' | 'warehouses' | 'performance',
    frequency: 'daily' | 'weekly' | 'monthly',
    recipients: string[],
    filters?: ReportFilters
  ): Promise<void> {
    await api.post('/reports/schedule/', {
      report_type: reportType,
      frequency,
      recipients,
      filters,
    });
  },

  /**
   * الحصول على التقارير المجدولة
   */
  async getScheduledReports(): Promise<any[]> {
    const response = await api.get('/reports/scheduled/');
    return response.data;
  },

  /**
   * حذف تقرير مجدول
   */
  async deleteScheduledReport(scheduleId: number): Promise<void> {
    await api.delete(`/reports/scheduled/${scheduleId}/`);
  },

  // ==================== Dashboard Summaries ====================

  /**
   * الحصول على ملخص لوحة التحكم
   */
  async getDashboardSummary(filters?: ReportFilters): Promise<{
    shipments: ShipmentReport;
    warehouses: WarehouseReport[];
    recent_activities: any[];
  }> {
    const response = await api.get('/reports/dashboard-summary/', {
      params: filters,
    });
    return response.data;
  },

  /**
   * الحصول على بيانات الرسم البياني
   */
  async getChartData(
    chartType: 'shipments_timeline' | 'books_by_subject' | 'warehouse_utilization',
    filters?: ReportFilters
  ): Promise<any> {
    const response = await api.get(`/reports/chart/${chartType}/`, {
      params: filters,
    });
    return response.data;
  },

  // ==================== UI Helpers ====================

  /**
   * تنسيق التاريخ للتقارير
   */
  formatReportDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  /**
   * تنسيق الأرقام بالفواصل
   */
  formatNumber(num: number): string {
    return num.toLocaleString('ar-IQ');
  },

  /**
   * تنسيق النسبة المئوية
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  },

  /**
   * الحصول على نطاق تاريخ محدد
   */
  getDateRange(
    preset: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month'
  ): { start_date: string; end_date: string } {
    const today = new Date();
    const start = new Date();
    const end = new Date();

    switch (preset) {
      case 'today':
        // Already set to today
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'last_7_days':
        start.setDate(today.getDate() - 7);
        break;
      case 'last_30_days':
        start.setDate(today.getDate() - 30);
        break;
      case 'this_month':
        start.setDate(1);
        break;
      case 'last_month':
        start.setMonth(today.getMonth() - 1);
        start.setDate(1);
        end.setDate(0); // Last day of previous month
        break;
    }

    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    };
  },

  /**
   * الحصول على اسم نطاق التاريخ بالعربية
   */
  getDateRangeLabel(preset: string): string {
    const labels: Record<string, string> = {
      today: 'اليوم',
      yesterday: 'أمس',
      last_7_days: 'آخر 7 أيام',
      last_30_days: 'آخر 30 يوم',
      this_month: 'هذا الشهر',
      last_month: 'الشهر الماضي',
    };
    return labels[preset] || preset;
  },

  // ==================== Analytics ====================

  /**
   * حساب معدل النمو
   */
  calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },

  /**
   * حساب المتوسط
   */
  calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  },

  /**
   * إيجاد القيمة الأكثر تكراراً
   */
  findMode(arr: any[]): any {
    const frequency: Record<string, number> = {};
    let maxFreq = 0;
    let mode: any;

    arr.forEach((item) => {
      const key = String(item);
      frequency[key] = (frequency[key] || 0) + 1;
      if (frequency[key] > maxFreq) {
        maxFreq = frequency[key];
        mode = item;
      }
    });

    return mode;
  },
};

export default reportService;
