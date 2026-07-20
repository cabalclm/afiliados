# Guía de implementación — SOTE / afiliadosclm

Documento de referencia para replicar en otro proyecto Next.js + Supabase todo lo implementado: optimización del dashboard, roles, simulación, difusión de mensajes, push notifications y toasts.

---

## Tabla de contenidos

1. [Stack y dependencias](#1-stack-y-dependencias)
2. [Optimización del dashboard](#2-optimización-del-dashboard)
3. [Vista por rol (Ver.tsx)](#3-vista-por-rol-vertsx)
4. [Modo simulación](#4-modo-simulación)
5. [SignForm y restricciones de rol](#5-signform-y-restricciones-de-rol)
6. [Configuración general](#6-configuración-general)
7. [Sistema de difusión / mensajes](#7-sistema-de-difusión--mensajes)
8. [Notificaciones push (Web Push / VAPID)](#8-notificaciones-push-web-push--vapid)
9. [Sistema de toasts](#9-sistema-de-toasts)
10. [Modal de bienvenida (inbox)](#10-modal-de-bienvenida-inbox)
11. [Base de datos (SQL)](#11-base-de-datos-sql)
12. [Variables de entorno](#12-variables-de-entorno)
13. [Checklist de replicación](#13-checklist-de-replicación)
14. [Índice de archivos](#14-índice-de-archivos)

---

## 1. Stack y dependencias

### Core
- **Next.js** (App Router)
- **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`)
- **TanStack React Query** — cache del dashboard y mensajes
- **Framer Motion** — animaciones (líder simulado, lista de destinatarios)
- **react-toastify** — notificaciones UI (via wrapper propio)
- **web-push** — envío server-side de push
- **@ducanh2912/next-pwa** — PWA + importScripts para push en producción

### Instalación

```bash
pnpm add @tanstack/react-query web-push @ducanh2912/next-pwa framer-motion react-toastify
pnpm add -D @types/web-push
```

---

## 2. Optimización del dashboard

### Problema original
- `getUser()` en cada request → latencia de red a Supabase Auth (3–8 s).
- Múltiples queries secuenciales.
- Varios fetches desde el cliente.

### Solución

| Técnica | Implementación |
|---------|----------------|
| Sesión local | `supabase.auth.getSession()` — lee JWT de cookie, sin round-trip |
| Queries paralelas | `Promise.all` con 4 consultas simultáneas |
| Conteo afiliados | `afiliados.select("lider_id")` → `Map` en memoria |
| Cliente | Un solo `useQuery(["dashboard-data"])` → `GET /api/dashboard` |
| Cache | `staleTime: 5 * 60 * 1000` (5 min) |

### Queries en paralelo (`app/api/dashboard/route.ts`)

1. Perfil del usuario en sesión (`info_perfil` + `roles`)
2. Todos los perfiles con roles (`info_perfil`)
3. Conteo de afiliados por `lider_id` (`afiliados`)
4. Lugares CLM (`lugares_clm`)

### Lazy load adicional (`Ver.tsx`)

- Afiliados globales: solo cuando estadísticas abiertas, pestaña Miembros, célula abierta, o usuario es LIDER.
- Célula: `/api/afiliados?liderId=` con enriquecimiento paralelo.

### Archivos

| Archivo | Rol |
|---------|-----|
| `app/api/dashboard/route.ts` | API principal (JSON puro) |
| `components/afiliados/actions/dashboard.ts` | Server action equivalente (fallback) |
| `components/afiliados/Ver.tsx` | Consumer con TanStack Query |
| `components/providers/query-provider.tsx` | Provider global |

### Logging de performance

```typescript
console.time("🚀 getSession");
console.time("🚀 queries paralelas");
console.time("🚀 TOTAL");
```

---

## 3. Vista por rol (Ver.tsx)

### Flags derivados de la sesión

```typescript
puedeCrearLider = ADMINISTRADOR | SUPER | DOCUMENTADOR
puedeSimular      = ADMINISTRADOR | SUPER | DOCUMENTADOR
esAdminOSuper     = ADMINISTRADOR | SUPER
esLider           = LIDER
vistaCompleta     = esAdminOSuper | DOCUMENTADOR
```

### Comportamiento

| Rol | UI |
|-----|-----|
| **LIDER** | `<Celula embedded />` directo, sin pestañas |
| **DOCUMENTADOR** | Líderes, Miembros, Mensajes (sin Administrativos) |
| **ADMIN / SUPER** | Vista completa con todas las pestañas |

### Pestañas y colores

| Pestaña | Color | Visible para |
|---------|-------|--------------|
| Líderes | Naranja | vistaCompleta |
| Miembros | Morado | vistaCompleta |
| Administrativos | Azul | esAdminOSuper |
| Mensajes | Verde | esAdminOSuper → `<Difusion />` |

### Skeletons
- Dashboard: tabs + grid 6 tarjetas
- `Lideres.tsx`: `LideresSkeleton`
- `AfiliadosGeneral.tsx`: `AfiliadosSkeleton`
- `Celula.tsx`: pulse rows + spinner

### Anti-overflow móvil
- `overflow-x-hidden` en layout y `Ver.tsx`
- Viewport sin zoom en `app/layout.tsx` metadata

---

## 4. Modo simulación

### Activación
Click en título **"Gestión de Datos 📊"** (solo SUPER / ADMIN / DOCUMENTADOR).

### Datos (`components/afiliados/datosSimulados.ts`)

| Constante | Contenido |
|-----------|-----------|
| `LIDER_SIMULADO` | Carlos Eduardo López Aguilar, 13/15, `simulado: true` |
| `AFILIADOS_SIMULADOS` | 13 afiliados ficticios guatemaltecos |
| `NUEVO_LIDER_SIMULADO` | Datos precargados para SignForm |

### Integración

- **Lideres.tsx:** Framer Motion al insertar/quitar; líder simulado va primero.
- **Celula.tsx:** prop `afiliadosSimulados` — omite API si `lider.simulado`.
- **SignForm.tsx:** DOCUMENTADOR → skeleton 1.2s + datos precargados, sin BD.
- **Ver.tsx:** filtra `DOCUMENTADOR` de lista de líderes visibles.

---

## 5. SignForm y restricciones de rol

**Archivo:** `components/admin/sign-up/SignForm.tsx`

| Rol sesión | Puede asignar |
|------------|---------------|
| SUPER | Todos los roles |
| ADMIN / DOCUMENTADOR | Todos **excepto SUPER** |

- Prop `rolSesion` desde `Ver.tsx`.
- Modo simulación DOCUMENTADOR: botón "Simular Creación", SweetAlert2 informativo.

---

## 6. Configuración general

**Archivo:** `components/ConfiguracionModal.tsx`

### Removido
- Pestaña "Mensajes Masivos" (movida a `Difusion.tsx`).

### Conservado
- Nombre candidato, lugar, frase, `meta_celula`, `meta_celula_minima`.
- Validación: `meta_minima < meta_celula`.
- Tuerca en header (ADMIN / SUPER / ADMINISTRADOR).

**Action:** `components/dashboard/actions/configuracion.ts` → upsert en `sis_configuracion` id=1.

---

## 7. Sistema de difusión / mensajes

### Flujo

```
Admin → Difusion.tsx → enviarMensajeAction
  → INSERT sis_mensajes
  → enviarNotificacionPush (destinatarios según público)
Usuario → ModalBienvenida (cola no leídos)
  → marcarLeidoAction → siguiente mensaje
```

### Público objetivo

| Valor | Destinatarios |
|-------|---------------|
| `Todos` | Todos los usuarios (filtrado en app + push a suscritos) |
| `Alto` / `Cumple` / `Medio` / `Bajo` | Por nivel de compromiso |
| `Usuarios Específicos` | Array `usuarios_especificos` |

### Nivel de compromiso

Con `meta_celula` (default 15) y `meta_celula_minima` (default 10):

| Nivel | Condición |
|-------|-----------|
| Alto | conteo > meta |
| Cumple | conteo === meta |
| Medio | conteo >= mínima && < meta |
| Bajo | conteo < mínima |

Conteo = afiliados registrados bajo el `lider_id` del usuario.

### Cola de mensajes (cambio clave)

**Antes:** al enviar uno nuevo, se desactivaban los anteriores.

**Ahora:**
- Cada mensaje queda `activo: true`.
- Por usuario: no leídos que le aplican, orden **más reciente primero** (`created_at DESC`).
- Al confirmar → insert en `sis_mensajes_lecturas` → carga el siguiente.
- Banner si `pendientesTotal > 1`.

### Campos del formulario (`Difusion.tsx`)

| Campo | Uso |
|-------|-----|
| Título | Push + modal (opcional) |
| Mensaje | Cuerpo |
| Ruta al abrir | Al tocar notificación (default `/`) |
| Público objetivo | Selector con colores |
| Usuarios específicos | Grid multi-select con animación layout |

### Server actions (`components/dashboard/actions/mensajes.ts`)

| Action | Descripción |
|--------|-------------|
| `enviarMensajeAction(input)` | Insert + push |
| `obtenerMensajePendienteAction(userId, nivel)` | Primer no leído |
| `contarMensajesPendientesAction(userId, nivel)` | Total pendientes |
| `marcarLeidoAction(mensajeId, userId)` | Marcar leído |
| `obtenerHistorialMensajesAction()` | Historial admin |

### Historial admin

**Archivo:** `components/afiliados/MensajesEnviados.tsx`  
Grid con conteo de lecturas y modal de reporte por mensaje.

---

## 8. Notificaciones push (Web Push / VAPID)

### Generar claves

```bash
node -e "const wp=require('web-push');console.log(JSON.stringify(wp.generateVAPIDKeys()))"
```

### Arquitectura dual Service Worker

| SW | Archivo | Scope |
|----|---------|-------|
| Push dedicado | `public/push/sw.js` | `/push/` |
| PWA (next-pwa) | generado en build | `/` + importa `public/push-handlers.js` |

**next.config.ts:**

```typescript
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    importScripts: ["/push-handlers.js"],
  },
});
```

### Envío server-side (`lib/push.ts`)

```typescript
enviarNotificacionPush({
  titulo: string,
  mensaje: string,
  ruta?: string,      // default "/"
  userIds?: string[], // omitido = todos suscritos; [] = nadie
  tag?: string,
})
```

- Usa `supabaseAdmin` (service role) para leer `sis_push_subscriptions`.
- Limpia endpoints 404/410 automáticamente.
- Fallo de push **no** cancela el insert del mensaje.

### Suscripción cliente (`hooks/usePushNotifications.ts`)

1. Comprueba soporte del navegador + clave VAPID.
2. Al activar: `Notification.requestPermission()` → register `/push/sw.js`.
3. `pushManager.subscribe()` → `guardarSubscripcionAction`.
4. **iPhone sin PWA:** retorna `motivo: "ios-sin-pwa"` con toast explicativo.

### Campana (`components/NotificationBell.tsx`)

- Header: orden **tuerca → actualizar → campana → luna**.
- Activa: amarillo + punto + `BellRing`.
- Inactiva: gris + `Bell`.

### Requisitos producción

1. Variables VAPID en hosting + **redeploy** (NEXT_PUBLIC se embebe en build).
2. SQL `sql/push_notifications.sql` ejecutado.
3. HTTPS obligatorio.
4. iPhone: app instalada en pantalla de inicio.
5. Verificar: `https://tu-dominio.com/push/sw.js` responde 200.

---

## 9. Sistema de toasts

### Wrapper (`lib/toast.ts`)

Importar siempre desde `@/lib/toast`, **no** desde `react-toastify` directo.

| Tipo | Fondo | Icono |
|------|-------|-------|
| success | `#16a34a` | CheckCircle2 |
| error | `#dc2626` | XCircle |
| warning | `#ca8a04` | AlertTriangle |
| info | `#2563eb` | Info |

- Texto blanco, sin sombras, sin emojis.
- Iconos Lucide via `createElement`.

### Layout (`app/layout.tsx`)

```tsx
<ToastContainer position="top-center" theme="colored" autoClose={10000} />
```

### CSS responsive (`app/globals.css`)

- **Móvil:** ancho completo arriba, esquinas rectas.
- **Desktop (md+):** tarjeta centrada redondeada.

---

## 10. Modal de bienvenida (inbox)

**Archivo:** `components/afiliados/ModalBienvenida.tsx`

### Comportamiento
- Modal bloqueante (`onClose={() => {}}`).
- Muestra mensaje pendiente según nivel de compromiso.
- Barra de progreso + GIF por nivel (verde/azul/amarillo/rojo).
- Botón "Entendido, Continuar" → toast con fecha formateada → siguiente en cola.

### Estilo mensaje
- `text-sm font-bold`, sin sombras en tarjeta/panel/botón.
- Título opcional en color del nivel.
- Espaciado reducido entre barra y botón.

### Toast al confirmar

```
Se guardó la lectura del mensaje el Lun 03/07/26 a las 9:16 AM
```

Fondo según nivel de compromiso.

---

## 11. Base de datos (SQL)

Ejecutar en Supabase **en este orden**:

| Archivo | Contenido |
|---------|-----------|
| `sql/comandos.sql` | Roles, perfiles, RPCs base (si proyecto nuevo) |
| `sql/mensajes_sistema.sql` | `sis_configuracion`, `sis_mensajes`, `sis_mensajes_lecturas` |
| `sql/push_notifications.sql` | `sis_push_subscriptions` + columnas extra en mensajes |

### Tablas del sistema de mensajes

**sis_configuracion** (singleton id=1)
- `nombre_candidato`, `lugar`, `frase`
- `meta_celula`, `meta_celula_minima`

**sis_mensajes**
- `titulo`, `mensaje`, `publico_objetivo`
- `usuarios_especificos uuid[]`
- `ruta` (default `/`), `activo`, `created_at`

**sis_mensajes_lecturas**
- `mensaje_id`, `user_id`, `leido_en`
- UNIQUE `(mensaje_id, user_id)`

**sis_push_subscriptions**
- `user_id`, `endpoint` (unique), `p256dh`, `auth`, `user_agent`

---

## 12. Variables de entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:soporte@sote.gt
```

**Notas:**
- `NEXT_PUBLIC_*` requiere redeploy después de cambiar.
- `SUPABASE_SERVICE_ROLE_KEY` solo server-side (push send, resolver audiencias).
- La **ruta** al abrir notificación va en el formulario de difusión, **no** en `.env`.

---

## 13. Checklist de replicación

### Fase 1 — Performance
- [ ] TanStack Query + QueryProvider
- [ ] `GET /api/dashboard` con getSession + Promise.all
- [ ] Un solo useQuery en vista principal
- [ ] Skeletons + lazy load secundario

### Fase 2 — Roles
- [ ] Flags de rol en vista principal
- [ ] LIDER → vista embebida
- [ ] Tabs con colores por rol visible

### Fase 3 — Simulación (opcional)
- [ ] `datosSimulados.ts`
- [ ] Toggle en título
- [ ] SignForm modo simulación DOCUMENTADOR

### Fase 4 — Mensajes
- [ ] Ejecutar `sql/mensajes_sistema.sql`
- [ ] Server actions mensajes.ts
- [ ] Difusion.tsx + MensajesEnviados.tsx
- [ ] ModalBienvenida cola secuencial
- [ ] Sacar mensajes de ConfiguracionModal

### Fase 5 — Push
- [ ] Generar VAPID + variables en hosting
- [ ] Ejecutar `sql/push_notifications.sql`
- [ ] lib/push.ts + hook + campana
- [ ] public/push/sw.js + push-handlers.js
- [ ] next-pwa importScripts
- [ ] Redeploy

### Fase 6 — Toasts
- [ ] lib/toast.ts
- [ ] globals.css responsive
- [ ] Migrar imports a @/lib/toast

---

## 14. Índice de archivos

| Área | Ruta |
|------|------|
| Dashboard API | `app/api/dashboard/route.ts` |
| Dashboard action | `components/afiliados/actions/dashboard.ts` |
| Vista principal | `components/afiliados/Ver.tsx` |
| Difusión | `components/afiliados/Difusion.tsx` |
| Historial | `components/afiliados/MensajesEnviados.tsx` |
| Inbox usuario | `components/afiliados/ModalBienvenida.tsx` |
| Mensajes backend | `components/dashboard/actions/mensajes.ts` |
| Config backend | `components/dashboard/actions/configuracion.ts` |
| Config UI | `components/ConfiguracionModal.tsx` |
| Push server | `lib/push.ts` |
| Push actions | `app/actions/push.ts` |
| Push hook | `hooks/usePushNotifications.ts` |
| Push SW | `public/push/sw.js` |
| Push handlers PWA | `public/push-handlers.js` |
| VAPID API | `app/api/push/vapid-public-key/route.ts` |
| Campana | `components/NotificationBell.tsx` |
| Header | `components/header-auth.tsx` |
| Toasts | `lib/toast.ts` |
| Toast CSS | `app/globals.css` |
| Simulación | `components/afiliados/datosSimulados.ts` |
| SignForm | `components/admin/sign-up/SignForm.tsx` |
| PWA config | `next.config.ts` |
| SQL mensajes | `sql/mensajes_sistema.sql` |
| SQL push | `sql/push_notifications.sql` |
| SQL base | `sql/comandos.sql` |

---

*Última actualización: implementación SOTE afiliadosclm — dashboard, difusión, push y toasts.*
