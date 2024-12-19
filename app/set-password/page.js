'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar el token al cargar
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    console.log('Token encontrado:', !!token);
  }, []);

  const handleSetPassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setIsLoading(true);

      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        throw new Error('Token no encontrado');
      }

      // Usar el token de recuperación para establecer la contraseña
      const { error } = await supabase.auth.verifyOtp({
        token,
        type: 'recovery',
        password
      });

      if (error) throw error;

      toast.success('Contraseña establecida exitosamente');
      setTimeout(() => router.push('/login'), 2000);
    } catch (error) {
      console.error('Error completo:', error);
      toast.error(error.message || 'Error al establecer la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Establecer Contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full"
            >
              {isLoading ? 'Guardando...' : 'Guardar Contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}