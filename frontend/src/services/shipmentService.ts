/**
 * Shipment Service
 * خدمة إدارة الشحنات والتتبع
 */

import api from './api';
import { ENDPOINTS } from '../config/api';
import type {
  Shipment,
  CreateShipmentData,
  ShipmentFilters,
  PaginatedResponse,
} from '../types';

export const shipmentService = {
  // ==================== CRUD Operations ====================

  /**
   * الحصول على قائمة الشحنات مع فلاتر
   */
  async getShipments(filters?: ShipmentFilters): Promise<Shipment[]> {
    const response = await api.get<Shipment[]>(
      ENDPOINTS.SHIPMENTS.LIST,
      { params: filters }
    );
    return response.data;
  },

  /**
   * الحصول على شحنة محددة
   */
  async getShipment(id: number): Promise<Shipment> {
    const response = await api.get<Shipment>(
      ENDPOINTS.SHIPMENTS.DETAIL(id)
    );
    return response.data;
  },

  /**
   * إنشاء شحنة جديدة
   */
  async createShipment(data: CreateShipmentData): Promise<Shipment> {
    const response = await api.post<Shipment>(
      ENDPOINTS.SHIPMENTS.CREATE,
      data
    );
    return response.data;
  },

  /**
   * تحديث شحنة
   */
  async updateShipment(
    id: number,
    data: Partial<Shipment>
  ): Promise<Shipment> {
    const response = await api.put<Shipment>(
      ENDPOINTS.SHIPMENTS.UPDATE(id),
      data
    );
    return response.data;
  },

  /**
   * حذف شحنة
   */
  async deleteShipment(id: number): Promise<void> {
    await api.delete(ENDPOINTS.SHIPMENTS.DELETE(id));
  },

  // ==================== Tracking ====================

  /**
   * تتبع الشحنة في الوقت الفعلي
   */
  async getTracking(id: number): Promise<{
    shipment: Shipment;
    current_location: {
      latitude: number;
      longitude: number;
      timestamp: string;
    } | null;
    estimated_arrival: string;
    distance_remaining_km: number;
    route_history: Array<{
      latitude: number;
      longitude: number;
      timestamp: string;
    }>;
  }> {
    const response = await api.get(ENDPOINTS.SHIPMENTS.TRACKING(id));
    return response.data;
  },

  /**
   * الحصول على شحنات السائق الحالي
   */
  async getMyShipments(): Promise<Shipment[]> {
    const response = await api.get<Shipment[]>(
      ENDPOINTS.SHIPMENTS.MY_SHIPMENTS
    );
    return response.data;
  },

  // ==================== Driver Actions ====================

  /**
   * تحديث موقع GPS للشحنة
   */
  async updateLocation(
    shipmentId: number,
    latitude: number,
    longitude: number
  ): Promise<{
    success: boolean;
    message: string;
    location: {
      latitude: number;
      longitude: number;
      timestamp: string;
    };
  }> {
    const response = await api.post(
      ENDPOINTS.SHIPMENTS.UPDATE_LOCATION(shipmentId),
      { latitude, longitude }
    );
    return response.data;
  },

  /**
   * رفع صورة إثبات التسليم
   */
  async uploadProofPhoto(
    shipmentId: number,
    photo: File,
    photoType: 'delivery' | 'package' | 'recipient' = 'delivery'
  ): Promise<{
    success: boolean;
    photo_url: string;
    uploaded_at: string;
  }> {
    const formData = new FormData();
    formData.append('photo', photo);
    formData.append('photo_type', photoType);

    const response = await api.post(
      ENDPOINTS.SHIPMENTS.UPLOAD_PHOTO(shipmentId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * إرسال التوقيع الرقمي
   */
  async submitSignature(
    shipmentId: number,
    signatureData: string
  ): Promise<{
    success: boolean;
    signature_url: string;
    signed_at: string;
  }> {
    const response = await api.post(
      ENDPOINTS.SHIPMENTS.SIGNATURE(shipmentId),
      { signature: signatureData }
    );
    return response.data;
  },

  /**
   * مسح QR code للشحنة
   */
  async scanQR(
    shipmentId: number,
    qrCode: string
  ): Promise<{
    success: boolean;
    verified: boolean;
    shipment: Shipment;
    message: string;
  }> {
    const response = await api.post(
      ENDPOINTS.SHIPMENTS.SCAN_QR(shipmentId),
      { qr_code: qrCode }
    );
    return response.data;
  },

  /**
   * تأكيد التسليم
   */
  async confirmDelivery(
    shipmentId: number,
    data: {
      recipient_name: string;
      recipient_phone?: string;
      notes?: string;
      delivery_time?: string;
    }
  ): Promise<{
    success: boolean;
    shipment: Shipment;
    message: string;
  }> {
    const response = await api.post(
      ENDPOINTS.SHIPMENTS.CONFIRM_DELIVERY(shipmentId),
      data
    );
    return response.data;
  },

  // ==================== Status Management ====================

  /**
   * تغيير حالة الشحنة
   */
  async updateStatus(
    shipmentId: number,
    status: Shipment['status'],
    notes?: string
  ): Promise<Shipment> {
    const response = await api.put<Shipment>(
      ENDPOINTS.SHIPMENTS.UPDATE(shipmentId),
      { status, notes }
    );
    return response.data;
  },

  /**
   * بدء الشحنة (تغيير الحالة من preparing إلى in_transit)
   */
  async startShipment(shipmentId: number): Promise<Shipment> {
    return this.updateStatus(shipmentId, 'in_transit', 'تم بدء الشحنة');
  },

  /**
   * إلغاء الشحنة
   */
  async cancelShipment(
    shipmentId: number,
    reason: string
  ): Promise<Shipment> {
    return this.updateStatus(shipmentId, 'cancelled', reason);
  },

  // ==================== Filters & Search ====================

  /**
   * البحث في الشحنات
   */
  async searchShipments(query: string): Promise<Shipment[]> {
    const response = await api.get<Shipment[]>(
      ENDPOINTS.SHIPMENTS.LIST,
      {
        params: { search: query }
      }
    );
    return response.data;
  },

  /**
   * الحصول على شحنات حسب الحالة
   */
  async getShipmentsByStatus(
    status: Shipment['status']
  ): Promise<Shipment[]> {
    return this.getShipments({ status });
  },

  /**
   * الحصول على شحنات السائق
   */
  async getDriverShipments(driverId: number): Promise<Shipment[]> {
    return this.getShipments({ driver: driverId });
  },

  /**
   * الحصول على شحنات المستودع
   */
  async getWarehouseShipments(
    warehouseId: number,
    type: 'source' | 'destination' = 'source'
  ): Promise<Shipment[]> {
    const filters: ShipmentFilters = {};
    if (type === 'source') {
      filters.source_warehouse = warehouseId;
    } else {
      filters.destination_warehouse = warehouseId;
    }
    return this.getShipments(filters);
  },

  // ==================== Analytics ====================

  /**
   * حساب إجمالي الكتب في الشحنة
   */
  calculateTotalBooks(shipment: Shipment): number {
    return shipment.books.reduce((total, book) => total + book.quantity, 0);
  },

  /**
   * التحقق من تأخر الشحنة
   */
  isDelayed(shipment: Shipment): boolean {
    if (shipment.status === 'delivered' || shipment.status === 'cancelled') {
      return false;
    }

    const expectedDate = new Date(shipment.expected_delivery_date);
    const now = new Date();

    return now > expectedDate;
  },

  /**
   * حساب الوقت المتبقي للتسليم
   */
  getRemainingTime(shipment: Shipment): {
    days: number;
    hours: number;
    minutes: number;
    isDelayed: boolean;
  } {
    const expectedDate = new Date(shipment.expected_delivery_date);
    const now = new Date();
    
    const diff = expectedDate.getTime() - now.getTime();
    const isDelayed = diff < 0;
    const absDiff = Math.abs(diff);

    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, isDelayed };
  },

  /**
   * الحصول على لون الحالة للـ UI
   */
  getStatusColor(status: Shipment['status']): string {
    const colors = {
      preparing: 'blue',
      in_transit: 'yellow',
      delivered: 'green',
      cancelled: 'red',
    };
    return colors[status] || 'gray';
  },

  /**
   * الحصول على نص الحالة بالعربية
   */
  getStatusText(status: Shipment['status']): string {
    const texts = {
      preparing: 'قيد التجهيز',
      in_transit: 'في الطريق',
      delivered: 'تم التسليم',
      cancelled: 'ملغاة',
    };
    return texts[status] || status;
  },
};

export default shipmentService;
