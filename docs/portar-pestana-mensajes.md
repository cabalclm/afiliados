# PROMPT — Replicar pestaña Mensajes (difusión) exactamente igual

Copia este archivo completo y pégalo como prompt en el otro sistema (mismo stack: Next.js App Router + Supabase + Tailwind + TanStack Query + Framer Motion + Headless UI).

**Objetivo:** dejar la pestaña **Mensajes** idéntica en UI, flujo y datos.  
**Excepción obligatoria:** en difusión **NO** existe “nivel de compromiso” (Bajo / Medio / Cumple / Alto). No chips, no SQL de metas para targeting, no `resolverUserIdsPorNivel`.

---

## 0) Contexto de producto (qué debe verse)

Hay **dos caras** del sistema:

| Cara | Quién | Qué ve |
|------|--------|--------|
| **Admin — pestaña Mensajes** | Solo `ADMIN` / `SUPER` (o equivalentes) | Panel verde con buscador, título “Difusión”, botón “Nueva Difusión”, grid de tarjetas de historial |
| **Inbox del usuario** | Cualquier autenticado | Lista de mensajes que le aplican + modal bloqueante de pendientes al entrar al dashboard |

El usuario **SEDE** (o rol de solo lectura equivalente) **no** ve la pestaña Mensajes.

Público objetivo permitido (únicos):

1. **Todos**
2. **Líderes** (rol `LIDER`)
3. **Empleados** (rol `EMPLEADO`; compat `TRABAJADOR` si existe en el destino)
4. **Usuarios Específicos** (lista UUID)

**PROHIBIDO:** chips o lógica de Bajo / Medio / Cumple / Alto.

---

## 1) Dependencias

```bash
pnpm add web-push @ducanh2912/next-pwa framer-motion @tanstack/react-query @headlessui/react
pnpm add -D @types/web-push
```

Ya se asumen: `@supabase/ssr`, `@supabase/supabase-js`, `lucide-react`, `tailwindcss`, toasts propios.

Si el destino usa `morphicons` como este repo, el ícono de pestaña morph-ea `Mail` → `MailOpen`. Si no, usa Lucide estático `Mail` / `MailOpen`.

---

## 2) Variables de entorno

Añadir a `.env.local` y al hosting (Vercel/etc.). Las `NEXT_PUBLIC_*` se **embeben en el build**: tras cambiarlas hay que **redeploy**.

```env
# Ya deberían existir
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Web Push (VAPID) — generar par nuevo para ESTE proyecto
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:soporte@tu-dominio.com
```

### Generar claves VAPID

```bash
node -e "const wp=require('web-push');console.log(JSON.stringify(wp.generateVAPIDKeys(),null,2))"
```

Salida:

- `publicKey` → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `privateKey` → `VAPID_PRIVATE_KEY` (solo servidor, nunca al cliente)

`VAPID_SUBJECT` debe ser un `mailto:` de contacto del proyecto.

**No** pongas la ruta de apertura de la notificación en `.env`. La ruta vive en cada mensaje (`sis_mensajes.ruta`, default `/`).

---

## 3) SQL en Supabase (ejecutar en el SQL Editor, en este orden)

Requiere que existan `auth.users` y una tabla de perfiles con `user_id` + rol (en el origen: `info_perfil` + `roles`). Adapta nombres de tablas de perfil/rol al destino; **no** cambies los nombres `sis_mensajes`, `sis_mensajes_lecturas`, `sis_push_subscriptions`.

### 3.1 Mensajes + lecturas

