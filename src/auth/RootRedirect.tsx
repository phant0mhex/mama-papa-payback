// src/auth/RootRedirect.tsx
import { useAuth } from './AuthProvider';
import { Navigate } from 'react-router-dom';

export function RootRedirect() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <div>Chargement...</div>; // Ou un spinner
  }

  // Si session existe, aller au dashboard
  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  // Sinon, aller à la page de connexion
  return <Navigate to="/login" replace />;
}