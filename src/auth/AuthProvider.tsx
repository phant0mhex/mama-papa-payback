// src/auth/AuthProvider.tsx

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../supabaseClient'; // Ajustez ce chemin si nécessaire
import { Session } from '@supabase/supabase-js';

// Définir le type pour notre contexte
interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
}

// 1. Créer le Contexte
// La valeur par défaut 'undefined' est gérée par notre hook 'useAuth'
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Créer le Fournisseur (Provider)
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mettre isLoading à true au début
    setIsLoading(true);

    // onAuthStateChange est appelé immédiatement avec la session en cours
    // s'il y en a une (ex: après un rafraîchissement de page)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setIsLoading(false); // Nous avons reçu la session (ou null), le chargement est terminé
      }
    );

    // Fonction de nettoyage pour se désabonner de l'écouteur
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Le tableau vide [] assure que cet effet ne s'exécute qu'une seule fois

  const value = {
    session,
    isLoading,
  };

  // Nous fournissons la 'value' à tous les enfants
  // Nous ne rendons les enfants que lorsque le chargement initial est terminé
  // pour éviter les "flashs" de contenu.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Créer un Hook personnalisé pour consommer le contexte
// C'est la manière propre d'accéder à nos données d'authentification
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé AuthProvider');
  }
  return context;
}