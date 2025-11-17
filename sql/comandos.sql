-- --------------------------------------------------
-- Resumen del Esquema de Base de Datos
-- 1. Tabla de Catálogo de Roles
-- 2. Tabla de Perfil de Usuario (con FK a Roles)
-- 3. Funciones RPC (para lógica de la aplicación)
-- --------------------------------------------------

-- ----------------------------------------
-- SECCIÓN 1: TABLA DE ROLES
-- ----------------------------------------

-- 1.1. Crear la tabla 'roles'
CREATE TABLE IF NOT EXISTS public.roles (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    nombre text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 1.2. Activar RLS (Row Level Security)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 1.3. Política de acceso total (como solicitaste)
-- Permite a cualquier usuario autenticado hacer todo en esta tabla
DROP POLICY IF EXISTS "Politica de acceso total para autenticados" ON public.roles;
CREATE POLICY "Politica de acceso total para autenticados"
  ON public.roles FOR ALL
  USING ( auth.uid() IS NOT NULL )
  WITH CHECK ( auth.uid() IS NOT NULL );

-- 1.4. Insertar los roles iniciales que tu app necesita
INSERT INTO public.roles (nombre)
VALUES
  ('SUPER'),
  ('ADMINISTRADOR'),
  ('USUARIO')
ON CONFLICT (nombre) DO NOTHING; -- No falla si ya existen


-- ----------------------------------------
-- SECCIÓN 2: TABLA DE PERFIL DE USUARIO
-- ----------------------------------------

-- 2.1. Crear la tabla 'info_perfil'
-- (Esta es la que originalmente se llamaba 'usuarios_perfil')
CREATE TABLE IF NOT EXISTS public.info_perfil (
    user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- 2.2. Activar RLS
ALTER TABLE public.info_perfil ENABLE ROW LEVEL SECURITY;

-- 2.3. Política de acceso total (como solicitaste)
DROP POLICY IF EXISTS "Politica de acceso total para autenticados" ON public.info_perfil;
CREATE POLICY "Politica de acceso total para autenticados"
  ON public.info_perfil FOR ALL
  USING ( auth.uid() IS NOT NULL )
  WITH CHECK ( auth.uid() IS NOT NULL );


-- ----------------------------------------
-- SECCIÓN 3: CONEXIÓN (1-a-1)
-- ----------------------------------------

-- 3.1. Añadir la columna 'rol_id' a 'info_perfil'
-- Usamos 'ADD COLUMN IF NOT EXISTS' para seguridad
ALTER TABLE public.info_perfil
ADD COLUMN IF NOT EXISTS rol_id bigint;

-- 3.2. Crear la conexión (Foreign Key)
-- (Usamos un nombre de constraint para poder borrarla si es necesario)
-- (Borramos la constraint si existe, antes de crearla)
ALTER TABLE public.info_perfil
DROP CONSTRAINT IF EXISTS fk_info_perfil_rol;

ALTER TABLE public.info_perfil
ADD CONSTRAINT fk_info_perfil_rol
FOREIGN KEY (rol_id) REFERENCES public.roles(id)
ON DELETE SET NULL; -- Si se borra un rol, el usuario se queda con rol 'null'


-- ----------------------------------------
-- SECCIÓN 4: FUNCIONES RPC
-- ----------------------------------------

-- 4.1. Función 'correo_ya_registrado'
-- Usada en 'signUpAction' para validar el email.
-- Debe ser SECURITY DEFINER para poder leer auth.users.
CREATE OR REPLACE FUNCTION public.correo_ya_registrado(email_input text)
RETURNS boolean
LANGUAGE 'sql'
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE email = email_input
  );
$$;

-- 4.2. Función 'obtener_usuarios'
-- Usada en tu API para listar usuarios.
-- Debe ser SECURITY DEFINER para poder leer auth.users.
CREATE OR REPLACE FUNCTION public.obtener_usuarios(rol_filtro text)
RETURNS TABLE(
  id uuid,
  email text,
  nombre text,
  activo boolean,
  rol text,
  rol_id bigint
)
LANGUAGE 'plpgsql'
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.user_id,
    u.email,
    p.nombre,
    p.activo,
    r.nombre,
    r.id
  FROM
    public.info_perfil AS p
  JOIN
    auth.users AS u ON p.user_id = u.id
  JOIN
    public.roles AS r ON p.rol_id = r.id
  WHERE
    (rol_filtro IS NULL OR r.nombre = rol_filtro)
  ORDER BY
    p.nombre ASC;
END;
$$;


-- ----------------------------------------
-- SECCIÓN 5: PERMISOS DE FUNCIONES
-- ----------------------------------------

-- 5.1. Conceder permisos para que los usuarios autenticados
-- puedan *ejecutar* estas funciones RPC que devuelva el json.
CREATE OR REPLACE FUNCTION public.get_userdata()
RETURNS json
LANGUAGE 'plpgsql'
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'id', u.id,
      'email', u.email,
      'rol', r.nombre,
      'rol_id', p.rol_id
    )
    FROM
      public.info_perfil AS p
    JOIN
      auth.users AS u ON p.user_id = u.id
    LEFT JOIN
      public.roles AS r ON p.rol_id = r.id
    WHERE
      u.id = auth.uid()
  );
END;
$$;

-- Otorga permisos para que los usuarios autenticados (logueados) puedan llamar a esta función.
GRANT EXECUTE ON FUNCTION public.get_userdata() TO authenticated;

y el hook que lee la funcion

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface UserData {
  id: string;
  email: string;
  rol: string | null;
  rol_id: number | null;
}

export default function useUserData() {
  const [userId, setUserId] = useState('');
  const [rol, setRol] = useState('');
  const [rol_id, setRolId] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerUsuario = async () => {
      const supabase = createClient();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("No hay usuario en sesión");
        }

        const { data, error } = await supabase
          .rpc('get_userdata') 
          .single<UserData>();

        if (error) {
          throw new Error("Error al llamar RPC: " + error.message);
        }

        console.log("useUserData: Datos recibidos de RPC:", data);

        setUserId(data.id || '');
        setRol(data.rol || '');
        setRolId(data.rol_id || null);
      } catch (error) {
        console.error('Error al obtener sesión:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerUsuario();
  }, []);

  return { userId, rol, rol_id, cargando };
}