```sql
-- =====================================================================
-- Sistema de mensajes / difusión
-- SIN targeting por nivel de compromiso
-- =====================================================================

create table if not exists public.sis_mensajes (
  id uuid primary key default gen_random_uuid(),
  titulo text,
  mensaje text not null,
  publico_objetivo text not null default 'Todos',
  usuarios_especificos uuid[] not null default '{}',
  ruta text not null default '/',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_sis_mensajes_activo_created
  on public.sis_mensajes (activo, created_at desc);

create index if not exists idx_sis_mensajes_publico
  on public.sis_mensajes (publico_objetivo);

alter table public.sis_mensajes enable row level security;

drop policy if exists "mensajes_select_authenticated" on public.sis_mensajes;
create policy "mensajes_select_authenticated"
  on public.sis_mensajes
  for select
  to authenticated
  using (activo = true);

-- Insert: cualquier autenticado a nivel RLS.
-- La restricción real (solo ADMIN/SUPER) vive en la UI + server action.
drop policy if exists "mensajes_insert_authenticated" on public.sis_mensajes;
create policy "mensajes_insert_authenticated"
  on public.sis_mensajes
  for insert
  to authenticated
  with check (true);

-- Lecturas (cola de no leídos)
create table if not exists public.sis_mensajes_lecturas (
  id uuid primary key default gen_random_uuid(),
  mensaje_id uuid not null references public.sis_mensajes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  leido_en timestamptz not null default now(),
  unique (mensaje_id, user_id)
);

create index if not exists idx_mensajes_lecturas_user
  on public.sis_mensajes_lecturas (user_id);

create index if not exists idx_mensajes_lecturas_mensaje
  on public.sis_mensajes_lecturas (mensaje_id);

alter table public.sis_mensajes_lecturas enable row level security;

drop policy if exists "lecturas_select_own" on public.sis_mensajes_lecturas;
create policy "lecturas_select_own"
  on public.sis_mensajes_lecturas
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "lecturas_insert_own" on public.sis_mensajes_lecturas;
create policy "lecturas_insert_own"
  on public.sis_mensajes_lecturas
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Historial admin: ver todas las lecturas
drop policy if exists "lecturas_select_all_authenticated" on public.sis_mensajes_lecturas;
create policy "lecturas_select_all_authenticated"
  on public.sis_mensajes_lecturas
  for select
  to authenticated
  using (true);

-- Columnas extra si la tabla ya existía
alter table public.sis_mensajes add column if not exists titulo text;
alter table public.sis_mensajes add column if not exists ruta text not null default '/';
alter table public.sis_mensajes add column if not exists usuarios_especificos uuid[] not null default '{}';
alter table public.sis_mensajes add column if not exists activo boolean not null default true;
```

### 3.2 Push subscriptions (después de 3.1)

```sql
create table if not exists public.sis_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subs_user_id
  on public.sis_push_subscriptions (user_id);

alter table public.sis_push_subscriptions enable row level security;

drop policy if exists "push_all_own" on public.sis_push_subscriptions;
create policy "push_all_own"
  on public.sis_push_subscriptions
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

### 3.3 Políticas — resumen

| Tabla | Operación | Quién | Regla |
|-------|-----------|--------|--------|
| `sis_mensajes` | SELECT | `authenticated` | `activo = true` |
| `sis_mensajes` | INSERT | `authenticated` | `with check (true)` — filtrar ADMIN/SUPER en la app |
| `sis_mensajes_lecturas` | SELECT | `authenticated` | propia fila **o** todas (historial) |
| `sis_mensajes_lecturas` | INSERT | `authenticated` | `user_id = auth.uid()` |
| `sis_push_subscriptions` | ALL | `authenticated` | `user_id = auth.uid()` |

Anon **no** tiene acceso. El envío de push usa **service role** (`supabaseAdmin`) para leer todas las suscripciones; no hace falta política extra para eso.

Valores de `publico_objetivo` a persistir exactamente:

- `"Todos"`
- `"Lideres"`
- `"Empleados"`
- `"Usuarios Específicos"`

---

## 4) Cliente admin de Supabase (server-only)

`lib/supabaseAdmin.ts` — **nunca** importar en Client Components:

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default supabaseAdmin;
```

El cliente de usuario autenticado sigue siendo `createClient()` de `@/utils/supabase/server` (cookies de sesión). Insert de mensajes y lecturas van con ese cliente (RLS). Resolución de destinatarios por rol y envío push van con `supabaseAdmin`.

---

## 5) Añadir la pestaña Mensajes

### 5.1 Tipo + tema de color (verde)

En el archivo de pestañas del dashboard (origen: `components/afiliados/Ver.tsx`):

