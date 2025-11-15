/**
 * Book Request Service
 * خدمة إدارة طلبات الكتب
 */

import api from './api';
import { ENDPOINTS } from '../config/api';
import type {
  BookRequest,
  BookRequestFilters,
  PaginatedResponse,
} from '../types';

export const bookRequestService = {
  // ==================== CRUD Operations ====================

  /**
   * الحصول على قائمة طلبات الكتب
   */
  async getBookRequests(
    filters?: BookRequestFilters
  ): Promise<BookRequest[]> {
    const response = await api.get<BookRequest[]>(
      ENDPOINTS.BOOK_REQUESTS.LIST,
      { params: filters }
    );
    return response.data;
  },

  /**
   * الحصول على طلب كتب محدد
   */
  async getBookRequest(id: number): Promise<BookRequest> {
    const response = await api.get<BookRequest>(
      ENDPOINTS.BOOK_REQUESTS.DETAIL(id)
    );
    return response.data;
  },

  /**
   * إنشاء طلب كتب جديد
   */
  async createBookRequest(
    data: Partial<BookRequest>
  ): Promise<BookRequest> {
    const response = await api.post<BookRequest>(
      ENDPOINTS.BOOK_REQUESTS.CREATE,
      data
    );
    return response.data;
  },

  /**
   * تحديث طلب كتب
   */
  async updateBookRequest(
    id: number,
    data: Partial<BookRequest>
  ): Promise<BookRequest> {
    const response = await api.put<BookRequest>(
      ENDPOINTS.BOOK_REQUESTS.UPDATE(id),
      data
    );
    return response.data;
  },

  /**
   * حذف طلب كتب
   */
  async deleteBookRequest(id: number): Promise<void> {
    await api.delete(ENDPOINTS.BOOK_REQUESTS.DELETE(id));
  },

  // ==================== Workflow Actions ====================

  /**
   * تقديم الطلب (تغيير من draft إلى submitted)
   */
  async submitRequest(id: number): Promise<BookRequest> {
    return this.updateBookRequest(id, {
      stage: 'submitted',
    });
  },

  /**
   * الموافقة على الطلب
   */
  async approveRequest(
    id: number,
    assignedTo?: number
  ): Promise<BookRequest> {
    return this.updateBookRequest(id, {
      stage: 'approved',
      assigned_to: assignedTo,
    });
  },

  /**
   * رفض الطلب
   */
  async rejectRequest(
    id: number,
    reason: string
  ): Promise<BookRequest> {
    return this.updateBookRequest(id, {
      stage: 'rejected',
      reason_rejected: reason,
    });
  },

  /**
   * تحديد الطلب كمكتمل
   */
  async completeRequest(id: number): Promise<BookRequest> {
    return this.updateBookRequest(id, {
      stage: 'completed',
    });
  },

  // ==================== Filters & Search ====================

  /**
   * البحث في طلبات الكتب
   */
  async searchBookRequests(query: string): Promise<BookRequest[]> {
    const response = await api.get<BookRequest[]>(
      ENDPOINTS.BOOK_REQUESTS.LIST,
      {
        params: { search: query }
      }
    );
    return response.data;
  },

  /**
   * الحصول على طلبات حسب المرحلة
   */
  async getRequestsByStage(
    stage: BookRequest['stage']
  ): Promise<BookRequest[]> {
    return this.getBookRequests({ stage });
  },

  /**
   * الحصول على طلبات المستخدم الحالي
   */
  async getMyRequests(): Promise<BookRequest[]> {
    const response = await api.get<BookRequest[]>(
      '/book-requests/my-requests/'
    );
    return response.data;
  },

  /**
   * الحصول على الطلبات المعينة للمستخدم
   */
  async getAssignedRequests(userId: number): Promise<BookRequest[]> {
    return this.getBookRequests({ assigned_to: userId });
  },

  /**
   * الحصول على الطلبات المعلقة
   */
  async getPendingRequests(): Promise<BookRequest[]> {
    return this.getRequestsByStage('submitted');
  },

  // ==================== Analytics ====================

  /**
   * الحصول على إحصائيات الطلبات
   */
  async getRequestsStatistics(): Promise<{
    total: number;
    by_stage: {
      draft: number;
      submitted: number;
      approved: number;
      rejected: number;
      completed: number;
    };
    total_quantity: number;
    by_subject: Array<{
      subject: string;
      count: number;
      total_quantity: number;
    }>;
  }> {
    const response = await api.get('/book-requests/statistics/');
    return response.data;
  },

  /**
   * الحصول على لون المرحلة للـ UI
   */
  getStageColor(stage: BookRequest['stage']): string {
    const colors = {
      draft: 'gray',
      submitted: 'blue',
      approved: 'green',
      rejected: 'red',
      completed: 'purple',
    };
    return colors[stage] || 'gray';
  },

  /**
   * الحصول على نص المرحلة بالعربية
   */
  getStageText(stage: BookRequest['stage']): string {
    const texts = {
      draft: 'مسودة',
      submitted: 'مقدم',
      approved: 'موافق عليه',
      rejected: 'مرفوض',
      completed: 'مكتمل',
    };
    return texts[stage] || stage;
  },

  /**
   * التحقق من إمكانية تعديل الطلب
   */
  canEdit(request: BookRequest): boolean {
    return request.stage === 'draft' || request.stage === 'submitted';
  },

  /**
   * التحقق من إمكانية حذف الطلب
   */
  canDelete(request: BookRequest): boolean {
    return request.stage === 'draft';
  },

  /**
   * التحقق من إمكانية الموافقة على الطلب
   */
  canApprove(request: BookRequest): boolean {
    return request.stage === 'submitted';
  },

  /**
   * التحقق من إمكانية رفض الطلب
   */
  canReject(request: BookRequest): boolean {
    return request.stage === 'submitted';
  },
};

export default bookRequestService;
