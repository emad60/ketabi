/**
 * Axios Instance with Interceptors
 * يتضمن: JWT Token handling, Auto-refresh, Error handling
 */

import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/api';

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - إضافة JWT token تلقائياً
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // تجاهل إضافة token لطلبات login
    const isLoginRequest = config.url?.includes('/users/login/');
    
    if (!isLoginRequest) {
      const token = localStorage.getItem('access_token');
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - معالجة Token expired و Auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // تجاهل 401 إذا كان من صفحة تسجيل الدخول
    const isLoginRequest = originalRequest.url?.includes('/users/login/');
    
    // إذا كان الخطأ 401 (Unauthorized) والـ request لم يتم retry بعد وليس من صفحة Login
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // محاولة تجديد الـ Token
        const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        
        // حفظ Token الجديد
        localStorage.setItem('access_token', newAccessToken);
        
        // إعادة المحاولة مع Token الجديد
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        // فشل التجديد - تسجيل خروج المستخدم
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        // إعادة توجيه لصفحة Login
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function for handling API errors
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error
      const data = error.response.data;
      
      if (typeof data === 'string') {
        return data;
      }
      
      if (data.detail) {
        return data.detail;
      }
      
      if (data.message) {
        return data.message;
      }
      
      // Extract first error from field errors
      const firstError = Object.values(data)[0];
      if (Array.isArray(firstError) && firstError.length > 0) {
        return firstError[0];
      }
      
      return 'حدث خطأ في الخادم';
    } else if (error.request) {
      // Request made but no response
      return 'لا يمكن الاتصال بالخادم';
    }
  }
  
  return 'حدث خطأ غير متوقع';
};

export default api;
