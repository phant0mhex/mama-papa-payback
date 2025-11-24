// src/auth/LogoutButton.tsx

import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button'; // Votre bouton shadcn

export function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    // 1. Appeler la fonction de déconnexion de Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Erreur lors de la déconnexion:', error.message);
    } else {
      // 2. Rediriger l'utilisateur vers la page de connexion (ou l'accueil)
      //    C'est une bonne pratique pour une redirection immédiate.
      navigate('/login');
    }
  };

  return (
    <Button 
      onClick={handleLogout} 
      variant="outline" // "outline" ou "destructive" est souvent utilisé
    >
      Se déconnecter
    </Button>
  );
}