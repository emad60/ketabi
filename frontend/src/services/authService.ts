/**
 * Authentication Service
 * خدمة المصادقة والتفويض
 */

import api from './api';
import { ENDPOINTS } from '../config/api';
import type { 
  LoginCredentials, 
  LoginResponse, 
  RegisterData, 
  User 
} from '../types';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

export const authService = {
  /**
   * تسجيل الدخول
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(
      ENDPOINTS.AUTH.LOGIN,
      credentials
    );

    const { access, refresh, user } = response.data;

    // حفظ البيانات في localStorage
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return response.data;
  },

  /**
   * تسجيل مستخدم جديد
   */
  async register(data: RegisterData): Promise<User> {
    const response = await api.post<User>(
      ENDPOINTS.AUTH.REGISTER,
      data
    );

    return response.data;
  },

  /**
   * تجديد Access Token
   */
  async refreshToken(): Promise<string> {
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refresh) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<{ access: string }>(
      ENDPOINTS.AUTH.REFRESH,
      { refresh }
    );

    const newAccessToken = response.data.access;
    localStorage.setItem(TOKEN_KEY, newAccessToken);

    return newAccessToken;
  },

  /**
   * تسجيل الخروج
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // إعادة توجيه لصفحة Login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  /**
   * الحصول على Access Token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * الحصول على بيانات المستخدم الحالي
   */
  getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    
    if (!userStr) {
      return null;
    }

    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  /**
   * تحديث بيانات المستخدم المحلية
   */
  updateUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * التحقق من تسجيل الدخول
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  /**
   * التحقق من صلاحية المستخدم
   */
  hasRole(role: User['role']): boolean {
    const user = this.getUser();
    return user?.role === role;
  },

  /**
   * التحقق من أحد الصلاحيات
   */
  hasAnyRole(roles: User['role'][]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role) : false;
  },

  /**
   * الحصول على معلومات المستخدم من الخادم
   */
  async fetchCurrentUser(): Promise<User> {
    const response = await api.get<User>(ENDPOINTS.USERS.ME);
    
    // تحديث البيانات المحلية
    this.updateUser(response.data);
    
    return response.data;
  },

  /**
   * تحديث الملف الشخصي
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const user = this.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response = await api.put<User>(
      ENDPOINTS.USERS.DETAIL(user.id),
      data
    );

    // تحديث البيانات المحلية
    this.updateUser(response.data);

    return response.data;
  },

  /**
   * تغيير كلمة المرور
   */
  async changePassword(data: {
    old_password: string;
    new_password: string;
  }): Promise<void> {
    const user = this.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    await api.post(
      `/users/${user.id}/change-password/`,
      data
    );
  },
};

export default authService;
