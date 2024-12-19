'use client';
import { useState, useEffect } from 'react';
import Auth from '../components/Auth';
import Clientes from '../components/Clientes';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session);
      }
    );
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  };

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Sistema de Gestión de Clientes
        </h1>
        {!isLoggedIn ? (
          <Auth setIsLoggedIn={setIsLoggedIn} />
        ) : (
          <Clientes />
        )}
      </div>
    </main>
  );
} 