```ts
type Tab = /* ...pestañas existentes... */ | "Mensajes";
```

Tema de **pestaña activa** (texto, pill, línea inferior):

```ts
Mensajes: {
  activeText: "text-green-600 dark:text-green-400",
  activeIconBg: "bg-green-100 dark:bg-green-950/60",
  activeIconText: "text-green-600 dark:text-green-400",
  activeBadgeBg: "bg-green-100 dark:bg-green-950/60",
  activeBadgeText: "text-green-700 dark:text-green-300",
  lineBg: "bg-green-500 dark:bg-green-400",
},
```

Tema de **panel/lista** (origen: `TEMA_MENSAJES` en `components/afiliados/temaPestana.ts`). Copiar el objeto completo: bordes `green-200` / `dark:green-800/80`, header `bg-green-50 dark:bg-green-950/30`, `focus-visible:ring-green-500`, botones/hover en la misma paleta verde.

### 5.2 Botón de pestaña

- `label`: `"Mensajes"`
- `count`: `null` (sin badge numérico)
- Íconos: idle `Mail`, hover `MailOpen` (lucide)
- `show`: solo `esAdminOSuper` (`rol` `ADMIN` / `SUPER` / `ADMINISTRADOR`)
- Orden: **última** pestaña
- Mismo `TabMorphButton` / `motion.button` que el resto: pill `rounded-lg`, inactiva `bg-gray-100 dark:bg-neutral-800 text-gray-500`, activa con `activeIconBg` + `activeText`
- Subrayado activo: `layoutId="pestana-subrayado"`, `h-[2px] md:h-[3px]`, `lineBg` verde, spring `stiffness: 380, damping: 32`

Clases del botón (igual que las otras pestañas):

```
relative flex w-full md:w-auto md:shrink-0 flex-row items-center justify-center
px-1.5 sm:px-2 py-3 md:py-3 text-base md:text-lg font-semibold
transition-colors duration-300
```

Pill:

```
relative inline-flex w-full max-w-full items-center justify-center
gap-1.5 sm:gap-2 md:gap-2.5 px-2 sm:px-3 md:px-3.5 py-2.5 md:py-2
rounded-lg transition-colors duration-300
```

### 5.3 Contenido de la pestaña

No desmontar al cambiar de tab (usar `hidden` + `aria-hidden`, igual que las otras). Envolver con el panel de lista:

```tsx
{esAdminOSuper && (
  <div className={tabActiva === "Mensajes" ? undefined : "hidden"} aria-hidden={tabActiva !== "Mensajes"}>
    <PanelListaPestana
      tema={TEMA_MENSAJES}
      placeholder="Buscar por nombre"
      value={busquedaTab("Mensajes")}
      onChange={(v) => setBusquedaTab("Mensajes", v)}
    >
      <Difusion usuarios={allUsers} searchTerm={busquedaTab("Mensajes")} />
    </PanelListaPestana>
  </div>
)}
```

`allUsers` = lista de perfiles con al menos `{ id, nombres, apellidos, email }` (`id` = `user_id` de Auth).

---

## 6) Estilo del buscador (obligatorio, idéntico)

Hay **dos** buscadores. Replícalos los dos.

### 6.1 Buscador del panel de la pestaña (`PanelListaPestana`)

Componente reutilizable. El panel entero:

```
overflow-hidden rounded-xl border border-green-200 dark:border-green-800/80
bg-white dark:bg-neutral-900 shadow-sm
```

Barra superior (fondo del tema):

```
flex flex-col sm:flex-row sm:items-center gap-3 p-3
bg-green-50 dark:bg-green-950/30
```

Input:

```
relative flex-1 min-w-0
ícono Search: absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none
input:
  type="text"
  placeholder="Buscar por nombre"
  className="pl-9 pr-4 py-2.5 h-11 border border-gray-200 dark:border-neutral-700
             bg-white dark:bg-neutral-900 rounded-lg w-full text-sm
             focus:outline-none focus:ring-2 focus-visible:ring-green-500"
```

Cuerpo: `px-3 pb-3 pt-3`.

