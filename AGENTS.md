# ReservaFlow - Guía de Arquitectura para Copilotos y Agentes

Este documento describe la estructura arquitectónica rigurosa, reglas de desarrollo y decisiones tecnológicas del sistema **ReservaFlow**. Todo agente de Inteligencia Artificial que continúe, modifique o expanda este repositorio debe cumplir estrictamente con los lineamientos descritos a continuación.

---

## 1. Arquitectura en Capas y Desacoplamiento

El sistema está organizado en una arquitectura de capas bien diferenciadas:

```
┌────────────────────────────────────────────────────────┐
│                        Capas                           │
├────────────────────────────────────────────────────────┤
│  1. Capa de UI (Next.js Server & Client Components)   │
│         │                                              │
│         ▼                                              │
│  2. Capa de Negocio / Políticas de Dominio             │
│         │                                              │
│         ▼                                              │
│  3. Capa de Acceso a Datos (Patrón Repositorio)        │
│         ├─ JSON Filesystem (MVP)                       │
│         └─ Supabase Client API (Producción)            │
└────────────────────────────────────────────────────────┘
```

### Reglas Críticas:
1. **Patrón Repositorio Estricto**:
   - Las páginas, componentes o manejadores de API **nunca** interactúan directamente con los archivos JSON o las tablas de base de datos.
   - Todo acceso de lectura y escritura debe realizarse invocando los repositorios exportados en `src/lib/repositories/factory.ts`.
2. **Abstracción del Repositorio**:
   - El archivo `factory.ts` unifica e instancia de forma única las implementaciones de base de datos.
   - Para cambiar toda la persistencia del sistema de archivos JSON a Supabase en producción, solo se debe cambiar la variable de entorno o alternar la importación en una sola línea del archivo `src/lib/repositories/factory.ts`.
3. **Cero Lógica en UI**:
   - Los formularios y vistas de usuario deben capturar la entrada e invocar los controladores backend.
   - Las reglas de negocio (cruces de horarios, límites, capacidades, fechas bloqueadas) se ejecutan de manera centralizada en el backend a través del **Policies Engine** en `src/lib/policies/index.ts`.

---

## 2. Pautas de Interfaz y Estilos (Tailwind CSS Obligatorio)

1. **Estrategia Única**:
   - Se utiliza **Tailwind CSS** como el único sistema de estilos visuales.
   - Está **estrictamente prohibido** utilizar CSS Modular por componente, librerías de estilos CSS-in-JS (como styled-components o emotion), o frameworks adicionales de componentes con dependencias ocultas.
2. **Alineación Visual Premium**:
   - La paleta se inclina fuertemente por contrastes de fondos oscuros (`slate-950`), bordes y divisiones sutiles en grises oscuros (`slate-900`/`slate-800`), acentos vibrantes de índigo y esmeralda, y detalles de efecto vidrioso (glassmorphic backdrop filters).
   - Siempre use micro-animaciones dinámicas (como escalas en hover, transiciones de color de 200ms y rotaciones de refresco) para asegurar una experiencia digital interactiva e interactividad viva.

---

## 3. Eficiencia en Servidores Free Tier (Vercel & Supabase)

1. **Aplanamiento de Payloads**:
   - Para minimizar el consumo de recursos de cómputo y transferencias en la capa gratuita de Vercel y Supabase, las entidades están altamente optimizadas.
   - El modelo de reservas (`Booking`) duplica y almacena propiedades pre-resueltas como `roomName`, `serviceName`, `userName` y `userEmail`. Esto elimina la necesidad de realizar costosas uniones de tablas (joins) o múltiples solicitudes de API secundarias durante las cargas de paneles.
2. **Consultas Rápidas**:
   - Los datos históricos y listas masivas deben pre-filtrarse en base a rangos de fechas definidos en los controladores backend (`/api/stats`), reduciendo el consumo de memoria.

---

## 4. RLS (Row Level Security) y Migración a Supabase

1. **Seguridad Nativa**:
   - Aunque la base de datos local JSON simula las fronteras del usuario, el código backend en API Routes (`/api/bookings/[id]/route.ts`) realiza validaciones de rol y pertenencia en cada llamada. Un usuario estándar `user` **jamás** puede editar ni cancelar reservas ajenas, mientras que los administradores `admin` gozan de permisos totales.
2. **Preparado para RLS**:
   - Los repositorios de Supabase (`src/lib/repositories/supabase/index.ts`) están pre-diseñados estructuralmente. Al migrar a Postgres, se activará **Row Level Security (RLS)** en la tabla `bookings`, permitiendo lecturas al propietario de la sesión y control total mediante políticas de base de datos seguras.

---

## 5. Regla sobre Comentarios en el Código

- **Comentarios Técnicos Únicamente**:
  - Evite la redundancia de comentarios explicativos básicos del estilo *"Este es un bucle que recorre las salas"*.
  - El código debe ser limpio y auto-documentado. Los comentarios están permitidos y recomendados únicamente para explicaciones de lógicas complejas no evidentes, dependencias del motor de políticas, o precauciones críticas con tipos de datos.
