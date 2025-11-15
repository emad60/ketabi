/**
 * Warehouse Service
 * خدمة إدارة المستودعات والمخزون
 */

import api from './api';
import { ENDPOINTS } from '../config/api';
import type { Warehouse, Stock, PaginatedResponse } from '../types';

export const warehouseService = {
  // ==================== Ministry Warehouses ====================
  
  /**
   * الحصول على قائمة مستودعات الوزارة
   */
  async getMinistryWarehouses(): Promise<Warehouse[]> {
    const response = await api.get<Warehouse[]>(
      ENDPOINTS.WAREHOUSES.MINISTRY.LIST
    );
    return response.data;
  },

  /**
   * إنشاء مستودع وزارة جديد
   */
  async createMinistryWarehouse(data: Partial<Warehouse>): Promise<Warehouse> {
    const response = await api.post<Warehouse>(
      ENDPOINTS.WAREHOUSES.MINISTRY.CREATE,
      data
    );
    return response.data;
  },

  /**
   * تحديث مستودع وزارة
   */
  async updateMinistryWarehouse(
    id: number,
    data: Partial<Warehouse>
  ): Promise<Warehouse> {
    const response = await api.put<Warehouse>(
      ENDPOINTS.WAREHOUSES.MINISTRY.DETAIL(id),
      data
    );
    return response.data;
  },

  /**
   * حذف مستودع وزارة
   */
  async deleteMinistryWarehouse(id: number): Promise<void> {
    await api.delete(ENDPOINTS.WAREHOUSES.MINISTRY.DETAIL(id));
  },

  // ==================== Province Warehouses ====================

  /**
   * الحصول على قائمة مستودعات المحافظات
   */
  async getProvinceWarehouses(provinceId?: number): Promise<Warehouse[]> {
    const response = await api.get<Warehouse[]>(
      ENDPOINTS.WAREHOUSES.PROVINCE.LIST,
      {
        params: provinceId ? { province: provinceId } : {}
      }
    );
    return response.data;
  },

  /**
   * إنشاء مستودع محافظة جديد
   */
  async createProvinceWarehouse(data: Partial<Warehouse>): Promise<Warehouse> {
    const response = await api.post<Warehouse>(
      ENDPOINTS.WAREHOUSES.PROVINCE.CREATE,
      data
    );
    return response.data;
  },

  /**
   * تحديث مستودع محافظة
   */
  async updateProvinceWarehouse(
    id: number,
    data: Partial<Warehouse>
  ): Promise<Warehouse> {
    const response = await api.put<Warehouse>(
      ENDPOINTS.WAREHOUSES.PROVINCE.DETAIL(id),
      data
    );
    return response.data;
  },

  /**
   * حذف مستودع محافظة
   */
  async deleteProvinceWarehouse(id: number): Promise<void> {
    await api.delete(ENDPOINTS.WAREHOUSES.PROVINCE.DETAIL(id));
  },

  // ==================== All Warehouses ====================

  /**
   * الحصول على جميع المستودعات (وزارة + محافظات)
   */
  async getAllWarehouses(): Promise<Warehouse[]> {
    const [ministryWarehouses, provinceWarehouses] = await Promise.all([
      this.getMinistryWarehouses(),
      this.getProvinceWarehouses(),
    ]);

    return [...ministryWarehouses, ...provinceWarehouses];
  },

  /**
   * الحصول على مستودع محدد بالـ ID
   */
  async getWarehouse(id: number, type: 'ministry' | 'province'): Promise<Warehouse> {
    const endpoint = type === 'ministry'
      ? ENDPOINTS.WAREHOUSES.MINISTRY.DETAIL(id)
      : ENDPOINTS.WAREHOUSES.PROVINCE.DETAIL(id);

    const response = await api.get<Warehouse>(endpoint);
    return response.data;
  },

  // ==================== Stocks Management ====================

  /**
   * الحصول على مخزون مستودع محدد
   */
  async getWarehouseStocks(warehouseId: number): Promise<Stock[]> {
    const response = await api.get<Stock[]>(
      ENDPOINTS.WAREHOUSES.STOCKS.LIST,
      {
        params: { warehouse_id: warehouseId }
      }
    );
    return response.data;
  },

  /**
   * إضافة كتب للمخزون
   */
  async addStock(data: Partial<Stock>): Promise<Stock> {
    const response = await api.post<Stock>(
      ENDPOINTS.WAREHOUSES.STOCKS.CREATE,
      data
    );
    return response.data;
  },

  /**
   * تحديث المخزون
   */
  async updateStock(id: number, data: Partial<Stock>): Promise<Stock> {
    const response = await api.put<Stock>(
      ENDPOINTS.WAREHOUSES.STOCKS.DETAIL(id),
      data
    );
    return response.data;
  },

  /**
   * حذف مخزون
   */
  async deleteStock(id: number): Promise<void> {
    await api.delete(ENDPOINTS.WAREHOUSES.STOCKS.DETAIL(id));
  },

  /**
   * البحث في المخزون
   */
  async searchStocks(filters: {
    warehouse_id?: number;
    book_id?: number;
    min_quantity?: number;
    max_quantity?: number;
  }): Promise<Stock[]> {
    const response = await api.get<Stock[]>(
      ENDPOINTS.WAREHOUSES.STOCKS.LIST,
      { params: filters }
    );
    return response.data;
  },

  /**
   * الحصول على تنبيهات المخزون المنخفض
   */
  async getLowStockAlerts(warehouseId?: number): Promise<Stock[]> {
    const response = await api.get<Stock[]>(
      '/warehouses/stocks/low-stock/',
      {
        params: warehouseId ? { warehouse_id: warehouseId } : {}
      }
    );
    return response.data;
  },

  // ==================== Warehouse Capacity ====================

  /**
   * حساب نسبة استخدام المستودع
   */
  calculateUtilization(warehouse: Warehouse): number {
    if (warehouse.capacity === 0) return 0;
    return (warehouse.current_stock / warehouse.capacity) * 100;
  },

  /**
   * التحقق من توفر مساحة في المستودع
   */
  hasCapacity(warehouse: Warehouse, additionalQuantity: number): boolean {
    return warehouse.current_stock + additionalQuantity <= warehouse.capacity;
  },

  /**
   * حساب المساحة المتبقية
   */
  getRemainingCapacity(warehouse: Warehouse): number {
    return Math.max(0, warehouse.capacity - warehouse.current_stock);
  },
};

export default warehouseService;
