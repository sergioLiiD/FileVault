'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ClientePage from '@/components/ClientePage';
import { Button } from "@/components/ui/button";

export default function ClientAccessPage({ params }) {
  const { token } = params;
  const router = useRouter();
  const [clientId, setClientId] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateAccess = async () => {
      try {
        console.log('Validando token:', token);

        // Verificar el token y obtener datos del cliente en una sola consulta
        const { data: accessData, error: accessError } = await supabase
          .from('client_access')
          .select(`
            id,
            client_id,
            access_token,
            expires_at,
            created_at,
            created_by,
            clients:clientes (
              id,
              nombre,
              email,
              telefono,
              user_id
            )
          `)
          .eq('access_token', token)
          .single();

        console.log('Respuesta completa:', { accessData, accessError });

        if (accessError) {
          console.error('Error de validación:', accessError);
          throw accessError;
        }

        if (!accessData) {
          console.error('Token no encontrado en la base de datos');
          setError('Link de acceso inválido');
          return;
        }

        // Verificar si el link ha expirado
        if (new Date(accessData.expires_at) < new Date()) {
          console.error('Token expirado:', {
            expires_at: accessData.expires_at,
            now: new Date().toISOString()
          });
          setError('Este link ha expirado');
          return;
        }

        // Obtener documentos del cliente
        const { data: documents, error: docsError } = await supabase
          .from('documentos_cliente')
          .select('*')
          .eq('cliente_id', accessData.client_id)
          .order('orden');

        console.log('Documentos encontrados:', documents);

        if (docsError) {
          console.error('Error al obtener documentos:', docsError);
          throw docsError;
        }

        setClientId(accessData.client_id);
        setClientData(accessData.clients);
      } catch (err) {
        console.error('Error detallado:', err);
        setError('Error al validar el acceso: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    validateAccess();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Validando acceso...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Button 
          onClick={() => router.push('/')}
          variant="outline"
        >
          Volver al inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6 pb-6 border-b">
            <h1 className="text-2xl font-bold mb-4">
              Portal de Documentos
            </h1>
            <div className="space-y-2">
              <p><strong>Cliente:</strong> {clientData?.nombre}</p>
              <p><strong>Email:</strong> {clientData?.email}</p>
              <p><strong>Teléfono:</strong> {clientData?.telefono}</p>
            </div>
          </div>

          <div className="text-gray-600">
            <p className="mb-4">Bienvenido al portal de documentos.</p>
            <p className="font-medium mb-2">Instrucciones:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Revisa la lista de documentos requeridos</li>
              <li>Usa el botón "Subir Archivo" para cada documento</li>
              <li>Los documentos subidos serán revisados por nuestro equipo</li>
              <li>Podrás ver el estado de cada documento (pendiente, aprobado o rechazado)</li>
            </ul>
          </div>
        </div>

        <ClientePage 
          clientId={clientId} 
          onBack={() => router.push('/')}
          isClientView={true}
          token={token}
        />
      </div>
    </div>
  );
} 