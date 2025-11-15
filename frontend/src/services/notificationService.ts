/**
 * Notification Service
 * خدمة الإشعارات و Firebase Cloud Messaging
 */

import api from './api';
import { ENDPOINTS } from '../config/api';
import type { Notification, DeviceToken } from '../types';

// Firebase imports (يجب تثبيت firebase أولاً)
// import { initializeApp } from 'firebase/app';
// import { getMessaging, getToken, onMessage } from 'firebase/messaging';

export const notificationService = {
  // ==================== Device Registration ====================

  /**
   * تسجيل جهاز للحصول على إشعارات Push
   */
  async registerDevice(
    token: string,
    deviceType: 'web' | 'ios' | 'android' = 'web'
  ): Promise<DeviceToken> {
    const response = await api.post<DeviceToken>(
      ENDPOINTS.NOTIFICATIONS.REGISTER_DEVICE,
      {
        token,
        device_type: deviceType,
      }
    );
    return response.data;
  },

  /**
   * إلغاء تسجيل الجهاز
   */
  async unregisterDevice(token: string): Promise<void> {
    await api.post('/notifications/unregister-device/', { token });
  },

  /**
   * طلب إذن الإشعارات من المستخدم (للمتصفحات)
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('هذا المتصفح لا يدعم الإشعارات');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  },

  /**
   * التحقق من دعم الإشعارات
   */
  isNotificationSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  },

  // ==================== Firebase Cloud Messaging ====================

  /**
   * تهيئة Firebase و الحصول على Token
   * ملاحظة: يجب إعداد firebaseConfig في الـ environment
   */
  async initializeFirebase(): Promise<string | null> {
    try {
      // تحقق من الدعم
      if (!this.isNotificationSupported()) {
        console.warn('Push notifications are not supported');
        return null;
      }

      // طلب الإذن
      const permission = await this.requestNotificationPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return null;
      }

      // TODO: Uncomment when Firebase is configured
      /*
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };

      const app = initializeApp(firebaseConfig);
      const messaging = getMessaging(app);

      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });

      if (token) {
        // تسجيل التوكن في الـ Backend
        await this.registerDevice(token, 'web');
        return token;
      }
      */

      return null;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      return null;
    }
  },

  /**
   * الاستماع للإشعارات الواردة
   */
  onMessageReceived(callback: (payload: any) => void): void {
    // TODO: Uncomment when Firebase is configured
    /*
    const messaging = getMessaging();
    onMessage(messaging, (payload) => {
      console.log('Message received:', payload);
      callback(payload);
      
      // عرض الإشعار
      if (payload.notification) {
        new Notification(payload.notification.title || 'إشعار جديد', {
          body: payload.notification.body,
          icon: '/logo.png',
          badge: '/logo.png',
          data: payload.data,
        });
      }
    });
    */
  },

  // ==================== Notifications CRUD ====================

  /**
   * الحصول على قائمة الإشعارات
   */
  async getNotifications(filters?: {
    is_read?: boolean;
    notification_type?: string;
  }): Promise<Notification[]> {
    const response = await api.get<Notification[]>(
      ENDPOINTS.NOTIFICATIONS.LIST,
      { params: filters }
    );
    return response.data;
  },

  /**
   * الحصول على إشعار محدد
   */
  async getNotification(id: number): Promise<Notification> {
    const response = await api.get<Notification>(
      ENDPOINTS.NOTIFICATIONS.DETAIL(id)
    );
    return response.data;
  },

  /**
   * إنشاء إشعار جديد
   */
  async createNotification(
    data: Partial<Notification>
  ): Promise<Notification> {
    const response = await api.post<Notification>(
      ENDPOINTS.NOTIFICATIONS.CREATE,
      data
    );
    return response.data;
  },

  /**
   * تعليم الإشعار كمقروء
   */
  async markAsRead(id: number): Promise<Notification> {
    const response = await api.put<Notification>(
      ENDPOINTS.NOTIFICATIONS.MARK_READ(id)
    );
    return response.data;
  },

  /**
   * تعليم جميع الإشعارات كمقروءة
   */
  async markAllAsRead(): Promise<void> {
    await api.post('/notifications/mark-all-read/');
  },

  /**
   * حذف إشعار
   */
  async deleteNotification(id: number): Promise<void> {
    await api.delete(`/notifications/${id}/`);
  },

  /**
   * حذف جميع الإشعارات المقروءة
   */
  async deleteReadNotifications(): Promise<void> {
    await api.post('/notifications/delete-read/');
  },

  // ==================== Queries ====================

  /**
   * الحصول على الإشعارات غير المقروءة
   */
  async getUnreadNotifications(): Promise<Notification[]> {
    return this.getNotifications({ is_read: false });
  },

  /**
   * الحصول على عدد الإشعارات غير المقروءة
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ count: number }>(
      '/notifications/unread-count/'
    );
    return response.data.count;
  },

  /**
   * الحصول على الإشعارات الحديثة (آخر 24 ساعة)
   */
  async getRecentNotifications(): Promise<Notification[]> {
    const response = await api.get<Notification[]>(
      '/notifications/recent/'
    );
    return response.data;
  },

  // ==================== UI Helpers ====================

  /**
   * الحصول على أيقونة نوع الإشعار
   */
  getNotificationIcon(type: Notification['notification_type']): string {
    const icons = {
      info: '📢',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };
    return icons[type] || '📢';
  },

  /**
   * الحصول على لون نوع الإشعار
   */
  getNotificationColor(type: Notification['notification_type']): string {
    const colors = {
      info: 'blue',
      success: 'green',
      warning: 'yellow',
      error: 'red',
    };
    return colors[type] || 'gray';
  },

  /**
   * تنسيق وقت الإشعار
   */
  formatNotificationTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    
    return date.toLocaleDateString('ar-IQ');
  },

  // ==================== Real-time Updates ====================

  /**
   * الاشتراك في تحديثات الإشعارات (WebSocket أو Polling)
   */
  subscribeToNotifications(
    callback: (notification: Notification) => void,
    interval: number = 30000
  ): () => void {
    // Using polling approach (يمكن استبداله بـ WebSocket)
    const pollNotifications = async () => {
      try {
        const unread = await this.getUnreadNotifications();
        unread.forEach(callback);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    // Poll immediately
    pollNotifications();

    // Then poll at intervals
    const intervalId = setInterval(pollNotifications, interval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  },

  /**
   * عرض إشعار في المتصفح
   */
  showBrowserNotification(
    title: string,
    options?: NotificationOptions
  ): void {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        ...options,
      });
    }
  },
};

export default notificationService;