**Comportamiento:** filtrar las tarjetas del historial (`MensajesEnviados`) por texto del mensaje, título, `publico_objetivo` y nombres de destinatarios. Case-insensitive. En el origen el input ya existía en el panel; **en el destino debe filtrar de verdad**.

### 6.2 Buscador dentro del modal “Usuarios Específicos”

Cuando el público es Específicos, aparece un bloque “Destinatarios”:

- Header gris `bg-gray-50 dark:bg-neutral-800/60` con ícono `Users`, badge verde con el conteo
- Lista “Seleccionados” (max-h-36) si hay alguno
- Input:

```
relative
Search absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400
Input placeholder="Escribe un nombre para buscar..." className="pl-9 h-9 text-sm"
```

- Sin texto: “Escribe un nombre para mostrar usuarios”
- Cero resultados: “No se encontraron usuarios”
- Con texto: lista max-h-52, filtra por `nombres + apellidos` **o** `email`, sort `localeCompare(..., "es")`
- Botón “Seleccionar resultados” / “Quitar resultados”
- Fila: nombres (semibold) + apellidos (xs); checkbox 20px; seleccionada `bg-green-50/80 dark:bg-green-950/30` + check `bg-green-600`

---

## 7) UI de difusión (admin) — sin compromiso

Archivos de referencia en el origen:

- `components/afiliados/Difusion.tsx`
- `components/afiliados/MensajesEnviados.tsx`

Copia la UI **salvo** el bloque “Por nivel de compromiso” y el array `OPCIONES_NIVEL`.

### 7.1 Cabecera dentro del panel

```
flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4 mb-2
h3: text-lg font-black + Megaphone w-5 h-5 text-green-600
subtítulo: text-xs text-gray-500 “Envía avisos e instrucciones a tus usuarios”
Button: bg-green-600 hover:bg-green-700 text-white font-bold + Megaphone “Nueva Difusión”
```

### 7.2 Modal “Nueva Difusión”

- Headless UI `Dialog` `z-[150]`, overlay `bg-black/60 backdrop-blur-sm`
- Fullscreen en móvil; desktop `md:max-h-[90vh] md:max-w-2xl lg:max-w-3xl md:rounded-2xl`
- Header: pill verde + “Nueva Difusión” / “Envía un mensaje a tu público objetivo” + X
- Campos:
  - **Título** (opcional, max 60): “Título (encabezado de la notificación)”
  - **Mensaje** (obligatorio): textarea `min-h-[100px]` `focus:ring-green-500`
- Público:
  - Grupo **General**: chip Todos (`Globe2`, slate)
  - Grupo **Por rol**: grid 2 cols — Líderes (`Trophy`, orange) y Empleados (`Briefcase`, violet)
  - Grupo **Selección manual**: Específicos (`UserRoundSearch`, teal)
  - **NO** grupo “Por nivel de compromiso”
- Chip activo: `border-{color}-500` + `bg-{color}-50` + `ring-1` + Check a la derecha
- Chip inactivo: `border-gray-200 dark:border-neutral-700`
- Label de grupo: `text-[10px] font-bold uppercase tracking-wider text-gray-400`
- Al elegir Específicos: animar salida de General/Por rol (`AnimatePresence` + `motion`, 0.22s); mostrar “← Cambiar público” que vuelve a Todos
- Footer: Cancelar ghost + “Enviar Difusión” verde con `UserPlus`, disabled si mensaje vacío o enviando

Validación:

- Mensaje vacío → toast warning “Escribe un mensaje para enviar”
- Específicos sin nadie → “Selecciona al menos un usuario específico”

Éxito:

- `n > 0` → `Difusión enviada. Notificación push a N dispositivo(s).`
- `n === 0` → `Difusión enviada. (Ningún destinatario tiene notificaciones activas en este momento)`
- Invalidar query `["historial-mensajes"]`, reset form, cerrar modal

### 7.3 Grid de historial (`MensajesEnviados`)

