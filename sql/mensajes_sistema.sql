-- =====================================================================
-- Sistema de mensajes / difusión (SOTE)
-- Ejecutar en el editor SQL de Supabase.
-- Requiere: auth.users, info_perfil, afiliados (para targeting por nivel)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Configuración del sistema (singleton)
-- ---------------------------------------------------------------------
create table if not exists public.sis_configuracion (
  id bigint primary key default 1,
  nombre_candidato text not null default '',
  lugar text not null default '',
  frase text not null default '',
  meta_celula integer not null default 15,
  meta_celula_minima integer not null default 10,
  meta_general integer not null default 3000,
  updated_at timestamptz not null default now(),
  constraint sis_configuracion_singleton check (id = 1),
  constraint sis_configuracion_meta_check check (meta_celula_minima < meta_celula)
);

insert into public.sis_configuracion (id)
values (1)
on conflict (id) do nothing;

alter table public.sis_configuracion enable row level security;

drop policy if exists "config_select_authenticated" on public.sis_configuracion;
create policy "config_select_authenticated"
  on public.sis_configuracion
  for select
  to authenticated
  using (true);

drop policy if exists "config_update_authenticated" on public.sis_configuracion;
create policy "config_update_authenticated"
  on public.sis_configuracion
  for update
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------
-- 2) Mensajes de difusión
-- ---------------------------------------------------------------------
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

-- Lectura: cualquier autenticado (filtrado en la app por audiencia y lecturas)
drop policy if exists "mensajes_select_authenticated" on public.sis_mensajes;
create policy "mensajes_select_authenticated"
  on public.sis_mensajes
  for select
  to authenticated
  using (activo = true);

-- Inserción: autenticados (restringir por rol en la app: ADMIN/SUPER)
drop policy if exists "mensajes_insert_authenticated" on public.sis_mensajes;
create policy "mensajes_insert_authenticated"
  on public.sis_mensajes
  for insert
  to authenticated
  with check (true);

-- ---------------------------------------------------------------------
-- 3) Lecturas (cola de mensajes no leídos)
-- ---------------------------------------------------------------------
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

-- Admins pueden ver todas las lecturas (historial de difusión)
drop policy if exists "lecturas_select_all_authenticated" on public.sis_mensajes_lecturas;
create policy "lecturas_select_all_authenticated"
  on public.sis_mensajes_lecturas
  for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- 4) Columnas extra (si la tabla ya existía sin ellas)
-- ---------------------------------------------------------------------
alter table public.sis_mensajes
  add column if not exists titulo text;

alter table public.sis_mensajes
  add column if not exists ruta text not null default '/';

alter table public.sis_mensajes
  add column if not exists usuarios_especificos uuid[] not null default '{}';

alter table public.sis_mensajes
  add column if not exists activo boolean not null default true;

alter table public.sis_configuracion
  add column if not exists meta_general integer not null default 3000;

alter table public.sis_configuracion
  add column if not exists meta_planilla integer not null default 100;

alter table public.sis_configuracion
  add column if not exists meta_planilla_minima integer not null default 67;
