'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signUpAction, updateUsuarioAction } from '@/app/actions/usuarios';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Swal from 'sweetalert2';
import PasswordSection from '@/components/admin/sign-up/PasswordSection';
import useUserData from '@/hooks/sesion/useUserData';
import { createClient } from '@/utils/supabase/client';

interface RolDisponible { id: number; nombre: string; }
interface LugarDisponible { id: number; nombre: string; }
interface SignupFormProps { onSuccess: () => void; onClose: () => void; isModal?: boolean; initialData?: any; }

export function SignupForm({ onSuccess, onClose, isModal = false, initialData }: SignupFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const { rol: rolUsuarioSesion } = useUserData();
  
  const [loading, setLoading] = useState(false);
  const [rolesDisponibles, setRolesDisponibles] = useState<RolDisponible[]>([]);
  const [lugaresDisponibles, setLugaresDisponibles] = useState<LugarDisponible[]>([]);
  const [showPasswordAccordion, setShowPasswordAccordion] = useState(!isEdit);

  const [nombres, setNombres] = useState(initialData?.nombres || '');
  const [apellidos, setApellidos] = useState(initialData?.apellidos || '');
  const [telefono, setTelefono] = useState(initialData?.telefono?.toString() || '');
  const [dpi, setDpi] = useState(initialData?.dpi?.toString() || '');
  const [nacimiento, setNacimiento] = useState(initialData?.nacimiento || '');
  const [sexo, setSexo] = useState(initialData?.sexo || 'M'); 
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [rol_id, setRolId] = useState<string>(initialData?.rol_id?.toString() || '');
  const [lugar_id, setLugarId] = useState<string>(initialData?.lugar_id?.toString() || '');

  // Validaciones
  const nombresValido = nombres.trim() !== '';
  const apellidosValido = apellidos.trim() !== '';
  const emailValido = email.trim() !== '' && email.includes('@');
  const telefonoValido = telefono.toString().length === 8;
  const dpiValido = dpi.toString().length === 13;
  const nacimientoValido = nacimiento !== '';
  const rolValido = rol_id !== '';
  const lugarValido = lugar_id !== '';

  const passwordIngresada = password.length > 0;
  const cumpleRequisitos = (isEdit && !passwordIngresada) ? true : /^.*(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).*$/.test(password);
  const contraseñasCoinciden = (isEdit && !passwordIngresada) ? true : (password === confirmar && passwordIngresada);

  const formularioValido = nombresValido && apellidosValido && telefonoValido && dpiValido && nacimientoValido && emailValido && rolValido && lugarValido && contraseñasCoinciden && cumpleRequisitos;

  useEffect(() => {
    const fetchDatos = async () => {
      const supabase = createClient();
      const { data: r } = await supabase.from('roles').select('id, nombre');
      if (r) setRolesDisponibles(r);
      const { data: l } = await supabase.from('lugares_clm').select('id, nombre');
      if (l) setLugaresDisponibles(l);
    };
    fetchDatos();
  }, []);

  const rolesParaSelector = rolesDisponibles.filter(
    (r) => rolUsuarioSesion === 'SUPER' || r.nombre !== 'SUPER'
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // IMPORTANTE: Previene el envío nativo
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    // Agregamos manualmente campos que podrían no estar en inputs visibles
    if(isEdit) formData.append('id', initialData.user_id || initialData.id);
    if(!formData.get('sexo')) formData.append('sexo', sexo);

    let result;
    if (isEdit) {
        result = await updateUsuarioAction(formData);
    } else {
        result = await signUpAction(formData);
    }

    setLoading(false);

    if (result?.error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: result.error,
            confirmButtonColor: '#d33',
        });
    } else if (result?.success) {
        Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: result.success,
            confirmButtonColor: '#3085d6',
        }).then(() => {
            if (isModal) {
                if (!isEdit) onSuccess(); 
                else router.refresh();
            }
        });
    }
  };

  return (
    <div className="flex flex-col w-full mx-auto md:max-w-xl gap-6 relative text-left p-2">
      <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{isEdit ? 'Editar líder' : 'Nuevo líder'}</h3>
          <Button onClick={onClose} variant="ghost" type="button">Cerrar</Button>
      </div>

      {/* ERROR CORREGIDO AQUI: Se eliminó la prop 'action={...}' y se usa 'onSubmit' */}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label>Nombres</Label>
            <Input name="nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} className="h-12" />
            <p className={`text-xs mt-1 ${nombresValido ? 'text-green-600' : 'text-amber-600'}`}>Requerido</p>
          </div>
          <div className="flex-1">
            <Label>Apellidos</Label>
            <Input name="apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} className="h-12" />
            <p className={`text-xs mt-1 ${apellidosValido ? 'text-green-600' : 'text-amber-600'}`}>Requerido</p>
          </div>
        </div>

        <div>
            <Label>Correo</Label>
            <Input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" />
            <p className={`text-xs mt-1 ${emailValido ? 'text-green-600' : 'text-amber-600'}`}>Válido</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
             <Label>Teléfono</Label>
             <Input name="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 8))} className="h-12" />
             <p className={`text-xs mt-1 ${telefonoValido ? 'text-green-600' : 'text-amber-600'}`}>8 dígitos</p>
          </div>
          <div className="flex-1">
             <Label>DPI</Label>
             <Input name="dpi" value={dpi} onChange={(e) => setDpi(e.target.value.replace(/\D/g, '').slice(0, 13))} className="h-12" />
             <p className={`text-xs mt-1 ${dpiValido ? 'text-green-600' : 'text-amber-600'}`}>13 dígitos</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
             <Label>Nacimiento</Label>
             <Input name="nacimiento" type="date" value={nacimiento} onChange={(e) => setNacimiento(e.target.value)} className="h-12" />
             <p className={`text-xs mt-1 ${nacimientoValido ? 'text-green-600' : 'text-amber-600'}`}>Requerido</p>
          </div>
          <div className="flex-1">
            <Label>Sexo</Label>
            <div className="flex border rounded-md h-12 overflow-hidden">
              <button type="button" onClick={() => setSexo('M')} className={`flex-1 ${sexo === 'M' ? 'bg-blue-600 text-white' : ''}`}>M</button>
              <button type="button" onClick={() => setSexo('F')} className={`flex-1 ${sexo === 'F' ? 'bg-pink-600 text-white' : ''}`}>F</button>
            </div>
            <input type="hidden" name="sexo" value={sexo} />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label>Ubicación</Label>
            <select name="lugar_id" value={lugar_id} onChange={(e) => setLugarId(e.target.value)} className="w-full border rounded h-12 px-2 bg-white">
              <option value="">Seleccione</option>
              {lugaresDisponibles.map(l => <option key={l.id} value={l.id.toString()}>{l.nombre}</option>)}
            </select>
            <p className={`text-xs mt-1 ${lugarValido ? 'text-green-600' : 'text-amber-600'}`}>Seleccione</p>
          </div>
          <div className="flex-1">
            <Label>Rol</Label>
            <select name="rol_id" value={rol_id} onChange={(e) => setRolId(e.target.value)} className="w-full border rounded h-12 px-2 bg-white">
              <option value="">Seleccione</option>
              {rolesParaSelector.map(r => <option key={r.id} value={r.id.toString()}>{r.nombre}</option>)}
            </select>
            <p className={`text-xs mt-1 ${rolValido ? 'text-green-600' : 'text-amber-600'}`}>Seleccione</p>
          </div>
        </div>

        <div className="border rounded-md p-4 bg-gray-50 mt-4">
          {isEdit ? (
            <button type="button" onClick={() => setShowPasswordAccordion(!showPasswordAccordion)} className="flex items-center justify-between w-full text-blue-700 font-semibold">
              <span>¿Cambiar contraseña?</span>
              {showPasswordAccordion ? <ChevronUp /> : <ChevronDown />}
            </button>
          ) : <h4 className="font-bold">Seguridad</h4>}

          <div className={`mt-4 ${showPasswordAccordion ? 'block' : 'hidden'}`}>
            <PasswordSection password={password} confirmar={confirmar} onPasswordChange={setPassword} onConfirmarChange={setConfirmar} />
          </div>
        </div>

        {/* ERROR CORREGIDO AQUI: Se eliminó el FormSubmitButton y se usa un Button normal */}
        <Button 
            type="submit" 
            disabled={!formularioValido || loading} 
            className="h-12 text-lg w-full"
        >
          {loading ? (isEdit ? "Guardando..." : "Creando...") : (isEdit ? "Guardar Cambios" : "Crear Usuario")}
        </Button>
      </form>
    </div>
  );
}