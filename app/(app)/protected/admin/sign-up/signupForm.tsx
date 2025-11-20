'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signUpAction } from '@/app/actions/usuarios';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';
import PasswordSection from '@/components/admin/sign-up/PasswordSection';
import { useFormStatus } from 'react-dom';
import useUserData from '@/hooks/sesion/useUserData';
import { createClient } from '@/utils/supabase/client';

interface RolDisponible {
  id: number;
  nombre: string;
}

interface LugarDisponible {
  id: number;
  nombre: string;
}

function FormSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      formAction={signUpAction}
      disabled={disabled || pending}
      className="h-12 text-lg"
    >
      {pending ? "Creando..." : "Crear Usuario"}
    </Button>
  );
}

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const success = searchParams.get('success');
  const prevData = searchParams.get('data');

  const { rol: rolUsuarioSesion } = useUserData();
  const [rolesDisponibles, setRolesDisponibles] = useState<RolDisponible[]>([]);
  const [lugaresDisponibles, setLugaresDisponibles] = useState<LugarDisponible[]>([]);

  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dpi, setDpi] = useState('');
  const [nacimiento, setNacimiento] = useState('');
  const [sexo, setSexo] = useState('M'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [rol_id, setRolId] = useState<string>('');
  const [lugar_id, setLugarId] = useState<string>('');

  const cumpleRequisitos = /^.*(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).*$/.test(password);
  const contraseñasCoinciden = password === confirmar;
  
  const nombresValido = nombres.trim() !== '';
  const apellidosValido = apellidos.trim() !== '';
  const emailValido = email.trim() !== '';
  const nacimientoValido = nacimiento.trim() !== '';
  const rolValido = rol_id !== '';
  const lugarValido = lugar_id !== '';
  const telefonoValido = telefono.length === 8 && /^\d+$/.test(telefono);
  const dpiValido = dpi.length === 13 && /^\d+$/.test(dpi);

  const camposCompletos = nombresValido && apellidosValido && telefonoValido && dpiValido && nacimientoValido && sexo && emailValido && password && confirmar && rolValido && lugarValido;
  const formularioValido = camposCompletos && contraseñasCoinciden && cumpleRequisitos;

  useEffect(() => {
    const fetchDatosIniciales = async () => {
      const supabase = createClient();

      const { data: rolesData, error: rolesError } = await supabase.from('roles').select('id, nombre');
      if (rolesData) setRolesDisponibles(rolesData);
      else console.error("Error cargando roles:", rolesError);

      const { data: lugaresData, error: lugaresError } = await supabase.from('lugares_clm').select('id, nombre');
      if (lugaresData) setLugaresDisponibles(lugaresData);
      else console.error("Error cargando lugares:", lugaresError);
    };
    fetchDatosIniciales();
  }, []);

  useEffect(() => {
    if (error && prevData) {
      try {
        const decodedData = JSON.parse(decodeURIComponent(prevData));
        setNombres(decodedData.nombres || '');
        setApellidos(decodedData.apellidos || '');
        setTelefono(decodedData.telefono || '');
        setDpi(decodedData.dpi || '');
        setNacimiento(decodedData.nacimiento || '');
        setSexo(decodedData.sexo || 'M');
        setEmail(decodedData.email || '');
        setRolId(decodedData.rol_id || '');
        setLugarId(decodedData.lugar_id || '');
      } catch (e) {
        console.error("Error al parsear datos previos:", e);
      }
    }
  }, [error, prevData]);

  function traducirError(mensaje: string) {
    const errores: Record<string, string> = {
      'email rate limit exceeded': 'Demasiados intentos. Espere unos minutos.',
      'user already registered': 'El usuario ya está registrado.',
      'invalid login credentials': 'Credenciales incorrectas.',
      'signup requires a valid password': 'Contraseña inválida.',
      'user not found': 'Usuario no encontrado.',
      'este dpi ya se encuentra registrado a un lider': 'Este DPI ya se encuentra registrado a un Líder.',
      'este dpi ya se encuentra registrado a un afiliado': 'Este DPI ya se encuentra registrado a un Afiliado.',
    };
    return errores[mensaje.toLowerCase()] || mensaje;
  }

  useEffect(() => {
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al crear usuario',
        text: traducirError(decodeURIComponent(error)),
        confirmButtonColor: '#d33',
      });
    }

    if (success) {
      Swal.fire({
        icon: 'success',
        title: 'Usuario creado',
        text: decodeURIComponent(success),
        confirmButtonColor: '#3085d6',
      }).then(() => {
        router.push('/protected/admin/sign-up');
      });
    }
  }, [error, success, router]);
  
  const rolesParaSelector = rolesDisponibles.filter(
    (r) => rolUsuarioSesion === 'SUPER' || r.nombre !== 'SUPER'
  );

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.replace(/\s/g, '');
    if ((newValue.match(/@/g) || []).length > 1) {
      return; 
    }
    setEmail(newValue);
  };

  const handleEmailBlur = () => {
    let currentEmail = email.trim();
    if (currentEmail === '') return;

    const atIndex = currentEmail.indexOf('@');

    if (atIndex === -1) {
      setEmail(currentEmail + '@clmcabal.com');
    } else {
      const username = currentEmail.substring(0, atIndex);
      setEmail(username + '@clmcabal.com');
    }
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>, maxLength: number) => {
    const value = e.target.value.replace(/\D/g, ''); 
    if (value.length <= maxLength) {
      setter(value);
    }
  };

  return (
    <div className="flex flex-col w-full mx-auto md:max-w-xl gap-6">
      <div className="flex justify-start">
        <Button
          variant="ghost"
          onClick={() => router.push('/protected')}
          className="text-blue-600 text-base underline"
        >
          Volver
        </Button>
        <h1 className="text-3xl font-semibold mb-6">Nuevo Líder</h1>
      </div>

      <span className="text-gray-600">Ingresa los datos del nuevo Líder</span>

      <form className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 w-full">
          <div className="w-full md:w-1/2">
            <Label htmlFor="nombres" className="sr-only">Nombres</Label>
            <Input
              name="nombres"
              placeholder="Nombres"
              required
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              className="h-12 text-lg"
            />
            <p className={`text-xs mt-1 ${nombresValido ? 'text-green-600' : 'text-amber-600'}`}>
              Nombres requeridos.
            </p>
          </div>
          <div className="w-full md:w-1/2">
            <Label htmlFor="apellidos" className="sr-only">Apellidos</Label>
            <Input
              name="apellidos"
              placeholder="Apellidos"
              required
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              className="h-12 text-lg"
            />
             <p className={`text-xs mt-1 ${apellidosValido ? 'text-green-600' : 'text-amber-600'}`}>
              Apellidos requeridos.
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="sr-only">Correo electrónico</Label>
          <Input
            name="email"
            placeholder="usuario@clmcabal.com"
            required
            value={email}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            className="h-12 text-lg"
          />
          <p className={`text-xs mt-1 ${emailValido ? 'text-green-600' : 'text-amber-600'}`}>
            Correo requerido.
          </p>
        </div>

        <div className="flex gap-4 w-full">
            <div className="w-1/2">
                <Label htmlFor="telefono" className="sr-only">Teléfono</Label>
                <Input
                    type="tel"
                    name="telefono"
                    placeholder="Teléfono (8 dígitos)"
                    required
                    value={telefono}
                    onChange={(e) => handleNumericChange(e, setTelefono, 8)}
                    className="h-12 text-lg"
                    maxLength={8} 
                />
                <p className={`text-xs mt-1 ${telefonoValido ? 'text-green-600' : 'text-amber-600'}`}>
                  Debe tener 8 dígitos.
                </p>
            </div>
            <div className="w-1/2">
                <Label htmlFor="dpi" className="sr-only">DPI</Label>
                <Input
                    type="text"
                    name="dpi"
                    placeholder="DPI (13 dígitos)"
                    required
                    value={dpi}
                    onChange={(e) => handleNumericChange(e, setDpi, 13)}
                    className="h-12 text-lg"
                    maxLength={13} 
                />
                <p className={`text-xs mt-1 ${dpiValido ? 'text-green-600' : 'text-amber-600'}`}>
                  Debe tener 13 dígitos.
                </p>
            </div>
        </div>
        
        <div className="flex gap-4 w-full items-start">
            <div className="flex-1">
                <Label htmlFor="nacimiento" className="text-lg mb-1 block">Fecha de Nacimiento</Label>
                <Input
                    type="date"
                    name="nacimiento"
                    required
                    value={nacimiento}
                    onChange={(e) => setNacimiento(e.target.value)}
                    className="h-12 text-lg"
                />
                <p className={`text-xs mt-1 ${nacimientoValido ? 'text-green-600' : 'text-amber-600'}`}>
                  Fecha requerida.
                </p>
            </div>
            
            <div className="flex-1">
                <Label htmlFor="sexo" className="text-lg mb-1 block">Sexo</Label>
                <div className="flex rounded-md border p-1 bg-gray-100 h-12 items-center">
                    <button 
                        type="button" 
                        onClick={() => setSexo('M')} 
                        className={`flex-1 rounded-md py-2 text-lg font-semibold transition-colors ${sexo === 'M' ? 'bg-blue-500 text-white shadow' : 'text-gray-600'}`}>
                        Masculino
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setSexo('F')} 
                        className={`flex-1 rounded-md py-2 text-lg font-semibold transition-colors ${sexo === 'F' ? 'bg-pink-500 text-white shadow' : 'text-gray-600'}`}>
                        Femenino
                    </button>
                </div>
            </div>
        </div>

        <div className="flex gap-4 w-full">
          <div className="flex-1 flex flex-col gap-2">
            <Label className="sr-only" htmlFor="lugar-selector">Ubicación</Label>
            <select
              id="lugar-selector"
              name="lugar_id"
              value={lugar_id}
              onChange={(e) => setLugarId(e.target.value)}
              className="w-full border rounded px-3 py-2 h-12 text-lg bg-white"
              disabled={lugaresDisponibles.length === 0}
            >
              <option value="">-- Seleccione una Ubicación --</option>
              {lugaresDisponibles.map((l) => (
                <option key={l.id} value={l.id.toString()}>
                  {l.nombre}
                </option>
              ))}
            </select>
            <p className={`text-xs -mt-1 ${lugarValido ? 'text-green-600' : 'text-amber-600'}`}>
              Debe seleccionar una ubicación.
            </p>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <Label className="sr-only" htmlFor="rol-selector">Rol</Label>
            <select
              id="rol-selector"
              name="rol_id"
              value={rol_id}
              onChange={(e) => setRolId(e.target.value)}
              className="w-full border rounded px-3 py-2 h-12 text-lg bg-white"
              disabled={rolesDisponibles.length === 0}
            >
              <option value="">-- Seleccione un rol --</option>
              {rolesParaSelector.map((r) => (
                <option key={r.id} value={r.id.toString()}>
                  {r.nombre}
                </option>
              ))}
            </select>
            <p className={`text-xs -mt-1 ${rolValido ? 'text-green-600' : 'text-amber-600'}`}>
              Debe seleccionar un rol.
            </p>
          </div>
        </div>

        <PasswordSection
          password={password}
          confirmar={confirmar}
          onPasswordChange={setPassword}
          onConfirmarChange={setConfirmar}
        />

        <input type="hidden" name="sexo" value={sexo} />

        <FormSubmitButton disabled={!formularioValido} />
      </form>
    </div>
  );
}