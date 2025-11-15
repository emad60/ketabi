# 🔗 دليل ربط Frontend مع Backend - مشروع كتابي

## 📋 نظرة عامة

هذا الدليل الشامل لربط React/TypeScript Frontend مع Django REST Backend

---

## 🎯 بنية المشروع

### Backend (Django REST Framework)
- **URL**: `http://localhost:8000`
- **API Base**: `/api/`
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Total Endpoints**: 50+ API endpoints

### Frontend (React + TypeScript + Vite)
- **URL**: `http://localhost:3000`
- **Components**: 
  - LoginPage.tsx
  - MinistryDashboard.tsx
  - CapitalDashboard.tsx
  - ShipmentTracking.tsx
  - CreateBookRequest.tsx
  - etc.

---

## 🔐 نظام المصادقة (Authentication)

### 1. Login Flow

#### Backend Endpoint:
```
POST /api/auth/login/
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

#### Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "user@example.com",
    "email": "user@example.com",
    "role": "ministry_staff",
    "full_name": "أحمد محمد"
  }
}
```

#### Frontend Implementation (LoginPage.tsx):

```typescript
// src/services/authService.ts
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    full_name: string;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axios.post(`${API_URL}/auth/login/`, credentials);
    
    // حفظ Tokens في localStorage
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  },

  async refreshToken(): Promise<string> {
    const refresh = localStorage.getItem('refresh_token');
    const response = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
    
    localStorage.setItem('access_token', response.data.access);
    return response.data.access;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getToken(): string | null {
    return localStorage.getItem('access_token');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
```

#### Axios Interceptor (لإضافة Token تلقائياً):

```typescript
// src/services/api.ts
import axios from 'axios';
import { authService } from './authService';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// إضافة Token لكل request
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// معالجة Token expired
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await authService.refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        authService.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## 📊 Dashboard APIs

### 1. Ministry Dashboard (وزارة التربية)

#### Component: `MinistryDashboard.tsx`

#### Backend API:
```
GET /api/warehouses/statistics/ministry/
Authorization: Bearer {token}
```

#### Response Example:
```json
{
  "total_books": 150000,
  "total_shipments": 245,
  "pending_requests": 18,
  "active_drivers": 42,
  "warehouses": {
    "ministry": 1,
    "province": 18,
    "total_capacity": 500000
  },
  "shipments_by_status": {
    "preparing": 12,
    "in_transit": 28,
    "delivered": 205
  },
  "school_requests": {
    "total": 156,
    "pending": 18,
    "approved": 92,
    "fulfilled": 46
  },
  "recent_activity": [
    {
      "type": "shipment_created",
      "message": "شحنة جديدة إلى محافظة بغداد",
      "timestamp": "2025-11-15T10:30:00Z"
    }
  ]
}
```

#### Frontend Implementation:

```typescript
// src/services/statisticsService.ts
import api from './api';

export interface MinistryStats {
  total_books: number;
  total_shipments: number;
  pending_requests: number;
  active_drivers: number;
  warehouses: {
    ministry: number;
    province: number;
    total_capacity: number;
  };
  shipments_by_status: {
    preparing: number;
    in_transit: number;
    delivered: number;
  };
  school_requests: {
    total: number;
    pending: number;
    approved: number;
    fulfilled: number;
  };
}

export const statisticsService = {
  async getMinistryStats(): Promise<MinistryStats> {
    const response = await api.get('/warehouses/statistics/ministry/');
    return response.data;
  },

  async getProvinceStats(provinceId: number) {
    const response = await api.get('/warehouses/statistics/province/', {
      params: { province_id: provinceId }
    });
    return response.data;
  },

  async getWarehouseStats(warehouseId: number) {
    const response = await api.get('/warehouses/statistics/warehouse/', {
      params: { warehouse_id: warehouseId }
    });
    return response.data;
  },

  async getDriverStats(driverId: number) {
    const response = await api.get('/warehouses/statistics/driver/', {
      params: { driver_id: driverId }
    });
    return response.data;
  }
};
```

#### Component Usage:

```typescript
// src/components/MinistryDashboard.tsx
import React, { useState, useEffect } from 'react';
import { statisticsService, MinistryStats } from '../services/statisticsService';
import { Card } from './ui/card';
import { Loader2 } from 'lucide-react';

