'use client';

import { useRouter } from 'next/navigation';
import { Button } from "./ui/button";
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      window.location.href = '/login';
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={handleLogout}
      title="Cerrar sesión"
    >
      <LogOut className="h-5 w-5" />
    </Button>
  );
} 