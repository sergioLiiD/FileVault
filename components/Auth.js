'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

function Auth({ setIsLoggedIn }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verificar el rol del usuario
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      if (roleError) throw roleError;

      if (!roleData || !['admin', 'colaborador'].includes(roleData.role)) {
        throw new Error('No tienes permisos para acceder');
      }

      setIsLoggedIn(true);
      toast.success('Inicio de sesión exitoso');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    try {
      setIsLoading(true);
      
      // 1. Crear usuario
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      // 2. Crear organización
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{ name: email }])
        .select()
        .single();

      if (orgError) throw orgError;

      // 3. Crear rol de admin con la organización
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: authData.user.id,
          role: 'admin',
          organization_id: orgData.id
        }]);

      if (roleError) throw roleError;

      toast.success('Cuenta creada exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Iniciar Sesión</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export { Auth }; 