'use client';

import { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Calendar } from "./ui/calendar";
import { Switch } from "./ui/switch";
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Copy, Mail } from 'lucide-react';

export function ShareDocumentsDialog({ 
  clientId, 
  clientName,
  isOpen, 
  onClose 
}) {
  const [expirationDate, setExpirationDate] = useState(addDays(new Date(), 30));
  const [allowDownloads, setAllowDownloads] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  const handleShare = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      // Generar token único
      const accessToken = crypto.randomUUID();

      const { data, error } = await supabase
        .from('shared_document_access')
        .insert([{
          client_id: clientId,
          access_token: accessToken,
          created_by: user.id,
          expires_at: expirationDate.toISOString(),
          access_type: allowDownloads ? 'download' : 'view'
        }])
        .select()
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/shared-docs/${accessToken}`;
      setShareUrl(url);
      toast.success('Link de acceso generado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al generar link de acceso');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copiado al portapapeles');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al copiar el link');
    }
  };

  const sendByEmail = () => {
    const subject = encodeURIComponent(`Documentos compartidos de ${clientName}`);
    const body = encodeURIComponent(`Accede a los documentos aquí: ${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir Documentos de {clientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!shareUrl ? (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Fecha de expiración</p>
                  <p className="text-sm text-gray-500">
                    El link expirará el {format(expirationDate, "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  Cambiar
                </Button>
              </div>

              {showCalendar && (
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  onSelect={(date) => {
                    setExpirationDate(date);
                    setShowCalendar(false);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Permitir descargas</p>
                  <p className="text-sm text-gray-500">
                    Los usuarios podrán descargar los documentos
                  </p>
                </div>
                <Switch
                  checked={allowDownloads}
                  onCheckedChange={setAllowDownloads}
                />
              </div>

              <Button
                onClick={handleShare}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Generando...' : 'Generar Link de Acceso'}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={sendByEmail}
              >
                <Mail className="h-4 w-4 mr-2" />
                Enviar por Email
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 