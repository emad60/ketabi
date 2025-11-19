import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function LogoutPage() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    // Clear auth state
    clearAuth();
    
    // Clear localStorage completely
    localStorage.clear();
    
    // Redirect to login
    setTimeout(() => {
      navigate('/login', { replace: true });
    }, 500);
  }, [clearAuth, navigate]);

  return (
    <div style={{ textAlign: 'center', padding: '50px', direction: 'rtl' }}>
      <h1>🔄 جارٍ تسجيل الخروج...</h1>
      <p>يرجى الانتظار</p>
    </div>
  );
}
