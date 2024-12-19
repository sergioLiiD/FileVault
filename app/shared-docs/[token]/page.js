'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { FileDown, Eye } from 'lucide-react';

export default function SharedDocsPage({ params }) {
  const { token } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [access, setAccess] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    const validateAndLoadDocs = async () => {
      try {
        // 1. Validar el token y obtener acceso
        const { data: accessData, error: accessError } = await supabase
          .from('shared_document_access')
          .select(`
            *,
            clientes (
              nombre
            )
          `)
          .eq('access_token', token)
          .single();

        if (accessError) throw accessError;
        if (!accessData) throw new Error('Link de acceso no válido');

        // Verificar expiración
        if (new Date(accessData.expires_at) < new Date()) {
          throw new Error('Este link ha expirado');
        }

        setAccess(accessData);
        setClientName(accessData.clientes?.nombre || 'Cliente');

        // 2. Cargar documentos aprobados
        const { data: docs, error: docsError } = await supabase
          .from('documentos_cliente')
          .select('*')
          .eq('cliente_id', accessData.client_id);

        if (docsError) throw docsError;

        // Filtrar solo documentos con archivos aprobados
        const approvedDocs = docs
          .map(doc => ({
            ...doc,
            archivos: doc.archivos?.filter(a => a.estado === 'aprobado') || []
          }))
          .filter(doc => doc.archivos.length > 0);

        setDocuments(approvedDocs);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    validateAndLoadDocs();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando documentos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">
            Documentos de {clientName}
          </h1>
          <p className="text-gray-500">
            Link válido hasta el {new Date(access.expires_at).toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-4">
          {documents.map((doc) => (
            <div 
              key={doc.id}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold mb-4">{doc.nombre}</h2>
              <div className="space-y-2">
                {doc.archivos.map((archivo, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <span className="text-sm">{archivo.nombre}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(archivo.url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      {access.access_type === 'download' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(archivo.url, '_blank')}
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 