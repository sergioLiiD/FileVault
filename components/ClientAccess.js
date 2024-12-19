import { useState } from 'react';
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card"
import { supabase } from '../lib/supabase';

function ClientAccess({ clientId, clientName }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accessLink, setAccessLink] = useState('');

  const generateAccessLink = async () => {
    try {
      setIsLoading(true);
      
      // Generar token único
      const accessToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Expira en 30 días

      // Obtener el usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const accessData = {
        client_id: clientId,
        access_token: accessToken,
        expires_at: expiresAt.toISOString(),
        created_by: user.id
      };

      console.log('Intentando crear acceso:', accessData);

      // Guardar en base de datos
      const { data, error } = await supabase
        .from('client_access')
        .insert([accessData])
        .select()
        .single();

      if (error) {
        console.error('Error al guardar acceso:', error);
        throw error;
      }

      console.log('Acceso creado exitosamente:', data);

      // Generar link
      const link = `${window.location.origin}/client-access/${accessToken}`;
      setAccessLink(link);
      
      alert('Link de acceso generado exitosamente');
    } catch (error) {
      console.error('Error detallado:', error);
      alert('Error al generar link de acceso: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const inviteByEmail = async () => {
    try {
      setIsLoading(true);

      // Crear usuario en Supabase
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password: crypto.randomUUID(), // Contraseña temporal
        options: {
          emailRedirectTo: `${window.location.origin}/client-register?email=${email}`,
          data: {
            temp_client_id: clientId
          }
        }
      });

      if (signUpError) throw signUpError;

      // Asignar rol de cliente
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: user.id,
          role: 'cliente'
        }]);

      if (roleError) throw roleError;

      // Crear acceso al cliente
      const { error: accessError } = await supabase
        .from('client_access')
        .insert([{
          client_id: clientId,
          user_id: user.id
        }]);

      if (accessError) throw accessError;

      alert('Invitación enviada exitosamente. El cliente recibirá un email para completar su registro.');
      setEmail('');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al enviar invitación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acceso para {clientName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Generar Link de Acceso</h3>
          <Button
            onClick={generateAccessLink}
            disabled={isLoading}
          >
            Generar Link
          </Button>
          {accessLink && (
            <div className="mt-2">
              <Input
                value={accessLink}
                readOnly
                onClick={(e) => e.target.select()}
              />
              <p className="text-sm text-gray-500 mt-1">
                Este link expirará en 30 días
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Invitar por Email</h3>
          <div className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email del cliente"
            />
            <Button
              onClick={inviteByEmail}
              disabled={isLoading || !email}
            >
              Invitar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ClientAccess; 