- Loading: spinner `h-8 w-8 border-b-2 border-blue-600`
- Vacío: dashed border, “No hay mensajes enviados.”
- Grid `gap-4 md:grid-cols-2 lg:grid-cols-3`
- Tarjeta clickeable: `rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] p-5`
  - Badge `ACTIVO` verde / `INACTIVO` gris (`text-[10px] uppercase tracking-wider`)
  - Fecha `toLocaleDateString()`
  - `line-clamp-3` del mensaje
  - Footer: chip `publico_objetivo` + `CheckCircle2` “N Vistas”

Modal detalle `z-[200]`, overlay `bg-black/80`, `md:h-[90vh] max-w-4xl`:

- “Detalles del Mensaje” + “Enviado el {fecha}”
- Fecha: `es-ES`, weekday short, `dd/mm/yy`, hour12; reemplazar `,` por ` a las`; capitalizar primer letra. Ej: `Lun 25/08/26 a las 07:00 p. m.`
- Cuerpo `whitespace-pre-wrap text-lg md:text-xl`
- Chips: “Público: …” azul y “Vistas Totales: N”
- “Reporte de Vistas”:
  - Si Específicos: una fila por UUID (Visto + fecha **o** “No visto aún” con `Clock`)
  - Si no: solo quienes leyeron; vacío → “Nadie ha visto este mensaje aún.”
- Nombre: `lideres.find(l => l.id === uid)?.nombres ?? "Usuario Desconocido"`

---

## 8) Server actions de mensajes

Archivo: `components/dashboard/actions/mensajes.ts` (`"use server"`).

### 8.1 Enviar

```ts
interface EnviarMensajeInput {
  titulo?: string;
  mensaje: string;
  publico_objetivo: string;
  usuarios_especificos?: string[];
  ruta?: string;
}
```

1. Insert en `sis_mensajes` con el cliente de sesión: `titulo` (trim o null), `mensaje`, `publico_objetivo`, `usuarios_especificos`, `ruta` default `"/"`, `activo: true`.
2. Resolver `userIds` para push:
   - `Todos` → `undefined` (todos los suscritos)
   - `Usuarios Específicos` → el array
   - `Lideres` → perfiles cuyo rol es `LIDER`
   - `Empleados` → `EMPLEADO` o `TRABAJADOR`
   - **Nunca** caer a “nivel de compromiso”
3. `enviarNotificacionPush({ titulo: titulo || "Nueva difusión SOTE", mensaje, ruta, userIds, tag: data.id })`
4. Si push falla, loguear y **no** revertir el insert. Devolver `{ mensaje, push: { enviadas, fallidas } }`.

Compat de rol al resolver IDs:

- `EMPLEADO` ≡ `TRABAJADOR`
- `ADMINISTRADOR` ≡ `ADMIN` (por si el destino filtra administrativos; no es público de difusión)

### 8.2 ¿El mensaje aplica al usuario?

```ts
function mensajeAplicaAlUsuario(m, userId, rolUsuario) {
  if (m.publico_objetivo === "Todos") return true;
  if (m.publico_objetivo === "Usuarios Específicos")
    return m.usuarios_especificos?.includes(userId) ?? false;
  if (m.publico_objetivo === "Lideres")
    return (rolUsuario || "").toUpperCase() === "LIDER";
  if (m.publico_objetivo === "Empleados") {
    const r = (rolUsuario || "").toUpperCase();
    return r === "EMPLEADO" || r === "TRABAJADOR";
  }
  return false; // no hay matching por Bajo/Medio/Cumple/Alto
}
```

### 8.3 Inbox

- `obtenerMensajesUsuarioAction(userId)`: activos, `created_at desc`, filtrar con `mensajeAplicaAlUsuario`, adjuntar `leido` / `leido_en` desde `sis_mensajes_lecturas`.
- `obtenerMensajePendienteAction(userId)`: primer no leído (el más reciente, porque ya vienen desc).
- `contarMensajesPendientesAction(userId)`: length de no leídos.
- `marcarLeidoAction(mensajeId, userId)`: insert en lecturas. Unique `(mensaje_id, user_id)` evita duplicados.
- `obtenerHistorialMensajesAction()`: `sis_mensajes` + join `sis_mensajes_lecturas (user_id, leido_en)`, `created_at desc`.

