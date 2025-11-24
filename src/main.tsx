import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // En supposant que App contient votre Router
import { AuthProvider } from './auth/AuthProvider';
import './index.css'; // Votre CSS global


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 1. Mettre le Provider le plus haut possible */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);