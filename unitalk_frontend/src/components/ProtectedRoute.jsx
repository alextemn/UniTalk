import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="spinner">Loading…</div>;
  if (!user) return <Navigate to="/" replace />;
  if (user.user_type !== allowedRole) {
    return <Navigate to={user.user_type === 'faculty' ? '/faculty' : '/student'} replace />;
  }

  return children;
}
