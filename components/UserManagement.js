'use client';

import { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { NewUserEmailTemplate } from './emails/NewUserEmail';

export function UserManagement() {
  const [users, setUsers] = useState([]);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [permissions, setPermissions] = useState({
    can_create_clients: false,
    can_send_messages: false,
    can_manage_documents: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setIsAdmin(data?.role === 'admin');
    };

    checkAdmin();
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Usuario actual:', user);
        
        // Obtener organización del usuario actual
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        console.log('Rol del usuario:', userRole);

        // Primero obtener todos los roles de usuario de la organización
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('organization_id', userRole.organization_id);

        console.log('Roles encontrados:', roles);

        if (rolesError) throw rolesError;

        // Luego obtener los emails de auth.users
        const userIds = roles.map(role => role.user_id);
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);

        console.log('Datos de usuarios:', userData);

        if (userError) throw userError;

        // Combinar la información
        const usersWithRoles = roles.map(role => ({
          ...role,
          user: userData.find(u => u.id === role.user_id)
        }));

        console.log('Usuarios combinados:', usersWithRoles);
        setUsers(usersWithRoles);
      } catch (error) {
        console.error('Error detallado:', error);
        toast.error('Error al cargar usuarios');
      }
    };

    loadUsers();
  }, []);

  const handleInviteUser = async () => {
    try {
      setIsLoading(true);

      // Crear usuario usando nuestra API
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUserEmail,
          permissions
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success('Usuario invitado exitosamente');
      setShowInviteDialog(false);
      setNewUserEmail('');
      setPermissions({
        can_create_clients: false,
        can_send_messages: false,
        can_manage_documents: false
      });
      fetchUsers();
    } catch (error) {
      console.error('Error completo:', error);
      toast.error(error.message || 'Error al crear usuario');
    } finally {
      setIsLoading(false);
    }
  };

  // Función auxiliar para generar contraseña temporal
  const generateTempPassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const updateUserPermissions = async (userId, newPermissions) => {
    try {
      // Extraer solo los campos de permisos que necesitamos actualizar
      const permissionsToUpdate = {
        can_create_clients: newPermissions.can_create_clients,
        can_send_messages: newPermissions.can_send_messages,
        can_manage_documents: newPermissions.can_manage_documents
      };

      const { error } = await supabase
        .from('user_roles')
        .update(permissionsToUpdate)
        .eq('user_id', userId);

      if (error) throw error;

      // Actualizar el estado local inmediatamente
      setUsers(currentUsers => 
        currentUsers.map(user => 
          user.user_id === userId 
            ? { ...user, ...permissionsToUpdate }
            : user
        )
      );

      toast.success('Permisos actualizados');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar permisos');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      toast.success('Usuario eliminado exitosamente');
      fetchUsers();
      setUserToDelete(null); // Cerrar diálogo
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">No tienes permisos para ver esta página</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Usuarios</h2>
        <Button onClick={() => setShowInviteDialog(true)}>
          Invitar Usuario
        </Button>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.user_id}>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h3 className="font-medium">
                    {user.user?.email || 'Email no disponible'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {user.role || 'Colaborador'}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={user.can_create_clients || false}
                      onCheckedChange={(checked) => 
                        updateUserPermissions(user.user_id, { ...user, can_create_clients: checked })
                      }
                    />
                    <span>Crear Clientes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={user.can_send_messages}
                      onCheckedChange={(checked) => 
                        updateUserPermissions(user.user_id, { ...user, can_send_messages: checked })
                      }
                    />
                    <span>Enviar Mensajes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={user.can_manage_documents}
                      onCheckedChange={(checked) => 
                        updateUserPermissions(user.user_id, { ...user, can_manage_documents: checked })
                      }
                    />
                    <span>Gestionar Documentos</span>
                  </label>
                </div>
                {user.role !== 'admin' && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setUserToDelete({ id: user.user_id, email: user.user?.email })}
                  >
                    Eliminar Usuario
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Email del usuario"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
            />
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={permissions.can_create_clients}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, can_create_clients: checked }))
                  }
                />
                <span>Puede crear clientes</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={permissions.can_send_messages}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, can_send_messages: checked }))
                  }
                />
                <span>Puede enviar mensajes</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={permissions.can_manage_documents}
                  onCheckedChange={(checked) => 
                    setPermissions(prev => ({ ...prev, can_manage_documents: checked }))
                  }
                />
                <span>Puede gestionar documentos</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInviteUser} disabled={isLoading}>
              {isLoading ? 'Invitando...' : 'Invitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <p>¿Estás seguro que deseas eliminar al usuario {userToDelete?.email}?</p>
          <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteUser(userToDelete?.id)}
              disabled={isLoading}
            >
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 