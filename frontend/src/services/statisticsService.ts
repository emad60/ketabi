/**
 * Statistics Service
 * خدمة الإحصائيات و Analytics
 */

import api from './api';
import { ENDPOINTS } from '../config/api';
import type {
  MinistryStatistics,
  ProvinceStatistics,
  WarehouseStatistics,
  DriverStatistics,
} from '../types';

export const statisticsService = {
  /**
   * إحصائيات الوزارة (Ministry Dashboard)
   */
  async getMinistryStats(): Promise<MinistryStatistics> {
    const response = await api.get<MinistryStatistics>(
      ENDPOINTS.STATISTICS.MINISTRY
    );
    return response.data;
  },

  /**
   * إحصائيات المحافظة (Province Dashboard)
   */
  async getProvinceStats(provinceId: number): Promise<ProvinceStatistics> {
    const response = await api.get<ProvinceStatistics>(
      ENDPOINTS.STATISTICS.PROVINCE,
      {
        params: { province_id: provinceId }
      }
    );
    return response.data;
  },

  /**
   * إحصائيات المستودع
   */
  async getWarehouseStats(warehouseId: number): Promise<WarehouseStatistics> {
    const response = await api.get<WarehouseStatistics>(
      ENDPOINTS.STATISTICS.WAREHOUSE,
      {
        params: { warehouse_id: warehouseId }
      }
    );
    return response.data;
  },

  /**
   * إحصائيات السائق
   */
  async getDriverStats(driverId: number): Promise<DriverStatistics> {
    const response = await api.get<DriverStatistics>(
      ENDPOINTS.STATISTICS.DRIVER,
      {
        params: { driver_id: driverId }
      }
    );
    return response.data;
  },

  /**
   * إحصائيات مخصصة حسب الفترة الزمنية
   */
  async getStatsWithDateRange(
    type: 'ministry' | 'province' | 'warehouse' | 'driver',
    id: number | null,
    startDate: string,
    endDate: string
  ) {
    const endpoint = ENDPOINTS.STATISTICS[type.toUpperCase() as keyof typeof ENDPOINTS.STATISTICS];
    
    const response = await api.get(endpoint, {
      params: {
        id,
        start_date: startDate,
        end_date: endDate,
      }
    });
    
    return response.data;
  },
};

export default statisticsService;