export const MinistryDashboard: React.FC = () => {
  const [stats, setStats] = useState<MinistryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await statisticsService.getMinistryStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold">لوحة تحكم الوزارة</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <h3 className="text-sm text-gray-600">إجمالي الكتب</h3>
          <p className="text-3xl font-bold mt-2">
            {stats?.total_books.toLocaleString('ar-IQ')}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm text-gray-600">الشحنات</h3>
          <p className="text-3xl font-bold mt-2">
            {stats?.total_shipments}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm text-gray-600">الطلبات المعلقة</h3>
          <p className="text-3xl font-bold mt-2 text-yellow-600">
            {stats?.pending_requests}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm text-gray-600">السائقون النشطون</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">
            {stats?.active_drivers}
          </p>
        </Card>
      </div>

      {/* Shipments by Status */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">حالة الشحنات</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">قيد التجهيز</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats?.shipments_by_status.preparing}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">في الطريق</p>
            <p className="text-2xl font-bold text-yellow-600">
              {stats?.shipments_by_status.in_transit}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">تم التسليم</p>
            <p className="text-2xl font-bold text-green-600">
              {stats?.shipments_by_status.delivered}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
```

---

### 2. Capital (Province) Dashboard

#### Component: `CapitalDashboard.tsx`

```typescript
// src/components/CapitalDashboard.tsx
import React, { useState, useEffect } from 'react';
import { statisticsService } from '../services/statisticsService';
import { authService } from '../services/authService';

export const CapitalDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const user = authService.getUser();

  useEffect(() => {
    if (user?.province_id) {
      loadProvinceStats();
    }
  }, [user]);

  const loadProvinceStats = async () => {
    const data = await statisticsService.getProvinceStats(user.province_id);
    setStats(data);
  };

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-3xl font-bold">
        لوحة تحكم محافظة {user?.province_name}
      </h1>
      {/* Similar cards structure */}
    </div>
  );
};
```

---

## 📦 إدارة المستودعات (Warehouse Management)

### 1. Ministry Warehouse Management

#### Component: `MinistryWarehouseManagement.tsx`

#### Backend APIs:

```typescript
// List Ministry Warehouses
GET /api/warehouses/ministry/

// Create Ministry Warehouse
POST /api/warehouses/ministry/
{
  "name": "مستودع الوزارة المركزي",
  "location": "بغداد - الكرادة",
  "capacity": 100000,
  "current_stock": 0
}

// Get Warehouse Stocks
GET /api/warehouses/stocks/?warehouse_id=1

// Add Stock
POST /api/warehouses/stocks/
{
  "warehouse": 1,
  "book": 5,
  "quantity": 1000,
  "expiry_date": "2026-12-31"
}
```

#### Frontend Service:

```typescript
// src/services/warehouseService.ts
import api from './api';

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  capacity: number;
  current_stock: number;
  warehouse_type: 'ministry' | 'province';
  province?: number;
  created_at: string;
}

export interface Stock {
  id: number;
  warehouse: number;
  book: number;
  book_details: {
    title: string;
    subject: string;
    grade: string;
  };
  quantity: number;
  expiry_date?: string;
}

export const warehouseService = {
  // Ministry Warehouses
  async getMinistryWarehouses(): Promise<Warehouse[]> {
    const response = await api.get('/warehouses/ministry/');
    return response.data;
  },

  async createMinistryWarehouse(data: Partial<Warehouse>): Promise<Warehouse> {
    const response = await api.post('/warehouses/ministry/', data);
    return response.data;
  },

  // Province Warehouses
  async getProvinceWarehouses(provinceId?: number): Promise<Warehouse[]> {
    const response = await api.get('/warehouses/province/', {
      params: provinceId ? { province: provinceId } : {}
    });
    return response.data;
  },

  async createProvinceWarehouse(data: Partial<Warehouse>): Promise<Warehouse> {
    const response = await api.post('/warehouses/province/', data);
    return response.data;
  },

  // Stocks
  async getWarehouseStocks(warehouseId: number): Promise<Stock[]> {
    const response = await api.get('/warehouses/stocks/', {
      params: { warehouse_id: warehouseId }
    });
    return response.data;
  },

  async addStock(data: Partial<Stock>): Promise<Stock> {
    const response = await api.post('/warehouses/stocks/', data);
    return response.data;
  },

  async updateStock(id: number, data: Partial<Stock>): Promise<Stock> {
    const response = await api.put(`/warehouses/stocks/${id}/`, data);
    return response.data;
  }
};
```

---

## 🚚 إدارة الشحنات (Shipment Management)

### Component: `ShipmentManagement.tsx`

#### Backend APIs:

```typescript
// List Shipments
GET /api/warehouses/shipments/
  ?status=in_transit
  &driver=5
  &destination_warehouse=3

// Create Shipment
POST /api/warehouses/shipments/
{
  "source_warehouse": 1,
  "destination_warehouse": 3,
  "driver": 5,
  "books": [
    {"book_id": 10, "quantity": 500},
    {"book_id": 15, "quantity": 300}
  ],
  "expected_delivery_date": "2025-11-20",
  "notes": "شحنة عاجلة"
}

