// src/components/Login.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

// Imports shadcn-ui pour le style
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  // Destination par défaut après connexion
  const from = location.state?.from?.pathname || '/dashboard';

  // --- Toute la logique de connexion reste identique ---

  // Rediriger si l'utilisateur est déjà connecté
  useEffect(() => {
    if (session) {
      navigate(from, { replace: true });
    }
  }, [session, navigate, from]);

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (error) {
      console.error('Error signing up:', error.message);
      // Pensez à afficher une erreur à l'utilisateur ici
    } else {
      console.log('User signed up:', data.user);
      // On peut aussi rediriger après l'inscription
      navigate(from, { replace: true });
    }
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error('Error logging in:', error.message);
      // Pensez à afficher une erreur à l'utilisateur ici
    } else {
      console.log('User logged in:', data.user);
      navigate(from, { replace: true });
    }
  };

  // Ne rien afficher si on est déjà connecté (pendant la redirection)
  if (session) {
    return null; // Ou un spinner de chargement
  }

  // --- Le nouveau JSX (la partie "jolie") ---
  return (
    // Conteneur principal qui centre tout verticalement et horizontalement
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      
      {/* La carte de connexion, avec une largeur maximale */}
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>
            Entrez vos identifiants pour accéder à l'application.
          </CardDescription>
        </CardHeader>

        {/* Le contenu avec les champs du formulaire */}
        <CardContent>
          <div className="grid gap-4">
            {/* Champ Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            {/* Champ Mot de passe */}
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>

        {/* Le pied de page avec les boutons d'action */}
        <CardFooter>
          <div className="flex flex-col w-full gap-4">
            <Button onClick={handleLogin} className="w-full">
              Se connecter
            </Button>
           
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}