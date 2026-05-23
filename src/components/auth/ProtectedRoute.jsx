import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import LoadingSpinner from '../shared/LoadingSpinner';

export function ProtectedRoute({ children, roles = [] }) {
  const { user, profile, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles.length > 0 && profile && !roles.includes(profile.role)) {
    // Redirect to appropriate dashboard based on role
    if (profile.role === 'admin' || profile.role === 'super_admin') {
      return <Navigate to="/admin" replace />;
    } else if (profile.role === 'cashier') {
      return <Navigate to="/cashier" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}