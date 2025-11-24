// src/auth/ProtectedRoute.tsx

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider'; // Notre hook personnalisé
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // 1. Afficher un indicateur pendant la vérification de la session
    // Cela évite une redirection-éclair vers /login
    return <div>Chargement...</div>; // Ou un composant Spinner
  }

  if (!session) {
    // 2. L'utilisateur n'est pas connecté
    // Rediriger vers la page de connexion
    // 'state={{ from: location }}' permet de rediriger l'utilisateur
    // vers la page où il voulait aller *après* sa connexion.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. L'utilisateur est connecté, afficher le contenu protégé
  return <>{children}</>;
}