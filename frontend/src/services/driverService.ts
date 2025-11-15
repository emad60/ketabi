/**
 * Driver Service
 * خدمة السائقين و عمليات التوصيل المحمولة
 */

import api from './api';
import { ENDPOINTS } from '../config/api';
import type { Shipment } from '../types';

export const driverService = {
  // ==================== GPS & Location ====================

  /**
   * الحصول على الموقع الحالي للجهاز
   */
  async getCurrentLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
  },

  /**
   * مراقبة الموقع بشكل مستمر
   */
  watchLocation(
    callback: (position: GeolocationPosition) => void,
    errorCallback?: (error: GeolocationPositionError) => void
  ): number {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported');
    }

    return navigator.geolocation.watchPosition(callback, errorCallback, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    });
  },

  /**
   * إيقاف مراقبة الموقع
   */
  clearWatch(watchId: number): void {
    navigator.geolocation.clearWatch(watchId);
  },

  /**
   * تحديث موقع السائق في الشحنة
   */
  async updateShipmentLocation(
    shipmentId: number,
    latitude: number,
    longitude: number
  ): Promise<Shipment> {
    const response = await api.post<Shipment>(
      ENDPOINTS.SHIPMENTS.UPDATE_LOCATION(shipmentId),
      {
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      }
    );
    return response.data;
  },

  /**
   * إرسال الموقع الحالي للشحنة
   */
  async sendCurrentLocation(shipmentId: number): Promise<Shipment> {
    const position = await this.getCurrentLocation();
    return this.updateShipmentLocation(
      shipmentId,
      position.coords.latitude,
      position.coords.longitude
    );
  },

  /**
   * حساب المسافة بين نقطتين (بالكيلومتر)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  },

  // ==================== Photo & Camera ====================

  /**
   * التقاط صورة من الكاميرا
   */
  async capturePhoto(): Promise<File> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // استخدام الكاميرا الخلفية

      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          resolve(file);
        } else {
          reject(new Error('No file selected'));
        }
      };

      input.click();
    });
  },

  /**
   * ضغط الصورة قبل الرفع
   */
  async compressImage(
    file: File,
    maxWidth: number = 1024,
    maxHeight: number = 1024,
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // حساب الأبعاد الجديدة
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            file.type,
            quality
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  },

  /**
   * رفع صورة إثبات التسليم
   */
  async uploadProofPhoto(
    shipmentId: number,
    photo: File | Blob
  ): Promise<Shipment> {
    const formData = new FormData();
    formData.append('proof_photo', photo, 'proof.jpg');

    const response = await api.post<Shipment>(
      ENDPOINTS.SHIPMENTS.UPLOAD_PROOF(shipmentId),
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
   * التقاط ورفع صورة إثبات
   */
  async captureAndUploadProof(shipmentId: number): Promise<Shipment> {
    const photo = await this.capturePhoto();
    const compressed = await this.compressImage(photo);
    return this.uploadProofPhoto(shipmentId, compressed);
  },

  // ==================== Signature ====================

  /**
   * تحويل canvas إلى Blob
   */
  async canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string = 'image/png'
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        type
      );
    });
  },

  /**
   * رفع توقيع المستلم
   */
  async uploadSignature(
    shipmentId: number,
    signature: Blob
  ): Promise<Shipment> {
    const formData = new FormData();
    formData.append('signature', signature, 'signature.png');

    const response = await api.post<Shipment>(
      ENDPOINTS.SHIPMENTS.SUBMIT_SIGNATURE(shipmentId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // ==================== QR Code ====================

  /**
   * فتح الكاميرا لمسح QR
   */
  async scanQRCode(shipmentId: number, qrData: string): Promise<Shipment> {
    const response = await api.post<Shipment>(
      ENDPOINTS.SHIPMENTS.SCAN_QR(shipmentId),
      { qr_code: qrData }
    );
    return response.data;
  },

  /**
   * التحقق من صحة QR Code
   */
  validateQRCode(qrData: string, expectedShipmentId: number): boolean {
    try {
      const data = JSON.parse(qrData);
      return data.shipment_id === expectedShipmentId;
    } catch {
      return false;
    }
  },

  // ==================== Delivery Actions ====================

  /**
   * تأكيد التسليم
   */
  async confirmDelivery(
    shipmentId: number,
    deliveryData: {
      recipient_name?: string;
      recipient_phone?: string;
      delivery_notes?: string;
    }
  ): Promise<Shipment> {
    const response = await api.post<Shipment>(
      ENDPOINTS.SHIPMENTS.CONFIRM_DELIVERY(shipmentId),
      deliveryData
    );
    return response.data;
  },

  /**
   * بدء الشحنة (السائق في الطريق)
   */
  async startDelivery(shipmentId: number): Promise<Shipment> {
    const response = await api.post<Shipment>(
      `/shipments/${shipmentId}/start/`
    );
    return response.data;
  },

  /**
   * الإبلاغ عن مشكلة في التسليم
   */
  async reportDeliveryIssue(
    shipmentId: number,
    issueData: {
      issue_type: 'address_not_found' | 'recipient_unavailable' | 'refused' | 'other';
      description: string;
      photo?: File;
    }
  ): Promise<void> {
    const formData = new FormData();
    formData.append('issue_type', issueData.issue_type);
    formData.append('description', issueData.description);
    if (issueData.photo) {
      formData.append('photo', issueData.photo);
    }

    await api.post(`/shipments/${shipmentId}/report-issue/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // ==================== Driver Queries ====================

  /**
   * الحصول على شحنات السائق
   */
  async getMyShipments(filters?: {
    status?: string;
    date?: string;
  }): Promise<Shipment[]> {
    const response = await api.get<Shipment[]>('/shipments/my-shipments/', {
      params: filters,
    });
    return response.data;
  },

  /**
   * الحصول على شحنات اليوم
   */
  async getTodayShipments(): Promise<Shipment[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getMyShipments({ date: today });
  },

  /**
   * الحصول على الشحنات النشطة (في الطريق)
   */
  async getActiveShipments(): Promise<Shipment[]> {
    return this.getMyShipments({ status: 'in_transit' });
  },

  // ==================== UI Helpers ====================

  /**
   * الحصول على نص حالة الشحنة بالعربية
   */
  getDeliveryStatusText(status: string): string {
    const statusTexts: Record<string, string> = {
      pending: 'قيد الانتظار',
      in_transit: 'في الطريق',
      delivered: 'تم التسليم',
      failed: 'فشل التسليم',
      cancelled: 'ملغي',
    };
    return statusTexts[status] || status;
  },

  /**
   * الحصول على نص نوع المشكلة بالعربية
   */
  getIssueTypeText(issueType: string): string {
    const issueTexts: Record<string, string> = {
      address_not_found: 'العنوان غير موجود',
      recipient_unavailable: 'المستلم غير متوفر',
      refused: 'رفض الاستلام',
      other: 'مشكلة أخرى',
    };
    return issueTexts[issueType] || issueType;
  },

  /**
   * التحقق من دعم الموقع الجغرافي
   */
  isGeolocationSupported(): boolean {
    return 'geolocation' in navigator;
  },

  /**
   * التحقق من دعم الكاميرا
   */
  isCameraSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
  },

  // ==================== Offline Support ====================

  /**
   * حفظ البيانات محلياً للعمل Offline
   */
  saveOfflineData(key: string, data: any): void {
    localStorage.setItem(`driver_offline_${key}`, JSON.stringify(data));
  },

  /**
   * استرجاع البيانات المحلية
   */
  getOfflineData<T>(key: string): T | null {
    const data = localStorage.getItem(`driver_offline_${key}`);
    return data ? JSON.parse(data) : null;
  },

  /**
   * حذف البيانات المحلية
   */
  clearOfflineData(key: string): void {
    localStorage.removeItem(`driver_offline_${key}`);
  },

  /**
   * التحقق من الاتصال بالإنترنت
   */
  isOnline(): boolean {
    return navigator.onLine;
  },

  /**
   * مزامنة البيانات المحلية مع السيرفر
   */
  async syncOfflineData(): Promise<void> {
    if (!this.isOnline()) {
      throw new Error('No internet connection');
    }

    // Get pending location updates
    const pendingLocations = this.getOfflineData<any[]>('pending_locations') || [];
    
    for (const update of pendingLocations) {
      try {
        await this.updateShipmentLocation(
          update.shipmentId,
          update.latitude,
          update.longitude
        );
      } catch (error) {
        console.error('Failed to sync location:', error);
      }
    }

    // Clear synced data
    this.clearOfflineData('pending_locations');
  },
};

export default driverService;
