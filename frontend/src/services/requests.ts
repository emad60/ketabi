import api, { handleApiError } from './api';

export const getRequest = async (id: number) => {
  try {
    const resp = await api.get(`/book-requests/${id}/`);
    return resp.data;
  } catch (err) {
    throw new Error(handleApiError(err));
  }
};

export const listRequests = async (params?: any) => {
  try {
    const resp = await api.get('/book-requests/', { params });
    return resp.data;
  } catch (err) {
    throw new Error(handleApiError(err));
  }
};

export default { getRequest, listRequests };
