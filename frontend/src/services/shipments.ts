import api, { handleApiError } from './api';

export interface CreateShipmentPayload {
  to_province?: number;
  to_school?: number;
  courier?: number;
  items: Array<{ book: number; quantity: number }>;
  notes?: string;
  source_warehouse?: number;
}

export const listShipments = async (params?: any) => {
  try {
    const resp = await api.get('/warehouses/shipments/', { params });
    return resp.data;
  } catch (err) {
    throw new Error(handleApiError(err));
  }
};

export const getShipment = async (id: number) => {
  try {
    const resp = await api.get(`/warehouses/shipments/${id}/`);
    return resp.data;
  } catch (err) {
    throw new Error(handleApiError(err));
  }
};

export const createShipment = async (payload: CreateShipmentPayload) => {
  try {
    const resp = await api.post('/warehouses/shipments/', payload);
    return resp.data;
  } catch (err) {
    throw new Error(handleApiError(err));
  }
};

export const receiveShipment = async (id: number, payload: { received_by: number; notes?: string }) => {
  try {
    const resp = await api.post(`/warehouses/shipments/${id}/receive/`, payload);
    return resp.data;
  } catch (err) {
    throw new Error(handleApiError(err));
  }
};

export default {
  listShipments,
  getShipment,
  createShipment,
  receiveShipment,
};
