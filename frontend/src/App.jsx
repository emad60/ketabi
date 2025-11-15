/**
 * Ketabi Main App
 * التطبيق الرئيسي مع التوجيه والمصادقة
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import MinistryDashboard from './pages/MinistryDashboard';
import CapitalDashboard from './components/CapitalDashboard';
import ShipmentManagement from './components/ShipmentManagement';
import CreateBookRequest from './components/CreateBookRequest';
import './App.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

/**
 * Protected Route Component
 * يحمي الصفحات التي تحتاج مصادقة
 */
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

/**
 * Public Route Component
 * يمنع الوصول للصفحات العامة إذا كان المستخدم مسجل دخول
 */
function PublicRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    // توجيه حسب الدور
    if (user.role === 'ministry_admin' || user.role === 'ministry_staff') {
      return <Navigate to="/ministry/dashboard" replace />;
    } else if (user.role === 'province_admin' || user.role === 'province_staff') {
      return <Navigate to="/province/dashboard" replace />;
    } else if (user.role === 'warehouse_manager' || user.role === 'ministry_warehouse' || user.role === 'province_warehouse') {
      return <Navigate to="/warehouse/dashboard" replace />;
    } else if (user.role === 'driver') {
      return <Navigate to="/driver/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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

          {/* Ministry Routes */}
          <Route
            path="/ministry/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ministry_admin', 'ministry_staff']}>
                <MinistryDashboard />
              </ProtectedRoute>
            }
          />

          {/* Province Routes - أمانة العاصمة */}
          <Route
            path="/province/dashboard"
            element={
              <ProtectedRoute allowedRoles={['province_admin', 'province_staff']}>
                <CapitalDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/province/shipments"
            element={
              <ProtectedRoute allowedRoles={['province_admin', 'province_staff']}>
                <ShipmentManagement />
              </ProtectedRoute>
            }
          />

          {/* Warehouse Routes */}
          <Route
            path="/warehouse/dashboard"
            element={
              <ProtectedRoute allowedRoles={['warehouse_manager', 'ministry_warehouse', 'province_warehouse']}>
                <div>Warehouse Dashboard (Coming Soon)</div>
              </ProtectedRoute>
            }
          />

          {/* Driver Routes */}
          <Route
            path="/driver/dashboard"
            element={
              <ProtectedRoute allowedRoles={['driver']}>
                <div>Driver Dashboard (Coming Soon)</div>
              </ProtectedRoute>
            }
          />

          {/* Unauthorized */}
          <Route
            path="/unauthorized"
            element={
              <div style={{ textAlign: 'center', padding: '50px' }}>
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
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <h1>404</h1>
                <p>الصفحة غير موجودة</p>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
