import { useState, useEffect } from 'react';
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card"
import { supabase } from '../lib/supabase';
import { ChevronUp, ChevronDown } from 'lucide-react';

function TemplateList() {
  const [templateName, setTemplateName] = useState('');
  const [documentList, setDocumentList] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No hay usuario autenticado');
        return;
      }

      console.log('Obteniendo templates para el usuario:', user.id);
      
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al obtener templates:', error);
        throw error;
      }

      console.log('Templates obtenidos:', data);
      setTemplates(data || []);
    } catch (error) {
      console.error('Error al cargar templates:', error);
      alert('Error al cargar los templates');
    }
  };

  const handleAddDocument = () => {
    setDocumentList([...documentList, '']);
  };

  const handleDocumentChange = (index, value) => {
    const newList = [...documentList];
    newList[index] = value;
    setDocumentList(newList);
  };

  const handleRemoveDocument = (index) => {
    const newList = documentList.filter((_, i) => i !== index);
    setDocumentList(newList);
  };

  const handleMoveDocument = (index, direction) => {
    const newList = [...documentList];
    if (direction === 'up' && index > 0) {
      [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
    } else if (direction === 'down' && index < newList.length - 1) {
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    }
    setDocumentList(newList);
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este template?')) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('templates')
        .delete()
        .match({ id });

      if (error) throw error;

      await fetchTemplates();
      alert('Template eliminado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateName(template.nombre);
    setDocumentList(template.documentos);
    setShowForm(true);
  };

  const handleSaveTemplate = async () => {
    try {
      setIsLoading(true);
      console.log('Iniciando guardado de template...');
      
      if (!templateName) {
        alert('Por favor, ingresa un nombre para el template');
        return;
      }

      if (documentList.some(doc => !doc.trim())) {
        alert('Por favor, completa todos los documentos');
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Usuario actual:', user);
      
      if (userError) {
        console.error('Error al obtener usuario:', userError);
        throw userError;
      }
      
      if (!user) {
        alert('Debes iniciar sesión para guardar templates');
        return;
      }

      const templateData = {
        nombre: templateName,
        documentos: documentList.filter(doc => doc.trim()),
        user_id: user.id
      };

      console.log('Datos a guardar:', templateData);

      let error;

      if (editingTemplate) {
        console.log('Actualizando template existente:', editingTemplate.id);
        const { error: updateError } = await supabase
          .from('templates')
          .update(templateData)
          .eq('id', editingTemplate.id);
        error = updateError;
      } else {
        console.log('Creando nuevo template');
        const { error: insertError } = await supabase
          .from('templates')
          .insert([templateData])
          .select();
        error = insertError;
      }

      if (error) {
        console.error('Error detallado:', error);
        throw error;
      }

      console.log('Template guardado exitosamente');
      await fetchTemplates();
      alert(editingTemplate ? 'Template actualizado exitosamente' : 'Template guardado exitosamente');
      setTemplateName('');
      setDocumentList(['']);
      setShowForm(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error completo:', error);
      alert('Error al guardar el template: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setTemplateName('');
    setDocumentList(['']);
  };

  const handleNewTemplate = () => {
    if (showForm) {
      // Si el formulario está visible, lo cerramos y limpiamos
      handleCancelEdit();
    } else {
      // Si el formulario está oculto, lo mostramos
      setShowForm(true);
      setEditingTemplate(null);
      setTemplateName('');
      setDocumentList(['']);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={handleNewTemplate}
          variant="outline"
        >
          {showForm ? 'Cancelar' : 'Nuevo Template'}
        </Button>
      </div>

      {showForm && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {editingTemplate ? 'Editar Template' : 'Crear Template de Documentos'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Nombre del Template (ej: Documentos Básicos)"
              disabled={isLoading}
            />
            
            {documentList.map((doc, index) => (
              <div key={index} className="flex gap-2 items-center">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 py-0 h-6"
                    onClick={() => handleMoveDocument(index, 'up')}
                    disabled={isLoading || index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 py-0 h-6"
                    onClick={() => handleMoveDocument(index, 'down')}
                    disabled={isLoading || index === documentList.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  value={doc}
                  onChange={(e) => handleDocumentChange(index, e.target.value)}
                  placeholder="Nombre del documento"
                  disabled={isLoading}
                />
                <Button
                  variant="destructive"
                  onClick={() => handleRemoveDocument(index)}
                  disabled={isLoading || documentList.length === 1}
                >
                  Eliminar
                </Button>
              </div>
            ))}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleAddDocument}
                disabled={isLoading}
                className="w-full"
              >
                Agregar Documento
              </Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Guardando...' : 'Guardar Template'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{template.nombre}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                    disabled={isLoading}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    disabled={isLoading}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {template.documentos.map((doc, index) => (
                  <li key={index} className="text-sm">
                    {doc}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default TemplateList; 