**No** pases `nivelCompromiso` a estas actions.

---

## 9) Inbox del usuario (para que la difusión se vea)

Sin esto, el admin envía y nadie consume el mensaje.

### 9.1 Lista (`MensajesUsuario.tsx`)

Usar en la ficha/célula del usuario (pestaña interna “Mensajes” con `Mail` / `MailOpen`).

- Query keys: `["mensajes-usuario", userId]`, `["mensajes-pendientes", userId]`
- Al mostrar una página, marcar como leídos los de esa página (ref Set para no repetir; optimistic update de `leido` / `leido_en`)
- URLs en el texto: `/(https?:\/\/[^\s]+)/g` → `<a target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 underline break-all">`
- Card no leída: borde del `tema` (`cardBorder`); leída: `border-gray-200`
- Título: `titulo?.trim() || "Mensaje"` uppercase bold
- Meta alineada a la derecha, `text-[10px]`:
  - `Entregado: {formatearFechaHoraMensaje(created_at)}`
  - si leído: `Leído: {formatearFechaHoraMensaje(leido_en)}` en `tema.btnText`
- Formato fecha GT: `Lun 25/08/26 | 7:00 AM` timezone `America/Guatemala` (ver `formatearFechaHoraMensaje` en `utils/formatoFechaGT.ts`)
- Vacío: ícono Mail + “No tienes mensajes por ahora.”
- Paginación: 15 / 30 / 45 / Todos; chevrons con color del tema
- Banner si `pendientes > 0`: `N sin leer` uppercase `text-[10px]`

### 9.2 Modal de pendientes al entrar (`ModalBienvenida.tsx`)

- Montar en el dashboard cuando hay `userId` y terminó el loading
- `z-[100]`, overlay `bg-black/90`, `onClose={() => {}}` (no se cierra con click afuera ni Esc)
- Muestra el pendiente más reciente; botón “Entendido, Continuar” → `marcarLeidoAction` → toast → siguiente de la cola
- Toast: `Se guardó la lectura del mensaje el Lun 03/07/26 a las 9:16 AM`
- Si hay más de uno: “Tienes N mensajes sin leer · del más reciente al más antiguo”
- **No** filtres por nivel de compromiso. **No** hace falta la barra “Tu nivel de compromiso es…” ni los GIF de meta; si el destino ya tiene esa barra por otro motivo, déjala, pero el mensaje pendiente se elige solo por audiencia Todos/rol/específicos.

---

## 10) Notificaciones push (Web Push / VAPID)

Sin esto, “Enviar Difusión” guarda el mensaje pero nadie recibe aviso en el dispositivo.

### 10.1 Envío (`lib/push.ts`)

- `web-push` + `setVapidDetails(VAPID_SUBJECT, PUBLIC, PRIVATE)`
- Si faltan keys: warn y `{ enviadas: 0, fallidas: 0 }`
- `userIds` omitido → todas las filas de `sis_push_subscriptions`
- `userIds: []` → nadie
- Payload JSON: `{ titulo, mensaje (máx 160 chars), ruta, tag }`
- 404/410 → borrar endpoint (suscripción muerta)

### 10.2 Guardar / borrar suscripción (`app/actions/push.ts`)

- `guardarSubscripcionAction`: exige sesión; upsert por `endpoint`
- `eliminarSubscripcionAction`: delete `endpoint` + `user_id` de la sesión

### 10.3 Clave pública al cliente

`GET /api/push/vapid-public-key` → `{ publicKey }` o 503. El hook también lee `process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY`.

### 10.4 Hook (`hooks/usePushNotifications.ts`)

- SW dedicado: `navigator.serviceWorker.register("/push/sw.js", { scope: "/push/", updateViaCache: "none" })`
- `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`
- iPhone sin PWA (`display-mode` no standalone): `{ ok: false, motivo: "ios-sin-pwa" }`
- Permiso denegado: `motivo: "permiso-denegado"`

### 10.5 Service workers (copiar tal cual, cambiar “SOTE” por el nombre del destino)

