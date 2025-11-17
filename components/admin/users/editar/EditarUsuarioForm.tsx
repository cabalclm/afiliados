'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PasswordEditor from './PasswordEditor';
import { Switch } from '@/components/ui/Switch';
import useUserData from '@/hooks/sesion/useUserData';
import { createClient } from '@/utils/supabase/client';

interface RolDisponible {
  id: number;
  nombre: string;
}

export default function EditarUsuarioForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const { rol: rolUsuarioSesion } = useUserData();

  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dpi, setDpi] = useState('');
  const [nacimiento, setNacimiento] = useState('');
  const [sexo, setSexo] = useState('M');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<string | null>(null);
  const [activo, setActivo] = useState(true);
  const [cargando, setCargando] = useState(false);

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');

  const [original, setOriginal] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    dpi: '',
    nacimiento: '',
    sexo: 'M',
    email: '',
    rol: '',
    activo: true,
  });
  
  const [rolesDisponibles, setRolesDisponibles] = useState<RolDisponible[]>([]);

  useEffect(() => {
    if (!id) return;

    const cargarUsuario = async () => {
      const res = await fetch('/api/users/ver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      const json = await res.json();
      if (!res.ok || !json.usuario) {
        Swal.fire('Error', json.error || 'No se pudo obtener el usuario.', 'error');
        return router.push('/protected/admin/users');
      }

      const user = json.usuario;
      
      // Asignar valores desde el usuario cargado
      setNombres(user.nombres || '');
      setApellidos(user.apellidos || '');
      setTelefono(user.telefono || '');
      setDpi(user.dpi || '');
      setNacimiento(user.nacimiento ? user.nacimiento.split('T')[0] : '');
      setSexo(user.sexo || 'M');
      setEmail(user.email || '');
      setRol(user.rol_id ? user.rol_id.toString() : null);
      setActivo(user.activo === true);
      
      // Guardar originales
      setOriginal({
        nombres: user.nombres || '',
        apellidos: user.apellidos || '',
        telefono: user.telefono || '',
        dpi: user.dpi || '',
        nacimiento: user.nacimiento ? user.nacimiento.split('T')[0] : '',
        sexo: user.sexo || 'M',
        email: user.email || '',
        rol: user.rol_id ? user.rol_id.toString() : '',
        activo: user.activo === true,
      });
    };

    cargarUsuario();
  }, [id, router]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from('roles').select('id, nombre');
        if (!error && data) {
          setRolesDisponibles(data);
        } else {
          throw new Error('No se pudieron cargar los roles');
        }
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudieron cargar los roles.', 'error');
      }
    };
    fetchRoles();
  }, []);

  const rolesParaSelector = rolesDisponibles.filter(
    (r) => rolUsuarioSesion === 'SUPER' || r.nombre !== 'SUPER'
  );

  const hayCambios =
    nombres !== original.nombres ||
    apellidos !== original.apellidos ||
    telefono !== original.telefono ||
    dpi !== original.dpi ||
    nacimiento !== original.nacimiento ||
    sexo !== original.sexo ||
    email !== original.email ||
    rol !== original.rol ||
    activo !== original.activo ||
    mostrarPassword;

  const contraseñaValida =
    password &&
    password === confirmar &&
    /^.*(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).*$/.test(password);

  const guardarCambios = async () => {
    if (!id || !hayCambios) {
      return Swal.fire('Sin cambios', 'No hiciste ninguna modificación.', 'info');
    }

    if (!rol) {
      return Swal.fire('Rol requerido', 'Debes seleccionar un rol.', 'warning');
    }

    if (mostrarPassword && !contraseñaValida) {
      return Swal.fire(
        'Contraseña inválida',
        'Debe tener al menos 8 caracteres, mayúscula, minúscula, número y símbolo.',
        'error'
      );
    }

    setCargando(true);

    const payload: any = {
      id,
      email,
      nombres,
      apellidos,
      telefono,
      dpi,
      nacimiento,
      sexo,
      rol,
      activo,
    };


    if (mostrarPassword) {
      payload.password = password;
    }

    const res = await fetch('/api/users/editar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setCargando(false);

    if (!res.ok) {
      return Swal.fire('Error', json.error || 'No se pudo actualizar el usuario.', 'error');
    }

    Swal.fire('Actualizado', 'El usuario fue actualizado con éxito.', 'success').then(() => {
      router.push(`/protected/admin/users/ver?id=${id}`);
      router.refresh(); 
    });
  };

  if (!id) return <p className="text-center text-red-600">ID no porporcionado.</p>;

  return (
    <div className="flex flex-col gap-4">
      
      {/* Nombres y Apellidos */}
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <div className="w-full md:w-1/2">
          <Label htmlFor="nombres" className="sr-only">Nombres</Label>
          <Input name="nombres" placeholder="Nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} className="h-12 text-lg" />
        </div>
        <div className="w-full md:w-1/2">
          <Label htmlFor="apellidos" className="sr-only">Apellidos</Label>
          <Input name="apellidos" placeholder="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} className="h-12 text-lg" />
        </div>
      </div>
      
      {/* Email */}
      <div>
        <Label htmlFor="email" className="sr-only">Correo electrónico</Label>
        <Input name="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 text-lg" />
      </div>

      {/* Teléfono y DPI */}
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <div className="w-full md:w-1/2">
          <Label htmlFor="telefono" className="sr-only">Teléfono</Label>
          <Input name="telefono" placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="h-12 text-lg" />
        </div>
        <div className="w-full md:w-1/2">
          <Label htmlFor="dpi" className="sr-only">DPI</Label>
          <Input name="dpi" placeholder="DPI" value={dpi} onChange={(e) => setDpi(e.target.value)} className="h-12 text-lg" />
        </div>
      </div>

      {/* Fecha de Nacimiento y Sexo */}
      <div className="flex flex-col md:flex-row gap-4 w-full">
        <div className="w-full md:w-1/2">
          <Label htmlFor="nacimiento" className="text-lg mb-1 block">Fecha de Nacimiento</Label>
          <Input type="date" name="nacimiento" value={nacimiento} onChange={(e) => setNacimiento(e.target.value)} className="h-12 text-lg" />
        </div>
        <div className="w-full md:w-1/2">
          <Label htmlFor="sexo" className="text-lg mb-1 block">Sexo</Label>
          <select id="sexo" name="sexo" value={sexo} onChange={(e) => setSexo(e.target.value)} className="w-full border rounded px-3 py-2 h-12 text-lg bg-white">
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
      </div>
      
      {/* Selector de Rol */}
      <div className="flex flex-col gap-2">
        <Label className="sr-only" htmlFor="rol-selector">Rol</Label>
        <select
          id="rol-selector"
          name="rol"
          value={rol || ''}
          onChange={(e) => setRol(e.target.value || null)}
          className="w-full border rounded px-3 py-2 h-10 text-sm bg-white"
          disabled={rolesDisponibles.length === 0}
        >
          <option value="">-- Seleccione un rol --</option>
          {rolesParaSelector.map((r) => (
            <option key={r.id} value={r.id.toString()}>
              {r.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between mt-2">
        <Label className="text-base">Activo</Label>
        <Switch checked={activo} onCheckedChange={setActivo} />
      </div>

      <Button
        variant="outline"
        onClick={() => setMostrarPassword(!mostrarPassword)}
        className="mt-4 border-red-500 text-red-600 hover:bg-red-50"
      >
        {mostrarPassword ? 'Cancelar cambio de contraseña' : 'Editar contraseña'}
      </Button>

      {mostrarPassword && (
        <PasswordEditor
          password={password}
          confirmar={confirmar}
          onPasswordChange={setPassword}
          onConfirmarChange={setConfirmar}
        />
      )}

      <Button
        onClick={guardarCambios}
        disabled={!hayCambios || cargando}
        className="h-12 text-lg bg-blue-600 hover:bg-blue-700 text-white"
      >
        {cargando ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </div>
  );
}