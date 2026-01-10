import api from './api';
import { ENDPOINTS } from '../config/api';

export interface Province {
  id: number;
  name: string;
  code?: string;
  created_at?: string;
}

export interface Directorate {
  id: number;
  name: string;
  province: number;
  province_name?: string;
  code?: string;
  schools_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface School {
  id: number;
  name: string;
  province: number;
  province_name?: string;
  type: 'public' | 'private';
  address?: string;
  phone?: string;
  principal_name?: string;
  total_students?: number;
  total_teachers?: number;
  created_at?: string;
  updated_at?: string;
}

export const schoolService = {
  async getSchools(params?: Record<string, any>): Promise<School[]> {
    const response = await api.get(ENDPOINTS.SCHOOLS.LIST, { params });
    return response.data.results || response.data;
  },

  async getSchool(id: number): Promise<School> {
    const response = await api.get(ENDPOINTS.SCHOOLS.DETAIL(id));
    return response.data;
  },

  async createSchool(data: Partial<School>): Promise<School> {
    const response = await api.post(ENDPOINTS.SCHOOLS.LIST, data);
    return response.data;
  },

  async updateSchool(id: number, data: Partial<School>): Promise<School> {
    const response = await api.put(ENDPOINTS.SCHOOLS.DETAIL(id), data);
    return response.data;
  },

  async deleteSchool(id: number): Promise<void> {
    await api.delete(ENDPOINTS.SCHOOLS.DETAIL(id));
  },

  async getProvinces(params?: Record<string, any>): Promise<Province[]> {
    const response = await api.get(ENDPOINTS.PROVINCES.LIST, { params });
    return response.data.results || response.data;
  },

  async getDirectorates(params?: Record<string, any>): Promise<Directorate[]> {
    const response = await api.get(ENDPOINTS.DIRECTORATES.LIST, { params });
    return response.data.results || response.data;
  },
};

export default schoolService;
