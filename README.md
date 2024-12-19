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

## Deployment

### Netlify Continuous Deployment

El proyecto está configurado con Continuous Deployment en Netlify:

1. **Flujo de Trabajo**
   - Push a la rama `main` en GitHub
   - Netlify detecta cambios automáticamente
   - Se inicia nuevo build y deploy
   - Sitio se actualiza en producción

2. **Variables de Entorno en Netlify**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://yaqeiebxufbqynbbywiu.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   NEXT_PUBLIC_APP_URL=https://filevault.netlify.app
   ```

3. **Configuración del Build**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18.x

### Variables de Entorno y Seguridad

#### Claves de Supabase
El sistema utiliza dos tipos de claves de acceso a Supabase:

1. **Clave Anónima (Frontend)**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://yaqeiebxufbqynbbywiu.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   ```
   - Usada en el cliente
   - Permisos limitados por RLS
   - Segura para exponer en el frontend

2. **Clave de Servicio (Backend)**
   ```env
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   ```
   - Solo para operaciones del servidor
   - Acceso completo a la base de datos
   - Usada en:
     - API routes (/api/*)
     - Operaciones administrativas
     - Gestión de usuarios
     - Operaciones bypass RLS

#### Configuración en Netlify
Todas las variables deben configurarse en:
1. Settings → Environment variables
2. Incluir tanto las claves públicas como privadas
3. Asegurarse de que la clave de servicio esté presente para:
   - Gestión de usuarios
   - Invitaciones
   - Operaciones administrativas

### Seguridad

+ ⚠️ **IMPORTANTE: Nunca subir las keys de Supabase al repositorio**
+ - Las keys deben configurarse en variables de entorno
+ - Especialmente la `SUPABASE_SERVICE_ROLE_KEY` que da acceso completo
+ - Configurar las keys solo en el panel de Netlify