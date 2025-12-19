/**
 * Advanced API Service Class
 * خدمة شاملة لجميع عمليات النظام
 * تتضمن: Province Requests, School Requests, Shipments, Inventory, etc.
 */

import api from './api';

export interface SchoolRequest {
  id: number;
  school_name: string;
  principal_name: string;
  phone: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  items: Array<{
    book_id: number;
    book_title: string;
    quantity_requested: number;
    quantity_approved: number;
  }>;
  notes: string;
  created_at: string;
}

export interface ProvinceRequest {
  id: number;
  request_number: string;
  province_name: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  rejection_reason?: string;
  items: Array<{
    id: number;
    book: number | null;
    book_title: string;
    subject?: string;
    grade?: string;
    quantity: number;
    approved_quantity: number;
    created_at: string;
  }>;
  total_quantity: number;
  items_count: number;
  created_by: number;
  created_by_name: string;
  reviewed_by?: number;
  reviewed_by_name?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
}

interface Shipment {
  id: number;
  shipment_number: string;
  status: string;
  destination: string;
  courier: string;
  items: Array<any>;
  created_at: string;
}

interface ProvinceStats {
  total_schools: number;
  pending_school_requests: number;
  approved_school_requests: number;
  incoming_shipments: number;
  outgoing_shipments: number;
  current_inventory: number;
  low_stock_items: number;
  active_couriers: number;
  recent_alerts: Array<any>;
  school_requests: Array<any>;
}

interface MinistryStats {
  total_provinces: number;
  active_requests: number;
  pending_shipments: number;
  delivered_shipments: number;
  total_books_distributed: number;
  warehouse_stock: number;
  active_couriers: number;
  recent_alerts: Array<any>;
  province_stats: Array<any>;
}

class ApiService {
  // Province Requests
  async getProvinceRequests(filters?: any): Promise<ProvinceRequest[]> {
    const response = await api.get('/book-requests/province/', { params: filters });
    return response.data.results || response.data;
  }

  async getProvinceRequest(id: number): Promise<ProvinceRequest> {
    const response = await api.get(`/book-requests/province/${id}/`);
    return response.data;
  }

  async approveProvinceRequest(
    id: number,
    data: any
  ): Promise<ProvinceRequest> {
    const response = await api.post(`/book-requests/province/${id}/approve-reject/`, data);
    return response.data;
  }

  async rejectProvinceRequest(
    id: number,
    data: any
  ): Promise<ProvinceRequest> {
    const response = await api.post(`/book-requests/province/${id}/approve-reject/`, data);
    return response.data;
  }

  // School Requests
  async getSchoolRequests(filters?: any): Promise<SchoolRequest[]> {
    try {
      const response = await api.get('/school-requests/', { params: filters });
      return response.data.results || response.data;
    } catch (err: any) {
      // If not authorized, return empty array so UI can render and auth flow can handle redirect
      if (err?.response?.status === 401) {
        console.warn('[apiService] getSchoolRequests unauthorized (401)');
        return [];
      }
      throw err;
    }
  }

  async getSchoolRequest(id: number): Promise<SchoolRequest> {
    const response = await api.get(`/school-requests/${id}/`);
    return response.data;
  }

  async createSchoolRequest(data: any): Promise<SchoolRequest> {
    const response = await api.post('/school-requests/', data);
    return response.data;
  }

  async approveSchoolRequest(
    id: number,
    data: { approved_items: Array<any> }
  ): Promise<SchoolRequest> {
    const response = await api.post(`/school-requests/${id}/approve/`, data);
    return response.data;
  }

  async rejectSchoolRequest(
    id: number,
    data: { reason: string }
  ): Promise<SchoolRequest> {
    const response = await api.post(`/school-requests/${id}/reject/`, data);
    return response.data;
  }

  async createProvinceRequest(data: any): Promise<ProvinceRequest> {
    const response = await api.post('/book-requests/province/', data);
    return response.data;
  }

  // Shipments
  async getShipments(filters?: any): Promise<Shipment[]> {
    try {
      const response = await api.get('/warehouses/shipments/', { params: filters });
      return response.data.results || response.data;
    } catch (err: any) {
      if (err?.response?.status === 401) {
        console.warn('[apiService] getShipments unauthorized (401)');
        return [];
      }
      // Some endpoints might return 400 for invalid filters — rethrow to surface for debugging
      throw err;
    }
  }

  async getShipment(id: number): Promise<Shipment> {
    const response = await api.get(`/warehouses/shipments/${id}/`);
    return response.data;
  }

