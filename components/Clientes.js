import { useState, useEffect } from 'react';
import { Button } from "./ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Input } from "./ui/input"
import { supabase } from '../lib/supabase';
import ClientePage from './ClientePage';
import { MessageCircle } from 'lucide-react';
import { toast } from "sonner";

const ProgressBar = ({ value, label, color = "blue" }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div 
        className={`h-full bg-${color}-500 transition-all duration-300`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });
  const [unreadMessages, setUnreadMessages] = useState({});
  const [userPermissions, setUserPermissions] = useState(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      const { data, error } = await supabase
        .rpc('get_unread_messages_by_client')
        .select();

      if (!error && data) {
        const unreadStatus = Object.fromEntries(
          data.map(item => [
            item.client_id, 
            {
              has_unread: item.has_unread,
              unread_count: item.unread_count
            }
          ])
        );
        setUnreadMessages(unreadStatus);
      }
    };

    fetchUnreadMessages();

    // Suscribirse a nuevos mensajes
    const channel = supabase
      .channel('client_messages_count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_messages'
        },
        () => {
          fetchUnreadMessages();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchPermissions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setUserPermissions(data);
    };

    fetchPermissions();
  }, []);

  const handleAddClient = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Usuario creando cliente:', user);

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .single();

      console.log('Rol y organización para nuevo cliente:', userRole);

      if (!userRole?.organization_id) {
        throw new Error('Usuario sin organización');
      }

      const newClientData = {
        ...newClient,
        created_by: user.id,
        organization_id: userRole.organization_id
      };

      console.log('Datos del nuevo cliente:', newClientData);

      const { data, error } = await supabase
        .from('clientes')
        .insert([newClientData])
        .select();

      console.log('Resultado de crear cliente:', { data, error });

      if (error) throw error;

      setClientes([...clientes, {
        ...data[0],
        estadisticas: {
          total: 0,
          subidos: 0,
          aprobados: 0,
          rechazados: 0
        }
      }]);
      setShowAddClient(false);
      setNewClient({ nombre: '', email: '', telefono: '' });
      alert('Cliente agregado exitosamente');
    } catch (error) {
      console.error('Error detallado al agregar cliente:', error);
      alert('Error al agregar el cliente: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      // Obtener organización del usuario
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      // Primero obtener solo los clientes
      const { data: clients, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('organization_id', userRole.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Para cada cliente, obtener sus documentos
      const clientesConEstadisticas = await Promise.all(clients.map(async (cliente) => {
        const { data: documentos } = await supabase
          .from('documentos_cliente')
          .select('*')
          .eq('cliente_id', cliente.id);

        const docs = documentos || [];
        return {
          ...cliente,
          estadisticas: {
            total: docs.length,
            subidos: docs.filter(doc => doc.archivos && doc.archivos.length > 0).length,
            aprobados: docs.filter(doc => doc.archivos && doc.archivos.some(a => a.estado === 'aprobado')).length,
            rechazados: docs.filter(doc => doc.archivos && doc.archivos.some(a => a.estado === 'rechazado')).length
          }
        };
      }));

      setClientes(clientesConEstadisticas);
    } catch (error) {
      console.error('Error detallado:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewClient = (clientId) => {
    console.log('Ver cliente:', clientId);
    if (!clientId) {
      alert('Error: ID de cliente no válido');
      return;
    }
    setSelectedClientId(clientId);
  };

  const handleClientUpdate = (updatedClient) => {
    setClientes(prevClientes => 
      prevClientes.map(c => 
        c.id === updatedClient.id ? updatedClient : c
      )
    );
  };

  if (selectedClientId) {
    return (
      <ClientePage 
        clientId={selectedClientId} 
        onBack={() => setSelectedClientId(null)} 
        onClientUpdate={handleClientUpdate}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Clientes</h2>
        {userPermissions?.can_create_clients && (
          <Button onClick={() => setShowAddClient(true)}>
            Agregar Cliente
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientes.map((cliente) => (
          <Card key={cliente.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{cliente.nombre}</CardTitle>
                {unreadMessages[cliente.id] && (
                  <div className="flex items-center">
                    <MessageCircle className="h-5 w-5 text-red-500" />
                    <span className="ml-1 text-sm font-medium text-red-500">
                      {unreadMessages[cliente.id].unread_count}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p><strong>Email:</strong> {cliente.email}</p>
                  <p><strong>Teléfono:</strong> {cliente.telefono}</p>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Total de documentos:</p>
                      <p className="font-medium">{cliente.estadisticas?.total || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Documentos subidos:</p>
                      <p className="font-medium text-blue-600">{cliente.estadisticas?.subidos || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Documentos aprobados:</p>
                      <p className="font-medium text-green-600">{cliente.estadisticas?.aprobados || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Documentos rechazados:</p>
                      <p className="font-medium text-red-600">{cliente.estadisticas?.rechazados || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleViewClient(cliente.id)}
                    variant="outline"
                  >
                    Ver Cliente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Nombre"
              value={newClient.nombre}
              onChange={(e) => setNewClient({ ...newClient, nombre: e.target.value })}
            />
            <Input
              placeholder="Email"
              type="email"
              value={newClient.email}
              onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
            />
            <Input
              placeholder="Teléfono"
              value={newClient.telefono}
              onChange={(e) => setNewClient({ ...newClient, telefono: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddClient(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddClient} disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { Clientes };