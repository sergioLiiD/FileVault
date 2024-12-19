# FileVault - Sistema de Gestión de Documentos

## Descripción General
FileVault es una plataforma web para la gestión de documentos y expedientes de clientes, diseñada para organizaciones que necesitan mantener y revisar documentación de sus clientes de manera organizada y segura.

## Stack Tecnológico

### Frontend
- **Next.js 14** - Framework de React con Server-Side Rendering
- **React 18** - Biblioteca para interfaces de usuario
- **TailwindCSS** - Framework de CSS utilitario
- **shadcn/ui** - Componentes de UI reutilizables
- **Lucide Icons** - Iconos vectoriales
- **date-fns** - Utilidades para manejo de fechas
- **sonner** - Sistema de notificaciones toast

### Backend
- **Supabase** - Plataforma Backend-as-a-Service
  - Base de datos PostgreSQL
  - Autenticación y Autorización
  - Almacenamiento de archivos
  - Row Level Security (RLS)
  - Tiempo real con WebSockets

### Lenguajes
- **JavaScript/JSX** - Lenguaje principal
- **SQL** - Consultas y políticas de base de datos
- **CSS** - Estilos (via TailwindCSS)

## Características Principales

### 1. Sistema de Usuarios y Roles
- **Roles disponibles**:
  - Admin: Control total del sistema
  - Colaborador: Acceso limitado según permisos
  - Cliente: Acceso solo a su documentación

- **Permisos configurables para colaboradores**:
  - Crear clientes
  - Enviar mensajes
  - Gestionar documentos

### 2. Gestión de Organizaciones
- Cada admin representa una organización independiente
- Los colaboradores pertenecen a una organización específica
- Aislamiento completo de datos entre organizaciones

### 3. Gestión de Clientes
- Registro de información básica (nombre, email, teléfono)
- Dashboard con estadísticas de documentos:
  - Total de documentos requeridos
  - Documentos subidos
  - Documentos aprobados
  - Documentos rechazados
- Sistema de mensajería integrado

### 4. Gestión de Documentos
- Templates de documentos personalizables
- Control de versiones de documentos
- Estados de documentos:
  - Pendiente
  - Subido
  - Aprobado
  - Rechazado
- Notificaciones de cambios de estado

### 5. Sistema de Comunicación
- Chat integrado por cliente
- Notificaciones en tiempo real
- Contador de mensajes no leídos
- Historial de comunicaciones

### 6. Sistema de Compartir Documentos
- Generación de links únicos de acceso
- Configuración de fecha de expiración
- Control de permisos de descarga
- Vista pública sin autenticación
- Acceso solo a documentos aprobados
- Interfaz limpia para usuarios externos

## Estructura del Proyecto

### Tablas Principales

#### 1. organizations 