- `public/push/sw.js` — scope `/push/` (dev + prod)
- `public/push-handlers.js` — importado por el SW de PWA en producción

Eventos: `push` → `showNotification(titulo, { body, icon: "/icons/logo.png", badge, vibrate: [120,60,120], tag, renotify, data: { ruta } })`  
`notificationclick` → focus ventana con esa `pathname` o `openWindow(ruta)`

### 10.6 PWA (`next.config.ts`)

```ts
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    importScripts: ["/push-handlers.js"],
  },
});
```

### 10.7 Campana en el header (`NotificationBell.tsx`)

- Si el navegador no soporta push, `return null`
- Inactiva: `Bell` gris
- Activa: `BellRing` amarillo + punto `bg-yellow-500`
- Cargando: `Loader2` spin
- Toasts de activar / desactivar / iOS-sin-PWA / permiso denegado
- Texto iOS: “En iPhone, agrega [APP] a la pantalla de inicio (Compartir → Agregar a inicio) y abre la app desde ahí para activar notificaciones.”

Requisitos: HTTPS, iPhone solo como PWA, verificar `https://dominio/push/sw.js` → 200.

---

## 11) Archivos a crear / tocar (checklist)

```
sql/mensajes_sistema.sql          # o pegar el SQL de la sección 3.1
sql/push_notifications.sql        # sección 3.2

.env.local                        # VAPID + service role

lib/supabaseAdmin.ts
lib/push.ts
app/actions/push.ts
app/api/push/vapid-public-key/route.ts
hooks/usePushNotifications.ts
public/push/sw.js
public/push-handlers.js
next.config.ts                    # withPWA importScripts

components/dashboard/actions/mensajes.ts
components/afiliados/Difusion.tsx
components/afiliados/MensajesEnviados.tsx
components/afiliados/MensajesUsuario.tsx
components/afiliados/ModalBienvenida.tsx   # inbox al entrar
components/afiliados/PanelListaPestana.tsx # si no existe
components/afiliados/temaPestana.ts        # TEMA_MENSAJES
components/afiliados/Ver.tsx               # tab + panel
components/NotificationBell.tsx
components/header-auth.tsx                 # montar campana
package.json                              # web-push, next-pwa
```

Adapta la carpeta `afiliados` al módulo equivalente del destino.

---

## 12) Criterios de aceptación

- [ ] Pestaña Mensajes al final, verde, ícono Mail, **sin** contador, solo ADMIN/SUPER
- [ ] Panel `rounded-xl` borde verde, buscador `h-11` con Search a la izquierda, placeholder “Buscar por nombre”, focus ring verde; el texto filtra las tarjetas
- [ ] “Nueva Difusión”: título opcional, mensaje, público **Todos / Líderes / Empleados / Específicos**
- [ ] **No** aparece “Por nivel de compromiso” ni chips Bajo/Medio/Cumple/Alto
- [ ] Específicos: buscador que no lista nadie hasta escribir, selección con check verde, “Cambiar público”
- [ ] Tras enviar: tarjeta ACTIVO + fecha + recorte del texto + público + vistas
- [ ] Click tarjeta → reporte de vistas (específicos: visto / no visto; resto: solo vistos)
- [ ] Usuario destino ve el mensaje en su inbox y el modal de pendientes al entrar
- [ ] Marcar leído incrementa “Vistas”
- [ ] Push llega con título + recorte del mensaje; click abre `ruta` (default `/`)
- [ ] Campana en header activa/desactiva suscripción en `sis_push_subscriptions`
- [ ] Sin sesión (anon) las tablas no se leen ni se escriben (RLS)
- [ ] `.env` tiene el par VAPID y `SUPABASE_SERVICE_ROLE_KEY`; redeploy después de `NEXT_PUBLIC_*`

---

## 13) Qué NO portar

- Targeting por nivel de compromiso (`OPCIONES_NIVEL`, `resolverUserIdsPorNivel`, `sis_configuracion` solo para metas, GIFs de compromiso en el modal de bienvenida **si** el destino no los usa)
- Pestaña visible para SEDE
- Badge numérico en la pestaña Mensajes
- Insertar mensajes sin estar autenticado
