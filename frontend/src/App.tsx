import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/LoginPage';
import { LogoutPage } from './pages/LogoutPage';
import { MinistryDashboard } from './pages/MinistryDashboard';
import { ProvinceDashboard } from './pages/ProvinceDashboard';
import { MinistryWarehousesPage } from './pages/MinistryWarehousesPage';
import { WarehouseStockPage } from './pages/WarehouseStockPage';
import { ShipmentsPage } from './pages/ShipmentsPage';
import { MinistryShipmentManagementPage } from './components/MinistryShipmentManagementPage';
import { ProvinceBookRequestPage } from './components/ProvinceBookRequestPage';
import { MinistryProvinceRequestsPage } from './components/MinistryProvinceRequestsPage';
import { MinistryProvinceRequestsPageV2 } from './components/MinistryProvinceRequestsPageV2';
import { MinistryBooksManagementPage } from './components/MinistryBooksManagementPage';
import { SchoolManagementPage } from './components/SchoolManagementPage';
import { ShipmentTrackingPage } from './components/ShipmentTrackingPage';
import { ReportsPage } from './components/ReportsPage';
import { StockEntryPage } from './components/StockEntryPage';
import { ShipmentsPage as ShipmentsListPage } from './components/ShipmentsPage';
import { CouriersManagementPage } from './components/CouriersManagementPage';
import './App.css';

/**
 * Protected Route Component
 * يحمي الصفحات التي تحتاج مصادقة
 */
