/**
 * TypeScript Types للـ Backend Models
 */

// User Types
export type UserRole = 
  | 'ministry_admin'
  | 'ministry_staff' 
  | 'ministry_warehouse' 
  | 'province_admin'
  | 'province_staff' 
  | 'province_warehouse' 
  | 'warehouse_manager'
  | 'driver' 
  | 'school_staff';

export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  full_name: string;
  role: UserRole;
  province?: number;
  province_name?: string;
  warehouse?: number;
  warehouse_name?: string;
  is_active: boolean;
  created_at: string;
}

// Auth Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  province?: number;
  warehouse?: number;
}

// Warehouse Types
export type WarehouseType = 'ministry' | 'province';

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  capacity: number;
  current_stock: number;
  warehouse_type: WarehouseType;
  province?: number;
  province_name?: string;
  manager?: number;
  manager_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: number;
  warehouse: number;
  warehouse_name: string;
  book: number;
  book_details: {
    id: number;
    title: string;
    subject: string;
    grade: string;
    description?: string;
  };
  quantity: number;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

// Book Types
export interface Book {
  id: number;
  title: string;
  subject: string;
  grade: string;
  description?: string;
  isbn?: string;
  publisher?: string;
  publication_year?: number;
  cover_image?: string;
  created_at: string;
  updated_at: string;
}

// Shipment Types
export type ShipmentStatus = 
  | 'preparing' 
  | 'in_transit' 
  | 'delivered' 
  | 'cancelled';

export interface Shipment {
  id: number;
  tracking_number: string;
  source_warehouse: number;
  source_warehouse_name: string;
  destination_warehouse: number;
  destination_warehouse_name: string;
  driver: number;
  driver_name: string;
  driver_phone?: string;
  status: ShipmentStatus;
  total_books: number;
  books: ShipmentBook[];
  expected_delivery_date: string;
  actual_delivery_date?: string;
  notes?: string;
  qr_code?: string;
  
  // GPS Tracking
  current_latitude?: number;
  current_longitude?: number;
  last_location_update?: string;
  
  // Delivery Proof
  delivery_proof_photo?: string;
  delivery_signature?: string;
  recipient_name?: string;
  recipient_phone?: string;
  
  created_at: string;
  updated_at: string;
}

export interface ShipmentBook {
  book_id: number;
  book_title?: string;
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

// Book Request Types
export type BookRequestStage = 
  | 'draft' 
  | 'submitted' 
  | 'approved' 
  | 'rejected' 
  | 'completed';

export interface BookRequest {
  id: number;
  stage: BookRequestStage;
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

// School Request Types
export type SchoolRequestStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'fulfilled';

export interface SchoolRequest {
  id: number;
  school: number;
  school_name: string;
  books: SchoolRequestBook[];
  total_quantity: number;
  status: SchoolRequestStatus;
  requested_by: number;
  requested_by_name: string;
  reviewed_by?: number;
  reviewed_by_name?: string;
  notes?: string;
  reason_rejected?: string;
  created_at: string;
  updated_at: string;
}

export interface SchoolRequestBook {
  book_id: number;
  book_title?: string;
  quantity: number;
}

// Province & School Types
export interface Province {
  id: number;
  name: string;
  code?: string;
  created_at: string;
}

export interface School {
  id: number;
  name: string;
  province: number;
  province_name: string;
  address?: string;
  phone?: string;
  principal_name?: string;
  total_students?: number;
  created_at: string;
  updated_at: string;
}

// Statistics Types
export interface MinistryStatistics {
  // ✅ Updated to match actual Backend response
  warehouses: {
    ministry_warehouses: number;
    province_warehouses: number;
    total: number;
  };
  stock: {
    total_books: number;
    low_stock_items: number;
  };
  shipments: {
    total: number;
    by_status: {
      pending: number;
      assigned: number;
      out_for_delivery: number;
      delivered: number;
      confirmed: number;
      canceled: number;
    };
    last_30_days: number;
    completed_last_30_days: number;
  };
  couriers: {
    total_ministry_couriers: number;
    active_couriers: number;
  };
  school_requests: {
    total: number;
    by_status: {
      pending: number;
      approved: number;
      rejected: number;
      fulfilled: number;
    };
  };
  
  // Backward compatibility (calculated from above)
  total_books?: number;
  total_shipments?: number;
  pending_requests?: number;
  active_drivers?: number;
  total_provinces?: number;
  total_warehouses?: number;
  active_shipments?: number;
  pending_shipments?: number;
  completed_shipments?: number;
  ministry_warehouses?: number;
  average_utilization?: number;
  books_by_subject?: Record<string, number>;
  top_provinces?: Array<{
    id: number;
    name: string;
    total_books: number;
    total_shipments: number;
  }>;
  recent_activity?: Activity[];
  shipments_by_status?: {
    preparing: number;
    in_transit: number;
    delivered: number;
    cancelled: number;
  };
}

export interface ProvinceStatistics {
  province_name: string;
  total_books: number;
  total_shipments: number;
  pending_school_requests: number;
  warehouses: {
    count: number;
    total_capacity: number;
    current_stock: number;
  };
  schools: {
    total: number;
    active_requests: number;
  };
  shipments_by_status: {
    preparing: number;
    in_transit: number;
    delivered: number;
  };
  recent_deliveries: Shipment[];
}

export interface WarehouseStatistics {
  warehouse_name: string;
  warehouse_type: WarehouseType;
  capacity: number;
  current_stock: number;
  utilization_percentage: number;
  total_shipments: {
    outgoing: number;
    incoming: number;
  };
  books_by_subject: {
    subject: string;
    quantity: number;
  }[];
  low_stock_alerts: Stock[];
}

export interface DriverStatistics {
  driver_name: string;
  total_deliveries: number;
  on_time_deliveries: number;
  late_deliveries: number;
  on_time_percentage: number;
  active_shipments: number;
  total_distance_km?: number;
  average_delivery_time_hours?: number;
  recent_shipments: Shipment[];
}

// Notification Types
export interface Notification {
  id: number;
  user: number;
  title: string;
  message: string;
  notification_type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  data?: Record<string, any>;
  created_at: string;
}

export interface DeviceToken {
  id: number;
  user: number;
  token: string;
  device_type: 'web' | 'ios' | 'android';
  is_active: boolean;
  created_at: string;
}

// Activity Types
export interface Activity {
  type: string;
  message: string;
  user?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Report Types
export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  warehouse_id?: number;
  province_id?: number;
  driver_id?: number;
  status?: string;
  format?: 'pdf' | 'excel';
}

// Pagination Types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API Response Types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// Form Types
export interface FormErrors {
  [key: string]: string | undefined;
}

// Filter Types
export interface ShipmentFilters {
  status?: ShipmentStatus;
  driver?: number;
  source_warehouse?: number;
  destination_warehouse?: number;
  start_date?: string;
  end_date?: string;
}

export interface BookRequestFilters {
  stage?: BookRequestStage;
  created_by?: number;
  assigned_to?: number;
}

export interface SchoolRequestFilters {
  status?: SchoolRequestStatus;
  school?: number;
  province?: number;
}
