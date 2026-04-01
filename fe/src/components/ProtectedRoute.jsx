import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (user.isAdmin) return <Navigate to="/admin" replace />;
  if (user.verificationStatus === 'PENDING') return <Navigate to="/pending" replace />;
  if (user.role === 'ORG_ADMIN' && !user.isAdmin && location.pathname !== '/org-admin') return <Navigate to="/org-admin" replace />;
  return children;
}