// Update Shipment
PUT /api/warehouses/shipments/123/
{
  "status": "delivered",
  "actual_delivery_date": "2025-11-15T14:30:00Z"
}
```

#### Frontend Service:

```typescript
// src/services/shipmentService.ts
import api from './api';

export interface Shipment {
  id: number;
  tracking_number: string;
  source_warehouse: number;
  source_warehouse_name: string;
  destination_warehouse: number;
  destination_warehouse_name: string;
  driver: number;
  driver_name: string;
  status: 'preparing' | 'in_transit' | 'delivered' | 'cancelled';
  total_books: number;
  expected_delivery_date: string;
  actual_delivery_date?: string;
  created_at: string;
  qr_code?: string;
}

export interface ShipmentBook {
  book_id: number;
  quantity: number;
}

export interface CreateShipmentData {
  source_warehouse: number;
  destination_warehouse: number;
  driver: number;
  books: ShipmentBook[];
  expected_delivery_date: string;
  notes?: string;
}

export const shipmentService = {
  async getShipments(filters?: {
    status?: string;
    driver?: number;
    destination_warehouse?: number;
  }): Promise<Shipment[]> {
    const response = await api.get('/warehouses/shipments/', { params: filters });
    return response.data;
  },

  async getShipment(id: number): Promise<Shipment> {
    const response = await api.get(`/warehouses/shipments/${id}/`);
    return response.data;
  },

  async createShipment(data: CreateShipmentData): Promise<Shipment> {
    const response = await api.post('/warehouses/shipments/', data);
    return response.data;
  },

  async updateShipment(id: number, data: Partial<Shipment>): Promise<Shipment> {
    const response = await api.put(`/warehouses/shipments/${id}/`, data);
    return response.data;
  },

  async deleteShipment(id: number): Promise<void> {
    await api.delete(`/warehouses/shipments/${id}/`);
  },

  // Tracking
  async getTracking(id: number) {
    const response = await api.get(`/warehouses/shipments/${id}/tracking/`);
    return response.data;
  },

  // Driver's shipments
  async getMyShipments(): Promise<Shipment[]> {
    const response = await api.get('/warehouses/shipments/my-shipments/');
    return response.data;
  }
};
```

---

## 📱 Mobile APIs (للسائقين)

### Real-time Location Updates

```typescript
// src/services/driverService.ts
import api from './api';

export const driverService = {
  // Update GPS Location
  async updateLocation(shipmentId: number, latitude: number, longitude: number) {
    const response = await api.post(
      `/warehouses/shipments/${shipmentId}/update-location/`,
      { latitude, longitude }
    );
    return response.data;
  },

  // Upload Proof Photo
  async uploadProofPhoto(shipmentId: number, photo: File) {
    const formData = new FormData();
    formData.append('photo', photo);

    const response = await api.post(
      `/warehouses/shipments/${shipmentId}/upload-photo/`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  },

  // Digital Signature
  async submitSignature(shipmentId: number, signatureData: string) {
    const response = await api.post(
      `/warehouses/shipments/${shipmentId}/signature/`,
      { signature: signatureData }
    );
    return response.data;
  },

  // Scan QR Code
  async scanQR(shipmentId: number, qrCode: string) {
    const response = await api.post(
      `/warehouses/shipments/${shipmentId}/scan-qr/`,
      { qr_code: qrCode }
    );
    return response.data;
  },

  // Confirm Delivery
  async confirmDelivery(shipmentId: number, data: {
    recipient_name: string;
    recipient_phone?: string;
    notes?: string;
  }) {
    const response = await api.post(
      `/warehouses/shipments/${shipmentId}/confirm-delivery/`,
      data
    );
    return response.data;
  }
};
```

---

## 📝 طلبات الكتب (Book Requests)

### Component: `CreateBookRequest.tsx`

#### Backend API:

```typescript
POST /api/book-requests/
{
  "stage": "submitted",
  "subject": "الرياضيات",
  "quantity": 1000,
  "created_by": 5
}

GET /api/book-requests/
GET /api/book-requests/123/
PUT /api/book-requests/123/
DELETE /api/book-requests/123/
```

#### Frontend Service:

```typescript
// src/services/bookRequestService.ts
import api from './api';

export interface BookRequest {
  id: number;
  stage: 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed';
  subject: string;
  quantity: number;
  created_by: number;
  created_by_username: string;
  assigned_to?: number;
  assigned_to_username?: string;
  reason_rejected?: string;
  created_at: string;
  updated_at: string;
}

export const bookRequestService = {
  async getBookRequests(filters?: {
    stage?: string;
    created_by?: number;
  }): Promise<BookRequest[]> {
    const response = await api.get('/book-requests/', { params: filters });
    return response.data;
  },

  async createBookRequest(data: Partial<BookRequest>): Promise<BookRequest> {
    const response = await api.post('/book-requests/', data);
    return response.data;
  },

  async updateBookRequest(id: number, data: Partial<BookRequest>): Promise<BookRequest> {
    const response = await api.put(`/book-requests/${id}/`, data);
    return response.data;
  },

  async deleteBookRequest(id: number): Promise<void> {
    await api.delete(`/book-requests/${id}/`);
  }
};
```

---

## 🔔 Push Notifications

### Frontend Integration with Firebase Cloud Messaging (FCM)

```typescript
// src/services/notificationService.ts
import api from './api';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "ketabi-7cc0f.firebaseapp.com",
  projectId: "ketabi-7cc0f",
  storageBucket: "ketabi-7cc0f.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const notificationService = {
  // Register Device Token
  async registerDevice() {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: 'YOUR_VAPID_KEY'
        });

        // Send token to backend
        await api.post('/notifications/register-device/', {
          token,
          device_type: 'web'
        });

        return token;
      }
    } catch (error) {
      console.error('Failed to register device:', error);
    }
  },

  // Listen for messages
  onMessageReceived(callback: (payload: any) => void) {
    onMessage(messaging, (payload) => {
      callback(payload);
    });
  },

  // Get notifications
  async getNotifications(filters?: {
    is_read?: boolean;
  }) {
    const response = await api.get('/notifications/', { params: filters });
    return response.data;
  },

  // Mark as read
  async markAsRead(id: number) {
    const response = await api.put(`/notifications/${id}/mark-as-read/`);
    return response.data;
  }
};
```

---

## 📈 Reports & Analytics

```typescript
// src/services/reportService.ts
import api from './api';

