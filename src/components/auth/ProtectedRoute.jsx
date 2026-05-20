import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid rgba(124,58,237,0.2)',
          borderTop: '3px solid var(--purple)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (!user) {
    /* Salva para onde o usuário queria ir */
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
