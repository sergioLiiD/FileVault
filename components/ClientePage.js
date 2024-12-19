import { useState, useEffect } from 'react';
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { ChevronUp, ChevronDown, Check, X, FileUp, Eye, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import ClientAccess from './ClientAccess';
import ClientChat from './ClientChat';
import { ShareDocumentsDialog } from './ShareDocumentsDialog';

function ClientePage({ clientId, onBack, isClientView = false, token }) {
  const [cliente, setCliente] = useState(null);
  const [documentList, setDocumentList] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState(null);
  const [editingClient, setEditingClient] = useState(false);
  const [selectedArchivoIndex, setSelectedArchivoIndex] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    if (!clientId) {
      console.error('No se proporcionó ID de cliente');
      return;
    }

    const fetchData = async () => {
      try {
        console.log('Cargando documentos para cliente:', clientId);
        
        // Si no es vista de cliente, verificar permisos
        if (!isClientView) {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('No hay sesión activa');
          }

          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();

          if (!roleData || !['admin', 'colaborador'].includes(roleData.role)) {
            throw new Error('No tienes permisos para ver estos datos');
          }

          setUserRole(roleData.role);
        }

        // Cargar datos del cliente
        const { data: clientData, error: clientError } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', clientId)
          .single();

        if (clientError) {
          console.error('Error al cargar cliente:', clientError);
        } else {
          console.log('Cliente cargado:', clientData);
          setCliente(clientData);
        }

        // Cargar documentos en una consulta separada
        const { data: docList, error: docError } = await supabase
          .from('documentos_cliente')
          .select('*')
          .eq('cliente_id', clientId)
          .order('orden');

        if (docError) {
          console.error('Error al cargar documentos:', docError);
          throw docError;
        }

        console.log('Documentos cargados:', docList);
        setDocumentList(docList || []);

      } catch (error) {
        console.error('Error al cargar datos:', error);
        if (!isClientView) {
          alert('Error al cargar los datos: ' + error.message);
        }
      }
    };

    fetchData();

    // Solo cargar templates si no es vista de cliente
    if (!isClientView) {
      fetchTemplates();
    }
  }, [clientId, isClientView]);

  useEffect(() => {
    if (!isClientView && clientId) {
      // Marcar mensajes como leídos cuando el admin ve la página
      const markMessagesAsRead = async () => {
        await supabase.rpc('mark_messages_as_read', {
          p_client_id: clientId
        });
      };

      markMessagesAsRead();
    }
  }, [clientId, isClientView]);

  const fetchClientData = async () => {
    try {
      if (!clientId) {
        throw new Error('No se proporcionó ID de cliente');
      }

      console.log('Fetching client data with role:', userRole, 'clientId:', clientId);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      // Verificar el rol del usuario
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      console.log('Role data from DB:', roleData);

      if (!roleData || !['admin', 'colaborador'].includes(roleData.role)) {
        throw new Error('No tienes permisos para ver estos datos');
      }

      // Obtener datos del cliente
      const { data: clientData, error: clientError } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) {
        console.error('Error al obtener cliente:', clientError);
        throw clientError;
      }

      console.log('Client data:', clientData);
      setCliente(clientData);

      // Obtener documentos
      const { data: docList, error: docError } = await supabase
        .from('documentos_cliente')
        .select('*')
        .eq('cliente_id', clientId)
        .order('orden');

      if (docError) {
        console.error('Error al obtener documentos:', docError);
        throw docError;
      }

      console.log('Document list:', docList);
      setDocumentList(docList || []);
    } catch (error) {
      console.error('Error detallado:', error);
      alert('Error al cargar los datos del cliente: ' + error.message);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleImportTemplate = async (templateId) => {
    try {
      if (!templateId) {
        alert('Por favor, selecciona un template');
        return;
      }

      setIsLoading(true);
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        alert('Template no encontrado');
        return;
      }

      console.log('Template seleccionado:', template);
      console.log('Cliente ID:', clientId);

      // Obtener documentos existentes
      const { data: existingDocs, error: existingError } = await supabase
        .from('documentos_cliente')
        .select('nombre')
        .eq('cliente_id', clientId);

      if (existingError) throw existingError;

      const existingNames = new Set(existingDocs.map(d => d.nombre));

      // Filtrar solo documentos que no existen
      const newDocs = template.documentos
        .filter(doc => !existingNames.has(doc))
        .map((doc, index) => ({
          nombre: doc,
          estado: 'pendiente',
          orden: documentList.length + index,
          archivos: [],
          cliente_id: clientId
        }));

      if (newDocs.length === 0) {
        alert('Todos los documentos del template ya existen para este cliente');
        return;
      }

      console.log('Documentos a insertar:', newDocs);

      const { data, error } = await supabase
        .from('documentos_cliente')
        .insert(newDocs)
        .select();

      if (error) {
        console.error('Error detallado:', error);
        throw error;
      }

      console.log('Documentos insertados:', data);
      await fetchClientData();
      alert(`Template importado exitosamente. Se agregaron ${newDocs.length} documentos nuevos.`);
    } catch (error) {
      console.error('Error completo:', error);
      alert('Error al importar el template: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (documentIndex, file) => {
    try {
      const document = documentList[documentIndex];
      const hasApprovedFiles = document.archivos?.some(a => a.estado === 'aprobado');
      
      if (hasApprovedFiles) {
        alert('Este documento ya tiene archivos aprobados. Debe eliminar el documento y crearlo nuevamente para subir nuevos archivos.');
        return;
      }

      setIsLoading(true);

      // Sanitizar el nombre del archivo
      const sanitizedFileName = file.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^a-zA-Z0-9.-]/g, '_'); // Reemplazar caracteres especiales con _

      const fileName = `${clientId}/${document.id}/${Date.now()}_${sanitizedFileName}`;
      
      console.log('Intentando subir archivo:', fileName);

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error de subida:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(fileName);

      const newArchivos = [...(document.archivos || []), {
        url: publicUrl,
        nombre: file.name, // Mantener el nombre original para mostrar
        estado: 'pendiente'
      }];

      const { error: updateError } = await supabase
        .from('documentos_cliente')
        .update({ archivos: newArchivos })
        .eq('id', document.id);

      if (updateError) {
        console.error('Error de actualización:', updateError);
        throw updateError;
      }

      await fetchClientData();
      alert('Archivo subido exitosamente');
    } catch (error) {
      console.error('Error detallado:', error);
      alert('Error al subir el archivo: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentAction = async (documentIndex, archivoIndex, action) => {
    try {
      const document = documentList[documentIndex];
      const newArchivos = [...document.archivos];
      
      if (action === 'approve') {
        newArchivos[archivoIndex].estado = 'aprobado';
      } else if (action === 'reject') {
        setSelectedDocumentIndex(documentIndex);
        setSelectedArchivoIndex(archivoIndex);
        setShowRejectionModal(true);
        return;
      }

      const { error } = await supabase
        .from('documentos_cliente')
        .update({ archivos: newArchivos })
        .eq('id', document.id);

      if (error) throw error;
      await fetchClientData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el estado del documento');
    }
  };

  const handleRejectConfirm = async () => {
    try {
      const document = documentList[selectedDocumentIndex];
      const selectedArchivo = document.archivos[selectedArchivoIndex];
      const newArchivos = [...document.archivos];
      newArchivos[selectedArchivoIndex].estado = 'rechazado';
      newArchivos[selectedArchivoIndex].motivo_rechazo = rejectionReason;

      const { error } = await supabase
        .from('documentos_cliente')
        .update({ archivos: newArchivos })
        .eq('id', document.id);

      if (error) throw error;
      
      setShowRejectionModal(false);
      setRejectionReason('');
      setSelectedArchivoIndex(null);
      await fetchClientData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al rechazar el documento');
    }
  };

  const handleMoveDocument = async (index, direction) => {
    try {
      const newList = [...documentList];
      let updates = [];
      
      if (direction === 'up' && index > 0) {
        // Intercambiar documentos
        [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
        
        // Preparar actualizaciones
        updates = [
          { id: newList[index].id, orden: index },
          { id: newList[index - 1].id, orden: index - 1 }
        ];
      } else if (direction === 'down' && index < newList.length - 1) {
        // Intercambiar documentos
        [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
        
        // Preparar actualizaciones
        updates = [
          { id: newList[index].id, orden: index },
          { id: newList[index + 1].id, orden: index + 1 }
        ];
      } else {
        return;
      }

      // Actualizar la UI inmediatamente
      setDocumentList(newList);

      // Actualizar todos los documentos afectados en la base de datos
      for (const update of updates) {
        const { error } = await supabase
          .from('documentos_cliente')
          .update({ orden: update.orden })
          .eq('id', update.id);

        if (error) throw error;
      }

      // Recargar los documentos para asegurar el orden correcto
      const { data: docList, error: docError } = await supabase
        .from('documentos_cliente')
        .select('*')
        .eq('cliente_id', clientId)
        .order('orden');

      if (docError) throw docError;
      setDocumentList(docList);

    } catch (error) {
      console.error('Error al reordenar documentos:', error);
      alert('Error al reordenar documentos');
      // Recargar los documentos en caso de error
      await fetchClientData();
    }
  };

  const handleAddDocument = async () => {
    try {
      setIsLoading(true);

      const newDoc = {
        nombre: 'Nuevo Documento',
        estado: 'pendiente',
        orden: documentList.length,
        archivos: [],
        cliente_id: clientId
      };

      const { data, error } = await supabase
        .from('documentos_cliente')
        .insert([newDoc])
        .select();

      if (error) {
        console.error('Error detallado:', error);
        throw error;
      }

      setDocumentList([...documentList, data[0]]);
    } catch (error) {
      console.error('Error completo:', error);
      alert('Error al agregar documento: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDocument = async (documentId) => {
    try {
      const { error } = await supabase
        .from('documentos_cliente')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
      await fetchClientData();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar documento');
    }
  };

  const handleDocumentChange = async (index, value) => {
    try {
      const newDocList = [...documentList];
      newDocList[index] = { ...newDocList[index], nombre: value };
      setDocumentList(newDocList);

      const document = documentList[index];
      const { error } = await supabase
        .from('documentos_cliente')
        .update({ nombre: value })
        .eq('id', document.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el nombre del documento');
      await fetchClientData();
    }
  };

  const handleSaveClient = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('clientes')
        .update(cliente)
        .eq('id', cliente.id);

      if (error) throw error;
      setEditingClient(false);
      alert('Datos del cliente actualizados exitosamente');
      
      // Notificar al componente padre que el cliente fue actualizado
      onClientUpdate?.(cliente);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar los datos del cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentStatus = (doc) => {
    if (!doc.archivos || doc.archivos.length === 0) return 'pending';
    if (doc.archivos.some(a => a.estado === 'aprobado')) return 'approved';
    if (doc.archivos.some(a => a.estado === 'rechazado')) return 'rejected';
    return 'pending';
  };

  const handleDeleteFile = async (documentIndex, archivoIndex) => {
    try {
      const document = documentList[documentIndex];
      const archivo = document.archivos[archivoIndex];

      // Verificar si el archivo está aprobado
      if (archivo.estado === 'aprobado') {
        alert('No se pueden eliminar archivos que ya han sido aprobados');
        return;
      }

      if (!confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
        return;
      }

      setIsLoading(true);

      // Eliminar el archivo del storage
      const fileName = archivo.url.split('/').pop();
      const filePath = `${clientId}/${document.id}/${fileName}`;
      
      const { error: storageError } = await supabase.storage
        .from('documentos')
        .remove([filePath]);

      if (storageError) {
        console.error('Error al eliminar archivo del storage:', storageError);
      }

      // Actualizar el documento sin el archivo eliminado
      const newArchivos = document.archivos.filter((_, index) => index !== archivoIndex);
      
      const { error: updateError } = await supabase
        .from('documentos_cliente')
        .update({ archivos: newArchivos })
        .eq('id', document.id);

      if (updateError) throw updateError;

      await fetchClientData();
      alert('Archivo eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      alert('Error al eliminar el archivo');
    } finally {
      setIsLoading(false);
    }
  };

  const allDocumentsApproved = () => {
    console.log('Estado actual:', {
      documentList,
      documentCount: documentList.length,
      isClientView,
      userRole
    });

    if (documentList.length === 0) {
      console.log('No hay documentos');
      return false;
    }

    const allApproved = documentList.every(doc => {
      const hasApprovedFile = doc.archivos && 
        doc.archivos.some(archivo => archivo.estado === 'aprobado');
      console.log(`Documento "${doc.nombre}":`, {
        archivos: doc.archivos,
        hasApprovedFile
      });
      return hasApprovedFile;
    });

    console.log('Resultado final:', allApproved);
    return allApproved;
  };

  if (!userRole && !isClientView) {
    console.log('No hay rol de usuario:', { userRole, isClientView });
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando permisos... Por favor espere.</p>
      </div>
    );
  }

  if (!['admin', 'colaborador'].includes(userRole) && !isClientView) {
    console.log('Rol no autorizado:', userRole);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500">No tienes permisos para ver esta página</p>
        <p>Tu rol actual es: {userRole || 'sin rol'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button onClick={onBack} variant="outline">
          Volver
        </Button>
        <div className="flex gap-2">
          {console.log('Condiciones del botón:', {
            isClientView,
            allApproved: allDocumentsApproved()
          })}
          {!isClientView && allDocumentsApproved() && (
            <Button 
              onClick={() => setShowShareDialog(true)}
              variant="secondary"
              className="bg-green-100 hover:bg-green-200 text-green-700"
            >
              Compartir Documentos Aprobados
            </Button>
          )}
          {!isClientView && (
            <Button onClick={() => setEditingClient(!editingClient)}>
              {editingClient ? 'Cancelar' : 'Editar Cliente'}
            </Button>
          )}
        </div>
      </div>

      {!isClientView && (
        <Card>
          <CardHeader>
            <CardTitle>Datos del Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            {editingClient ? (
              <div className="space-y-4">
                <Input
                  value={cliente?.nombre || ''}
                  onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                  placeholder="Nombre"
                />
                <Input
                  value={cliente?.email || ''}
                  onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
                  placeholder="Email"
                />
                <Input
                  value={cliente?.telefono || ''}
                  onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                  placeholder="Teléfono"
                />
                <Button onClick={handleSaveClient}>Guardar Cambios</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p><strong>Nombre:</strong> {cliente?.nombre}</p>
                <p><strong>Email:</strong> {cliente?.email}</p>
                <p><strong>Teléfono:</strong> {cliente?.telefono}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isClientView && (
        <ClientAccess 
          clientId={clientId} 
          clientName={cliente?.nombre || 'Cliente'}
        />
      )}

      {!isClientView && (
        <div className="flex justify-between items-center">
          <select
            className="border p-2 rounded"
            onChange={(e) => handleImportTemplate(e.target.value)}
            disabled={isLoading}
          >
            <option value="">Seleccionar Template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.nombre}
              </option>
            ))}
          </select>
          <Button onClick={handleAddDocument} disabled={isLoading}>
            Agregar Documento
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {documentList.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed">
            <p className="text-gray-500">
              No hay documentos disponibles en este momento.
              {!isClientView && " Puedes agregar documentos usando el botón 'Agregar Documento' o importar un template."}
            </p>
          </div>
        ) : (
          documentList.map((doc, index) => {
            const status = getDocumentStatus(doc);
            return (
              <Card 
                key={doc.id}
                className={cn(
                  "transition-colors duration-200 border-2",
                  status === 'approved' && "bg-green-50/50 border-green-300",
                  status === 'rejected' && "bg-red-50/50 border-red-300"
                )}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                    {!isClientView && (
                      <div className="flex gap-1 order-1 lg:order-none">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveDocument(index, 'up')}
                          disabled={isLoading || index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveDocument(index, 'down')}
                          disabled={isLoading || index === documentList.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <div className="flex-1 flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full lg:w-auto order-3 lg:order-none">
                      {isClientView ? (
                        <h3 className="text-lg font-semibold flex-1 w-full lg:w-auto">{doc.nombre}</h3>
                      ) : (
                        <Input
                          value={doc.nombre}
                          onChange={(e) => handleDocumentChange(index, e.target.value)}
                          placeholder="Nombre del documento"
                          className={cn(
                            "flex-1 border-2 text-lg w-full lg:w-auto",
                            status === 'approved' && "bg-green-50/50 border-green-300",
                            status === 'rejected' && "bg-red-50/50 border-red-300"
                          )}
                          autoComplete="off"
                          spellCheck="false"
                          style={{ fontSize: '1.125rem' }}
                        />
                      )}

                      <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-auto">
                        {doc.archivos?.map((archivo, archivoIndex) => (
                          <div 
                            key={archivoIndex}
                            className={cn(
                              "flex flex-col gap-1 w-full lg:w-auto",
                              archivo.estado === 'aprobado' && "bg-green-100/50 border-green-300",
                              archivo.estado === 'rechazado' && "bg-red-100/50 border-red-300"
                            )}
                          >
                            <div className="flex items-center gap-2 px-3 py-1 rounded border">
                              <span className="text-sm truncate max-w-[150px]">{archivo.nombre}</span>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(archivo.url, '_blank')}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {!isClientView && archivo.estado === 'pendiente' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDocumentAction(index, archivoIndex, 'approve')}
                                      className="h-8 w-8 p-0 text-green-500 hover:bg-green-100"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDocumentAction(index, archivoIndex, 'reject')}
                                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-100"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {archivo.estado !== 'aprobado' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteFile(index, archivoIndex)}
                                    className="h-8 w-8 p-0 text-red-500 hover:bg-red-100"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            {archivo.estado === 'rechazado' && (
                              <div className="text-red-500 text-xs px-3">
                                Motivo: {archivo.motivo_rechazo}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-row lg:flex-row items-center gap-2 order-2 lg:order-none w-full lg:w-auto justify-end">
                      <input
                        type="file"
                        id={`file-${doc.id}`}
                        className="hidden"
                        onChange={(e) => handleFileUpload(index, e.target.files[0])}
                      />
                      <label
                        htmlFor={`file-${doc.id}`}
                        className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm whitespace-nowrap"
                      >
                        <FileUp className="h-4 w-4 mr-2" />
                        Subir Archivo
                      </label>

                      {!isClientView && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveDocument(doc.id)}
                          disabled={isLoading}
                          className="whitespace-nowrap"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={showRejectionModal} onOpenChange={setShowRejectionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo de Rechazo</DialogTitle>
          </DialogHeader>
          <Input
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Ingrese el motivo del rechazo"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectionModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRejectConfirm}>
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShareDocumentsDialog 
        clientId={clientId}
        clientName={cliente?.nombre || 'Cliente'}
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
      />

      <ClientChat 
        clientId={clientId}
        isClientView={isClientView}
        token={token}
      />
    </div>
  );
}

export default ClientePage; 