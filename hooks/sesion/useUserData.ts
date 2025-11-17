'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface UserData {
  id: string;
  email: string;
  nombres: string | null;
  apellidos: string | null;
  telefono: string | null;
  dpi: string | null;
  nacimiento: string | null;
  sexo: string | null;
  rol: string | null;
  rol_id: number | null;
}

export default function useUserData() {
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dpi, setDpi] = useState('');
  const [nacimiento, setNacimiento] = useState('');
  const [sexo, setSexo] = useState('');
  const [rol, setRol] = useState('');
  const [rol_id, setRolId] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerUsuario = async () => {
      const supabase = createClient();
      
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setCargando(false);
          return;
        }

        const { data, error } = await supabase
          .rpc('get_userdata')
          .single<UserData>();

        if (error) {
          throw new Error("Error al llamar RPC: " + error.message);
        }

        console.log("useUserData: Datos recibidos de RPC:", data);

        setUserId(data.id || '');
        setEmail(data.email || '');
        setNombres(data.nombres || '');
        setApellidos(data.apellidos || '');
        setTelefono(data.telefono || '');
        setDpi(data.dpi || '');
        setNacimiento(data.nacimiento || '');
        setSexo(data.sexo || '');
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

  return { userId, email, nombres, apellidos, telefono, dpi, nacimiento, sexo, rol, rol_id, cargando };
}