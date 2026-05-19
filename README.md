# ReservaFlow - Sistema de Reservas de Salas (MVP)

ReservaFlow es un sistema moderno de gestión y reserva de salas de reuniones con un motor de políticas avanzado, paneles dedicados para usuarios y administradores, y una analítica interactiva y ligera. Diseñado bajo Next.js App Router (v15) con TypeScript estricto y estilos 100% integrados en Tailwind CSS.

Este MVP cuenta con una arquitectura de repositorios desacoplada: funciona con archivos JSON locales pero está totalmente preparado para migrar a **Supabase (PostgreSQL)** en pocos minutos sin tocar la lógica de negocio.

---

## 🚀 Inicio Rápido (Local)

### 1. Instalación de Dependencias
Asegúrese de contar con Node.js (v18+) instalado en su sistema. Ejecute el siguiente comando en la raíz del proyecto para instalar las dependencias necesarias:

```bash
npm install
```

### 2. Configurar Variables de Entorno
Cree un archivo `.env.local` en la raíz del proyecto copiando la plantilla base:

```env
# Secreto para firmar tokens JWT (Cambiar por un string seguro en producción)
JWT_SECRET=super-secret-token-key-for-reservaflow-mvp-2026

# Control de persistencia: 'json' o 'supabase' (Por defecto: json)
DATABASE_PROVIDER=json

# Supabase Credentials (Requerido solo al migrar a Supabase)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 3. Ejecutar el Servidor de Desarrollo
Para levantar el servidor en modo desarrollo:

```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) en su navegador para interactuar con la aplicación.

---

## 🔐 Cuentas de Demostración (Seed Data)

El sistema incluye las siguientes credenciales pre-cargadas para pruebas inmediatas:

*   **Usuario Estándar**:
    *   **Email**: `user@demo.com`
    *   **Contraseña**: `User123!`
    *   **Rol**: `user`
*   **Administrador**:
    *   **Email**: `admin@demo.com`
    *   **Contraseña**: `Admin123!`
    *   **Rol**: `admin`

---

## 🏢 Arquitectura y Estructura Clave

```
├── data/                    # Archivos JSON locales de persistencia MVP
├── src/
│   ├── app/                 # Rutas de Next.js App Router
│   │   ├── admin/           # Panel de administración e indicadores
│   │   ├── dashboard/       # Portal de usuario para reservas
│   │   ├── login/           # Pantalla de acceso premium
│   │   ├── register/        # Registro de usuarios automatizado
│   │   ├── api/             # Rutas API REST de Next.js
│   │   └── page.tsx         # Página de inicio + Booking Wizard
│   ├── lib/
│   │   ├── auth/            # Módulo de firmas JWT, hashes SHA256 y sesiones
│   │   ├── policies/        # Motor central de validación de reservas y solapamientos
│   │   └── repositories/    # Capa de adaptadores persistentes (Factory, JSON, Supabase)
│   └── types/               # Modelos estrictos de TypeScript
```

---

## ☁️ Despliegue en Vercel

El MVP está optimizado para funcionar en el plan gratuito de Vercel. 
1. Suba este repositorio a su cuenta de GitHub/GitLab.
2. Cree un nuevo proyecto en Vercel apuntando a este repositorio.
3. Configure la variable de entorno `JWT_SECRET` en el dashboard de Vercel.
4. Presione **Deploy**. La aplicación estará lista, ejecutando de forma segura los endpoints sin costo de base de datos gracias a la persistencia del sistema de archivos local (para pruebas no persistentes de sesión) o conectándose directamente a su Supabase.

---

## 🗄️ Plan de Migración a Supabase (PostgreSQL)

Para migrar a una base de datos persistente en producción con Supabase, siga los siguientes pasos detallados:

### 1. Creación de Tablas en Supabase
Ejecute el siguiente script SQL en el **SQL Editor** de su consola de Supabase:

```sql
-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- 1. Tabla de Usuarios
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  phone text,
  notes text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabla de Salas
create table public.rooms (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null,
  capacity integer not null,
  image_url text,
  is_active boolean not null default true,
  policies_override jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabla de Servicios
create table public.services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null,
  duration_block integer not null,
  color text not null default 'indigo',
  is_active boolean not null default true,
  policies_override jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabla de Reservas
create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  room_name text not null,
  service_name text not null,
  user_name text not null,
  user_email text not null,
  start_date_time timestamp with time zone not null,
  end_date_time timestamp with time zone not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'no_show')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tabla de Configuraciones
create table public.settings (
  id text primary key default 'system',
  global_policies jsonb not null,
  special_dates jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 2. Configurar RLS (Row Level Security) para Reservas
Active RLS en la tabla `bookings` de Supabase para evitar accesos indebidos y automatizar políticas:

```sql
alter table public.bookings enable row_level_security;

-- Política de Lectura (Select): Permitir a usuarios autenticados ver sus propias reservas y a los admins ver todas
create policy "Select bookings" on public.bookings
  for select using (
    auth.uid() = user_id or 
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Política de Inserción (Insert): Permitir a usuarios autenticados crear reservas para ellos mismos
create policy "Insert bookings" on public.bookings
  for insert with check (
    auth.uid() = user_id or
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- Política de Modificación (Update): Permitir a usuarios cancelar o reprogramar sus reservas, o control total a admins
create policy "Update bookings" on public.bookings
  for update using (
    auth.uid() = user_id or
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );
```

### 3. Activar el Proveedor en ReservaFlow
Modifique la variable de entorno en su `.env.local` o en Vercel:

```env
DATABASE_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-clave-secreta-service-role
```

Nuestra capa de adaptadores en `src/lib/repositories/factory.ts` identificará automáticamente el proveedor y comenzará a consultar su base de datos Supabase en tiempo real sin requerir modificaciones en las páginas o componentes.
