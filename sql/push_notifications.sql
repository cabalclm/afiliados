-- =====================================================================
-- Notificaciones Push (Web Push / VAPID)
-- Ejecutar en el editor SQL de Supabase.
-- =====================================================================

-- 1) Tabla de suscripciones push (una por dispositivo/navegador)
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

-- 2) Seguridad a nivel de fila: una sola política para todo (select/insert/update/delete)
--    siempre que el usuario esté autenticado y sea dueño de la fila.
alter table public.sis_push_subscriptions enable row level security;

drop policy if exists "push_all_own" on public.sis_push_subscriptions;
create policy "push_all_own"
  on public.sis_push_subscriptions
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 3) Campos nuevos en los mensajes de difusión: título y ruta a abrir
alter table public.sis_mensajes
  add column if not exists titulo text;

alter table public.sis_mensajes
  add column if not exists ruta text not null default '/';