  async createShipment(data: any): Promise<Shipment> {
    const response = await api.post('/warehouses/shipments/', data);
    return response.data;
  }

  async updateShipmentStatus(
    id: number,
    data: { status: string }
  ): Promise<Shipment> {
    const response = await api.patch(`/warehouses/shipments/${id}/`, data);
    return response.data;
  }

  async getShipmentReport(id: number): Promise<any> {
    const response = await api.get(`/warehouses/shipments/${id}/report/`);
    return response.data;
  }

  // Inventory
  async getInventory(filters?: any): Promise<any> {
    const response = await api.get('/inventory/', { params: filters });
    return response.data.results || response.data;
  }

  async updateInventory(data: any): Promise<any> {
    const response = await api.post('/inventory/update/', data);
    return response.data;
  }

  // Statistics
  async getMinistryStats(): Promise<MinistryStats> {
    const response = await api.get('/warehouses/stats/ministry/');
    return response.data;
  }

  async getProvinceStats(provinceId?: string | number): Promise<ProvinceStats> {
    const params = provinceId ? { province: provinceId } : {};
    const response = await api.get('/warehouses/stats/province/', { params });
    return response.data;
  }

  // Couriers
  async getCouriers(filters?: any): Promise<any[]> {
    try {
      // Couriers are exposed via the users endpoint filtered by role
      const response = await api.get('/users/', { params: filters });
      return response.data.results || response.data;
    } catch (err: any) {
      if (err?.response?.status === 401) {
        console.warn('[apiService] getCouriers unauthorized (401)');
        return [];
      }
      throw err;
    }
  }

  async assignCourierToShipment(
    shipmentId: number,
    courierId: number
  ): Promise<any> {
    const response = await api.post(`/warehouses/shipments/${shipmentId}/assign/`, {
      courier_id: courierId,
    });
    return response.data;
  }

  // QR Code Processing
  async processQRCode(qrData: string): Promise<any> {
    const response = await api.post('/qr-codes/process/', { qr_data: qrData });
    return response.data;
  }

  // Notifications
  async getNotifications(filters?: any): Promise<any[]> {
    const response = await api.get('/notifications/', { params: filters });
    return response.data.results || response.data;
  }

  async markNotificationAsRead(id: number): Promise<any> {
    const response = await api.patch(`/notifications/${id}/`, { read: true });
    return response.data;
  }

  async markAllNotificationsRead(): Promise<any> {
    const response = await api.post('/notifications/mark_all_read/');
    return response.data;
  }

  // Reports
  async generateReport(data: any): Promise<any> {
    const response = await api.post('/reports/generate/', data);
    return response.data;
  }

  // Warehouses
  async getWarehouses(filters?: any): Promise<any[]> {
    const response = await api.get('/warehouses/', { params: filters });
    return response.data.results || response.data;
  }

  async getProvinceWarehouses(filters?: any): Promise<any[]> {
    const response = await api.get('/warehouses/province/', { params: filters });
    return response.data.results || response.data;
  }

  async getWarehouseStock(warehouseId: number): Promise<any> {
    const response = await api.get(`/warehouses/${warehouseId}/stock/`);
    return response.data;
  }

  // Directorates
  async getDirectorates(filters?: any): Promise<any[]> {
    const response = await api.get('/directorates/', { params: filters });
    return response.data.results || response.data;
  }

  async getDirectorateStatistics(id: number): Promise<any> {
    const response = await api.get(`/directorates/${id}/statistics/`);
    return response.data;
  }

  // Schools (for Province)
  async getSchools(filters?: any): Promise<any[]> {
    const response = await api.get('/schools/', { params: filters });
    return response.data.results || response.data;
  }

  async getSchool(id: number): Promise<any> {
    const response = await api.get(`/schools/${id}/`);
    return response.data;
  }

  // Provinces
  async getProvinces(filters?: any): Promise<any[]> {
    const response = await api.get('/provinces/', { params: filters });
    return response.data.results || response.data;
  }

  async getProvince(id: number): Promise<any> {
    const response = await api.get(`/provinces/${id}/`);
    return response.data;
  }

  async createProvince(data: any): Promise<any> {
    const response = await api.post('/provinces/', data);
    return response.data;
  }

  async updateProvince(id: number, data: any): Promise<any> {
    const response = await api.patch(`/provinces/${id}/`, data);
    return response.data;
  }

  async deleteProvince(id: number): Promise<any> {
    const response = await api.delete(`/provinces/${id}/`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
