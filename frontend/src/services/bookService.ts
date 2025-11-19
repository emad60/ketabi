import api from './api';
import { ENDPOINTS } from '../config/api';

export interface Book {
  id: number;
  title: string;
  subject: string;
  grade_level: string;
  isbn?: string;
  publisher?: string;
  edition?: string;
  total_quantity?: number;
  available_quantity?: number;
}

export const bookService = {
  async getBooks(params?: Record<string, any>): Promise<Book[]> {
    const finalParams = { ...params, page_size: 1000 };
    console.log('Requesting books with params:', finalParams);
    const response = await api.get(ENDPOINTS.BOOKS.LIST, { 
      params: finalParams
    });
    console.log('API Response data:', response.data);
    // support paginated and non-paginated responses
    return response.data.results || response.data;
  },

  async getBook(id: number): Promise<Book> {
    const response = await api.get(ENDPOINTS.BOOKS.DETAIL(id));
    return response.data;
  },

  async createBook(data: Partial<Book>): Promise<Book> {
    const response = await api.post(ENDPOINTS.BOOKS.CREATE, data);
    return response.data;
  },

  async updateBook(id: number, data: Partial<Book>): Promise<Book> {
    const response = await api.put(ENDPOINTS.BOOKS.UPDATE(id), data);
    return response.data;
  },

  async deleteBook(id: number): Promise<void> {
    await api.delete(ENDPOINTS.BOOKS.DELETE(id));
  },
};

export default bookService;