function ProtectedRoute({ 
  children, 
  allowedRoles = [] 
}: { 
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin has access to everything
  if (user?.role === 'admin') {
    return <>{children}</>;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

/**
 * Public Route Component
 * يمنع الوصول للصفحات العامة إذا كان المستخدم مسجل دخول
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  // فقط نتحقق من isAuthenticated بدون التحقق من user لتجنب الحلقة
  if (isAuthenticated) {
    // إذا لم يكن هناك user، ننتظر قليلاً قبل إعادة التوجيه
    if (!user) {
      return <>{children}</>;
    }
    
    // توجيه حسب الدور
    const role = user.role;
    if (role === 'ministry_admin' || role === 'ministry_staff' || role === 'ministry_warehouse') {
      return <Navigate to="/ministry/dashboard" replace />;
    } else if (role === 'province_admin' || role === 'province_staff' || role === 'province_warehouse') {
      return <Navigate to="/province/dashboard" replace />;
    } else if (role === 'warehouse_manager') {
      return <Navigate to="/warehouse/dashboard" replace />;
    } else if (role === 'driver' || role === 'ministry_driver' || role === 'province_driver') {
      return <Navigate to="/ministry/dashboard" replace />;
    }
    // Default: redirect to ministry dashboard
    return <Navigate to="/ministry/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      
      <Route path="/logout" element={<LogoutPage />} />

      {/* Ministry Routes */}
      <Route
        path="/ministry/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ministry_admin', 'ministry_staff']}>
            <MinistryDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry/warehouses"
        element={
          <ProtectedRoute allowedRoles={['ministry_admin', 'ministry_staff']}>
            <MinistryWarehousesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry/warehouse/:warehouseId/stock"
        element={
          <ProtectedRoute allowedRoles={['ministry_admin', 'ministry_staff', 'ministry_warehouse']}>
            <WarehouseStockPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry/shipments"
        element={
          <ProtectedRoute allowedRoles={['ministry_admin', 'ministry_staff']}>
            <MinistryShipmentManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry/books"
        element={
          <ProtectedRoute allowedRoles={['ministry_admin', 'ministry_staff']}>
            <MinistryBooksManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry/stock-entry"
        element={
          <ProtectedRoute allowedRoles={['ministry_admin', 'ministry_staff']}>
            <StockEntryPage warehouseType="ministry" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry/outgoing-shipments"
        element={
          <ProtectedRoute allowedRoles={['ministry_admin', 'ministry_staff']}>
            <ShipmentsListPage direction="outgoing" userType="ministry" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry/incoming-shipments"
        element={
          <ProtectedRoute allowedRoles={['ministry_admin', 'ministry_staff']}>
            <ShipmentsListPage direction="incoming" userType="ministry" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry/provinces"
        element={
          <ProtectedRoute allowedRoles={['ministry_admin', 'ministry_staff']}>
            <div className="p-8 text-center">قريباً: إدارة المحافظات</div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry/couriers"
        element={
          <ProtectedRoute allowedRoles={['ministry_admin', 'ministry_staff']}>
            <CouriersManagementPage courierType="ministry" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry/province-requests"
        element={
          <ProtectedRoute allowedRoles={['ministry_admin', 'ministry_staff']}>
            <MinistryProvinceRequestsPageV2 />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry/schools"
        element={
          <ProtectedRoute allowedRoles={['ministry_admin', 'ministry_staff']}>
            <SchoolManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ministry/reports"
        element={
          <ProtectedRoute allowedRoles={['ministry_admin', 'ministry_staff']}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />

      {/* Province Routes - المحافظات */}
      <Route
        path="/province/dashboard"
        element={
          <ProtectedRoute allowedRoles={['province_admin', 'province_staff']}>
            <ProvinceDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/province/warehouse/:warehouseId/stock"
        element={
          <ProtectedRoute allowedRoles={['province_admin', 'province_staff', 'province_warehouse']}>
            <WarehouseStockPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/province/shipments"
        element={
          <ProtectedRoute allowedRoles={['province_admin', 'province_staff']}>
            <ShipmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/province/book-requests"
        element={
          <ProtectedRoute allowedRoles={['province_admin', 'province_staff']}>
            <ProvinceBookRequestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/province/stock-entry"
        element={
          <ProtectedRoute allowedRoles={['province_admin', 'province_staff']}>
            <StockEntryPage warehouseType="province" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/province/outgoing-shipments"
        element={
          <ProtectedRoute allowedRoles={['province_admin', 'province_staff']}>
            <ShipmentsListPage direction="outgoing" userType="province" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/province/incoming-shipments"
        element={
          <ProtectedRoute allowedRoles={['province_admin', 'province_staff']}>
            <ShipmentsListPage direction="incoming" userType="province" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/province/couriers"
        element={
          <ProtectedRoute allowedRoles={['province_admin', 'province_staff']}>
            <CouriersManagementPage courierType="province" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/province/schools"
        element={
          <ProtectedRoute allowedRoles={['province_admin', 'province_staff']}>
            <SchoolManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/province/reports"
        element={
          <ProtectedRoute allowedRoles={['province_admin', 'province_staff']}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />

      {/* Shared Routes - مسارات مشتركة */}
      <Route
        path="/shipments/tracking"
        element={
          <ProtectedRoute allowedRoles={['ministry_admin', 'ministry_staff', 'province_admin', 'province_staff', 'warehouse_manager', 'ministry_warehouse', 'province_warehouse', 'driver']}>
            <ShipmentTrackingPage />
          </ProtectedRoute>
        }
      />

      {/* Warehouse Routes */}
      <Route
        path="/warehouse/dashboard"
        element={
          <ProtectedRoute allowedRoles={['warehouse_manager', 'ministry_warehouse', 'province_warehouse']}>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <h1>Warehouse Dashboard</h1>
              <p>Coming Soon</p>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Driver Routes */}
      <Route
        path="/driver/dashboard"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <h1>Driver Dashboard</h1>
              <p>Coming Soon</p>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Unauthorized */}
      <Route
        path="/unauthorized"
        element={
          <div style={{ textAlign: 'center', padding: '50px', direction: 'rtl' }}>
            <h1>⛔ غير مصرح</h1>
            <p>ليس لديك صلاحية للوصول لهذه الصفحة</p>
          </div>
        }
      />

      {/* Default Route */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 404 */}
      <Route
        path="*"
        element={
          <div style={{ textAlign: 'center', padding: '50px', direction: 'rtl' }}>
            <h1>404</h1>
            <p>الصفحة غير موجودة</p>
          </div>
        }
      />
    </Routes>
  );
}
