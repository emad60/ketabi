/**
 * API Configuration
 * مركز إعدادات الاتصال بالـ Backend
 */

export const API_CONFIG = {
  // Base URL للـ Backend API
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  
  // WebSocket URL للتحديثات الفورية
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws',
  
  // Timeout للـ Requests (30 ثانية)
  TIMEOUT: 30000,
  
  // Retry configuration
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/users/login/',
    REFRESH: '/auth/refresh/',
    REGISTER: '/users/register/',
    LOGOUT: '/users/logout/',
  },

  // Users
  USERS: {
    LIST: '/users/',
    DETAIL: (id: number) => `/users/${id}/`,
    ME: '/users/me/',
  },

  // Books
  BOOKS: {
    LIST: '/books/',
    DETAIL: (id: number) => `/books/${id}/`,
    CREATE: '/books/',
    UPDATE: (id: number) => `/books/${id}/`,
    DELETE: (id: number) => `/books/${id}/`,
  },

  // Provinces & Schools
  PROVINCES: {
    LIST: '/provinces/',
    DETAIL: (id: number) => `/provinces/${id}/`,
  },
  SCHOOLS: {
    LIST: '/schools/',
    DETAIL: (id: number) => `/schools/${id}/`,
  },

  // Book Requests
  BOOK_REQUESTS: {
    LIST: '/book-requests/',
    DETAIL: (id: number) => `/book-requests/${id}/`,
    CREATE: '/book-requests/',
    UPDATE: (id: number) => `/book-requests/${id}/`,
    DELETE: (id: number) => `/book-requests/${id}/`,
  },

  // School Requests
  SCHOOL_REQUESTS: {
    LIST: '/school-requests/',
    DETAIL: (id: number) => `/school-requests/${id}/`,
    CREATE: '/school-requests/',
    UPDATE: (id: number) => `/school-requests/${id}/`,
  },

  // Warehouses
  WAREHOUSES: {
    MINISTRY: {
      LIST: '/warehouses/ministry/',
      CREATE: '/warehouses/ministry/',
      DETAIL: (id: number) => `/warehouses/ministry/${id}/`,
    },
    PROVINCE: {
      LIST: '/warehouses/province/',
      CREATE: '/warehouses/province/',
      DETAIL: (id: number) => `/warehouses/province/${id}/`,
    },
    STOCKS: {
      LIST: '/warehouses/stocks/',
      CREATE: '/warehouses/stocks/',
      DETAIL: (id: number) => `/warehouses/stocks/${id}/`,
    },
  },

  // Shipments
  SHIPMENTS: {
    LIST: '/warehouses/shipments/',
    CREATE: '/warehouses/shipments/',
    DETAIL: (id: number) => `/warehouses/shipments/${id}/`,
    UPDATE: (id: number) => `/warehouses/shipments/${id}/`,
    DELETE: (id: number) => `/warehouses/shipments/${id}/`,
    TRACKING: (id: number) => `/warehouses/shipments/${id}/tracking/`,
    MY_SHIPMENTS: '/warehouses/shipments/my-shipments/',
    
    // Driver Actions
    UPDATE_LOCATION: (id: number) => `/warehouses/shipments/${id}/update-location/`,
    UPLOAD_PHOTO: (id: number) => `/warehouses/shipments/${id}/upload-photo/`,
    UPLOAD_PROOF: (id: number) => `/warehouses/shipments/${id}/upload-photo/`, // Alias
    SIGNATURE: (id: number) => `/warehouses/shipments/${id}/signature/`,
    SUBMIT_SIGNATURE: (id: number) => `/warehouses/shipments/${id}/signature/`, // Alias
    SCAN_QR: (id: number) => `/warehouses/shipments/${id}/scan-qr/`,
    CONFIRM_DELIVERY: (id: number) => `/warehouses/shipments/${id}/confirm-delivery/`,
  },

  // Statistics
  STATISTICS: {
    MINISTRY: '/warehouses/stats/ministry/',
    PROVINCE: '/warehouses/stats/province/',
    WAREHOUSE: '/warehouses/stats/warehouse/',
    DRIVER: '/warehouses/stats/driver/',
  },

  // Reports
  REPORTS: {
    SHIPMENTS: '/warehouses/reports/shipments/',
    INVENTORY: '/warehouses/reports/inventory/',
    WAREHOUSES: '/warehouses/reports/warehouses/',
    PERFORMANCE: '/warehouses/reports/performance/',
    BOOKS: '/warehouses/reports/books/',
    PDF: '/warehouses/reports/pdf/',
    EXCEL: '/warehouses/reports/excel/',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications/',
    CREATE: '/notifications/',
    DETAIL: (id: number) => `/notifications/${id}/`,
    MARK_READ: (id: number) => `/notifications/${id}/mark-as-read/`,
    REGISTER_DEVICE: '/notifications/register-device/',
  },
};

export default API_CONFIG;
