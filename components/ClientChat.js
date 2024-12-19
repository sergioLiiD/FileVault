import { useState, useEffect, useRef } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";

function ClientChat({ clientId, isClientView = false, token }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [showNewMessagesDialog, setShowNewMessagesDialog] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchMessages();

    // Configurar el canal con broadcast
    const channelConfig = {
      config: {
        broadcast: { self: true },
        headers: isClientView ? {
          'x-client-token': token
        } : undefined
      }
    };

    // Suscribirse a cambios usando un solo cliente
    const channel = supabase
      .channel('messages-' + clientId + '-' + Date.now(), channelConfig)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_messages',
          filter: `client_id=eq.${clientId}`
        },
        async (payload) => {
          console.log('Nuevo mensaje recibido:', payload);
          
          // Si es admin, obtener información del usuario
          if (!isClientView && payload.new.user_id) {
            const { data: userData } = await supabase
              .from('users')
              .select('id, email')
              .eq('id', payload.new.user_id)
              .single();

            if (userData) {
              payload.new.user = userData;
            }
          }

          setMessages(prev => {
            const messageExists = prev.some(msg => msg.id === payload.new.id);
            if (messageExists) {
              return prev;
            }
            return [...prev, payload.new];
          });
          scrollToBottom();
        }
      );

    // Conectar el canal
    channel.subscribe(async (status, error) => {
      if (status === 'SUBSCRIBED') {
        console.log('Suscripción a mensajes activa para:', isClientView ? 'cliente' : 'admin');
      }
      if (error) {
        console.error('Error en la suscripción:', error);
      }
    });

    return () => {
      console.log('Desuscribiendo del canal...');
      channel.unsubscribe();
    };
  }, [clientId, isClientView, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isClientView && token) {
      const checkNewMessages = async () => {
        const { data, error } = await supabase
          .rpc('has_new_messages', {
            p_client_id: clientId,
            p_access_token: token
          })
          .single();

        if (!error && data) {
          setHasNewMessages(data.has_new);
          setNewMessagesCount(data.new_count);
          if (data.has_new && data.new_count > 0) {
            setShowNewMessagesDialog(true);
          }
        }
      };

      checkNewMessages();
    }
  }, [isClientView, clientId, token]);

  const fetchMessages = async () => {
    try {
      console.log('Cargando mensajes para cliente:', clientId);
      
      if (!isClientView) {
        // Lógica para admin/colaborador usando supabase
        const { data, error } = await supabase
          .from('client_messages')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Obtener emails de usuarios
        if (data && data.length > 0) {
          const userIds = [...new Set(data.filter(m => m.user_id).map(m => m.user_id))];
          
          if (userIds.length > 0) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('id, email')
              .in('id', userIds);

            if (!userError && userData) {
              const userMap = Object.fromEntries(userData.map(u => [u.id, u]));
              data.forEach(msg => {
                if (msg.user_id) {
                  msg.user = userMap[msg.user_id];
                }
              });
            }
          }
        }

        console.log('Mensajes cargados:', data);
        setMessages(data || []);
      } else {
        // Lógica para cliente usando fetch con token
        const headers = {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'x-client-token': token
        };

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/client_messages?select=*&client_id=eq.${clientId}&order=created_at.asc`,
          { headers }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error al cargar mensajes');
        }

        const data = await response.json();
        console.log('Mensajes cargados:', data);
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setIsLoading(true);
      console.log('Enviando mensaje como:', isClientView ? 'cliente' : 'admin/colaborador');

      if (!isClientView) {
        // Lógica para admin/colaborador usando supabase directamente
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const { error } = await supabase
          .from('client_messages')
          .insert([{
            client_id: clientId,
            message: newMessage.trim(),
            is_client: false,
            user_id: user.id
          }]);

        if (error) throw error;
      } else {
        // Lógica para cliente usando fetch con token
        const headers = {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'x-client-token': token
        };

        const messageData = {
          client_id: clientId,
          message: newMessage.trim(),
          is_client: true,
          user_id: null
        };

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/client_messages`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(messageData),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error al enviar mensaje');
        }
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert('Error al enviar mensaje: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (isClientView && token) {
      await supabase.rpc('update_last_seen', {
        p_client_id: clientId,
        p_access_token: token
      });
      // Actualizar estados locales
      setHasNewMessages(false);
      setNewMessagesCount(0);
    }
  };

  return (
    <>
      <Dialog open={showNewMessagesDialog} onOpenChange={setShowNewMessagesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¡Tienes mensajes nuevos!</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Bell className="h-6 w-6 text-blue-500" />
            <p className="text-lg">
              Tienes {newMessagesCount} {newMessagesCount === 1 ? 'mensaje nuevo' : 'mensajes nuevos'} sin leer.
            </p>
          </div>
          <DialogFooter>
            <Button 
              onClick={async () => {
                setShowNewMessagesDialog(false);
                scrollToBottom();
                await markMessagesAsRead(); // Marcar como leídos solo cuando el usuario hace clic
              }}
            >
              Ver mensajes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Mensajes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-[300px] overflow-y-auto border rounded-lg p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.is_client ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.is_client
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {format(new Date(msg.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                      {!msg.is_client && (
                        <span className="ml-1">
                          - {msg.user?.email}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                Enviar
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default ClientChat; 