export const reportService = {
  // Generate Shipment Report
  async generateShipmentReport(filters: {
    start_date: string;
    end_date: string;
    status?: string;
    format?: 'pdf' | 'excel';
  }) {
    const response = await api.post('/warehouses/reports/shipments/', filters, {
      responseType: 'blob'
    });
    
    // Download file
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `shipments_report.${filters.format || 'pdf'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Generate Inventory Report
  async generateInventoryReport(filters: {
    warehouse_id?: number;
    format?: 'pdf' | 'excel';
  }) {
    const response = await api.post('/warehouses/reports/inventory/', filters, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventory_report.${filters.format || 'pdf'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
```

---

## 🎨 Environment Configuration

### Create `.env` file in frontend:

```bash
# Frontend .env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_PROJECT_ID=ketabi-7cc0f
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY
```

### Update API configuration:

```typescript
// src/config/api.ts
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws',
  TIMEOUT: 30000,
};
```

---

## 🔧 Next Steps

### 1. Install Required Packages:

```bash
cd frontend

# Core dependencies
npm install axios
npm install react-router-dom
npm install @tanstack/react-query

# Firebase for push notifications
npm install firebase

# Form handling
npm install react-hook-form
npm install zod @hookform/resolvers

# Date handling
npm install date-fns

# Icons
npm install lucide-react

# State management (optional)
npm install zustand
```

### 2. Create Folder Structure:

```
src/
├── services/
│   ├── api.ts
│   ├── authService.ts
│   ├── statisticsService.ts
│   ├── warehouseService.ts
│   ├── shipmentService.ts
│   ├── bookRequestService.ts
│   ├── notificationService.ts
│   ├── driverService.ts
│   └── reportService.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useStatistics.ts
│   └── useNotifications.ts
├── contexts/
│   ├── AuthContext.tsx
│   └── LanguageContext.tsx
├── types/
│   ├── auth.ts
│   ├── warehouse.ts
│   ├── shipment.ts
│   └── index.ts
└── utils/
    ├── formatters.ts
    └── validators.ts
```

### 3. Enable CORS in Backend:

Already configured in `backend/core/settings.py`:
```python
INSTALLED_APPS = [
    'corsheaders',
    # ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

---

## ✅ Testing Checklist

- [ ] Login/Logout flow
- [ ] JWT Token refresh
- [ ] Dashboard statistics loading
- [ ] Warehouse CRUD operations
- [ ] Shipment tracking
- [ ] Book request creation
- [ ] Mobile driver functions
- [ ] Push notifications
- [ ] Report generation
- [ ] Error handling
- [ ] Loading states
- [ ] Arabic RTL support

---

## 🚀 Ready to Start!

الـ Backend جاهز 100% مع 50+ API endpoint
كل ما تحتاجه هو استيراد الـ services وربطها مع الـ Components الموجودة!

**Next**: هل تريد مني إنشاء أي من الـ services أعلاه بشكل كامل؟
