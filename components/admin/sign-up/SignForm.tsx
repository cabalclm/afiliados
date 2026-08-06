"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signUpAction, updateUsuarioAction } from "@/app/actions/usuarios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Check, ChevronDown, ChevronUp } from "lucide-react";
import Swal from "@/lib/swal";
import PasswordSection from "@/components/admin/sign-up/PasswordSection";
import useUserData from "@/hooks/sesion/useUserData";
import { createClient } from "@/utils/supabase/client";
import { NUEVO_LIDER_SIMULADO } from "@/components/afiliados/datosSimulados";
import { esUsuarioSede } from "@/components/afiliados/esquemas";
import {
  PiBriefcaseDuotone,
  PiCodeDuotone,
  PiMedalDuotone,
  PiShieldCheckDuotone,
} from "react-icons/pi";

interface RolDisponible {
  id: number;
  nombre: string;
}

type RolPredefinido =
  | "LIDER"
  | "EMPLEADO"
  | "TRABAJADOR"
  | "ADMINISTRADOR"
  | "SUPER";

function normalizarRolNombre(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function coincideRolPredefinido(nombreRol: string, buscado: RolPredefinido) {
  const nombre = normalizarRolNombre(nombreRol);
  const clave = buscado.toUpperCase() as RolPredefinido;
  if (clave === "LIDER") return nombre === "LIDER";
  if (clave === "EMPLEADO" || clave === "TRABAJADOR") {
    return nombre === "EMPLEADO" || nombre === "TRABAJADOR";
  }
  if (clave === "ADMINISTRADOR") {
    return nombre === "ADMINISTRADOR" || nombre === "ADMIN";
  }
  return nombre === clave;
}

function etiquetaRol(nombre: string) {
  const n = normalizarRolNombre(nombre);
  if (n === "ADMIN" || n === "ADMINISTRADOR") return "Admin";
  if (n === "EMPLEADO" || n === "TRABAJADOR") return "Empleado";
  if (n === "LIDER") return "Líder";
  if (n === "SUPER") return "Super";
  if (n === "SEDE") return "Sede";
  return nombre;
}

function estiloRol(nombre: string) {
  const n = normalizarRolNombre(nombre);
  if (n === "LIDER") {
    return {
      icon: <PiMedalDuotone className="w-4 h-4" />,
      text: "text-orange-600 dark:text-orange-400",
      border: "border-orange-400 dark:border-orange-500",
      bg: "bg-orange-50 dark:bg-orange-950/40",
      iconWrap:
        "bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400",
    };
  }
  if (n === "EMPLEADO" || n === "TRABAJADOR") {
    return {
      icon: <PiBriefcaseDuotone className="w-4 h-4" />,
      text: "text-violet-600 dark:text-violet-400",
      border: "border-violet-500 dark:border-violet-500",
      bg: "bg-violet-50 dark:bg-violet-950/40",
      iconWrap:
        "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400",
    };
  }
  if (n === "ADMIN" || n === "ADMINISTRADOR") {
    return {
      icon: <PiShieldCheckDuotone className="w-4 h-4" />,
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-400 dark:border-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      iconWrap:
        "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
    };
  }
  if (n === "SUPER") {
    return {
      icon: <PiCodeDuotone className="w-4 h-4" />,
      text: "text-green-600 dark:text-green-400",
      border: "border-green-500 dark:border-green-500",
      bg: "bg-green-50 dark:bg-green-950/40",
      iconWrap:
        "bg-green-100 text-green-600 dark:bg-green-950/60 dark:text-green-400",
    };
  }
  if (n === "SEDE") {
    return {
      icon: <Building2 className="w-4 h-4" />,
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-400 dark:border-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      iconWrap:
        "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
    };
  }
  return {
    icon: <PiShieldCheckDuotone className="w-4 h-4" />,
    text: "text-gray-600 dark:text-gray-400",
    border: "border-gray-300 dark:border-neutral-600",
    bg: "bg-gray-50 dark:bg-neutral-900",
    iconWrap: "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-400",
  };
}

function RolChip({
  rol,
  seleccionado,
  bloqueado,
  onSelect,
}: {
  rol: RolDisponible;
  seleccionado: boolean;
  bloqueado?: boolean;
  onSelect?: () => void;
}) {
  const est = estiloRol(rol.nombre);
  return (
    <button
      type="button"
      disabled={bloqueado}
      onClick={onSelect}
      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border text-left transition-colors font-normal text-sm ${
        seleccionado
          ? `${est.border} ${est.bg} ring-1 ${est.border}`
          : "border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-gray-300 dark:hover:border-neutral-600"
      } ${bloqueado ? "cursor-default opacity-100" : "cursor-pointer"}`}
    >
      <span
        className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${est.iconWrap}`}
      >
        {est.icon}
      </span>
      <span className={`flex-1 ${seleccionado ? est.text : "text-gray-700 dark:text-gray-300"}`}>
        {etiquetaRol(rol.nombre)}
      </span>
      {seleccionado && (
        <Check className={`w-4 h-4 shrink-0 ${est.text}`} strokeWidth={2.5} />
      )}
    </button>
  );
}
interface SignupFormProps {
  onSuccess: () => void;
  onClose: () => void;
  isModal?: boolean;
  initialData?: any;
  rolSesion?: string;
  modoCrearSede?: boolean;
  rolPredefinido?: RolPredefinido;
}

export function SignupForm({
  onSuccess,
  onClose,
  isModal = false,
  initialData,
  rolSesion,
  modoCrearSede = false,
  rolPredefinido,
}: SignupFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const { rol: rolHook } = useUserData();
  const rolUsuarioSesion = rolSesion ?? rolHook;

  const modoSimulacion =
    !isEdit && !modoCrearSede && rolUsuarioSesion?.toUpperCase() === "DOCUMENTADOR";

  const [simulacionLista, setSimulacionLista] = useState(false);
  const mostrarSkeleton = modoSimulacion && !simulacionLista;

  const [loading, setLoading] = useState(false);
  const [rolesDisponibles, setRolesDisponibles] = useState<RolDisponible[]>([]);
  const [showPasswordAccordion, setShowPasswordAccordion] = useState(!isEdit);

  const [nombres, setNombres] = useState(
    modoCrearSede ? "Sede" : initialData?.nombres || "",
  );
  const [apellidos, setApellidos] = useState(
    modoCrearSede ? "Central" : initialData?.apellidos || "",
  );
  const [email, setEmail] = useState(
    modoCrearSede
      ? "sede"
      : initialData?.email?.replace(/@.*$/, "") || "",
  );
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [rol_id, setRolId] = useState<string>(
    initialData?.rol_id?.toString() || "",
  );

  const nombresValido = nombres.trim() !== "";
  const apellidosValido = apellidos.trim() !== "";
  const emailValido = email.trim() !== "";
  const rolValido = rol_id !== "";

  const passwordIngresada = password.length > 0;
  const cumpleRequisitos =
    isEdit && !passwordIngresada
      ? true
      : /^.*(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).*$/.test(
          password,
        );
  const contraseñasCoinciden =
    isEdit && !passwordIngresada
      ? true
      : password === confirmar && passwordIngresada;

  const formularioValido =
    nombresValido &&
    apellidosValido &&
    emailValido &&
    rolValido &&
    contraseñasCoinciden &&
    cumpleRequisitos;

  useEffect(() => {
    const fetchDatos = async () => {
      const supabase = createClient();
      const { data: r } = await supabase.from("roles").select("id, nombre");
      if (r) {
        setRolesDisponibles(r);
        if (!initialData?.rol_id) {
          if (modoCrearSede) {
            const rolSede = r.find(
              (role) =>
                role.id === 5 ||
                role.nombre.toUpperCase() === "SEDE",
            );
            if (rolSede) setRolId(rolSede.id.toString());
          } else if (rolPredefinido) {
            const rolMatch = r.find((role) =>
              coincideRolPredefinido(role.nombre, rolPredefinido),
            );
            if (rolMatch) setRolId(rolMatch.id.toString());
          } else {
            const rolLider = r.find(
              (role) =>
                role.nombre.toUpperCase() === "LIDER" ||
                role.nombre.toUpperCase() === "LÍDER",
            );
            if (rolLider) setRolId(rolLider.id.toString());
          }
        }
      }
    };
    fetchDatos();
  }, [initialData, modoCrearSede, rolPredefinido]);

  useEffect(() => {
    if (!modoSimulacion) return;

    const timer = setTimeout(() => {
      setNombres(NUEVO_LIDER_SIMULADO.nombres);
      setApellidos(NUEVO_LIDER_SIMULADO.apellidos);
      setEmail(NUEVO_LIDER_SIMULADO.email);
      setPassword(NUEVO_LIDER_SIMULADO.password);
      setConfirmar(NUEVO_LIDER_SIMULADO.password);
      setSimulacionLista(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [modoSimulacion]);

  const esSuperSesion = rolUsuarioSesion?.toUpperCase() === "SUPER";
  const esSedeSesion = rolUsuarioSesion?.toUpperCase() === "SEDE";
  const editandoSede =
    isEdit &&
    (esUsuarioSede(initialData || {}) ||
      (initialData?.rol || "").toUpperCase() === "SEDE" ||
      Number(initialData?.rol_id) === 5);
  const rolesParaSelector = rolesDisponibles.filter((r) => {
    const nombre = normalizarRolNombre(r.nombre);
    if (!esSuperSesion && nombre === "SUPER") return false;
    if (esSedeSesion) {
      return (
        nombre === "LIDER" ||
        nombre === "EMPLEADO" ||
        nombre === "TRABAJADOR"
      );
    }
    if (modoCrearSede || editandoSede) return nombre === "SEDE" || r.id === 5;
    if (!isEdit && rolPredefinido) {
      return coincideRolPredefinido(r.nombre, rolPredefinido);
    }
    return nombre !== "SEDE";
  });

  const rolBloqueado =
    editandoSede ||
    (esSedeSesion && isEdit) ||
    (!isEdit && (modoCrearSede || !!rolPredefinido));
  const rolSeleccionado = rolesDisponibles.find(
    (r) => r.id.toString() === rol_id,
  );

  const tituloModal = isEdit
    ? editandoSede
      ? "Editar Usuario Sede"
      : "Editar Perfil de Acceso"
    : modoCrearSede
      ? "Crear Usuario Sede"
      : modoSimulacion
        ? "Nuevo Usuario Líder (Simulación)"
        : rolPredefinido === "EMPLEADO"
          ? "Nuevo Usuario Empleado"
          : rolPredefinido === "ADMINISTRADOR"
            ? "Nuevo Usuario Admin"
            : rolPredefinido === "SUPER"
              ? "Nuevo Usuario Super"
              : "Nuevo Usuario Líder";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (modoSimulacion) {
      Swal.fire({
        icon: "info",
        title: "Modo Simulación",
        text: "Esta es una simulación. El usuario líder no se creó realmente.",
        confirmButtonColor: "#3085d6",
      }).then(() => {
        onSuccess();
      });
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const finalEmail = `${email.trim()}@app.com`;
    formData.set("email", finalEmail);
    formData.set("nombres", nombres.trim());
    formData.set("apellidos", apellidos.trim());
    formData.set("rol_id", rol_id);
    if (isEdit) formData.append("id", initialData.user_id || initialData.id);

    let result;
    if (isEdit) {
      result = await updateUsuarioAction(formData);
    } else {
      result = await signUpAction(formData);
    }

    setLoading(false);

    if (result?.error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: result.error,
        confirmButtonColor: "#d33",
      });
    } else if (result?.success) {
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: result.success,
        confirmButtonColor: "#3085d6",
      }).then(() => {
        onSuccess();
        if (!isModal) router.refresh();
      });
    }
  };

  return (
    <div className="flex flex-col w-full mx-auto md:max-w-xl gap-6 relative text-left p-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-blue-700">{tituloModal}</h3>
        <Button onClick={onClose} variant="ghost" type="button">
          Cerrar
        </Button>
      </div>

      {mostrarSkeleton ? (
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded" />
              <div className="h-12 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded" />
              <div className="h-12 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 dark:bg-neutral-700 rounded" />
            <div className="h-12 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded" />
            <div className="h-12 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
          </div>
          <div className="border dark:border-neutral-700 rounded-md p-4 bg-gray-50 dark:bg-neutral-900 mt-4 space-y-3">
            <div className="h-4 w-40 bg-gray-200 dark:bg-neutral-700 rounded" />
            <div className="h-12 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
            <div className="h-12 w-full bg-gray-100 dark:bg-neutral-800 rounded" />
          </div>
          <div className="h-14 w-full bg-gray-200 dark:bg-neutral-700 rounded mt-4" />
          <p className="text-center text-sm font-semibold text-blue-600">
            Cargando datos de simulación...
          </p>
        </div>
      ) : (
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label>Nombres</Label>
            <Input
              name="nombres"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              className="h-12 text-lg"
              readOnly={modoCrearSede}
            />
          </div>
          <div className="flex-1">
            <Label>Apellidos</Label>
            <Input
              name="apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              className="h-12 text-lg"
              readOnly={modoCrearSede}
            />
          </div>
        </div>

        <div>
          <Label>Usuario de acceso</Label>
          <Input
            name="email"
            type="text"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value.replace(/@.*$/, "").replace(/\s/g, ""))
            }
            placeholder="Ingrese su usuario"
            className="h-12 text-lg"
            readOnly={modoCrearSede}
          />
        </div>

        <div>
          <Label>Asignar Rol</Label>
          <input type="hidden" name="rol_id" value={rol_id} />
          <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-2">
            {rolBloqueado && rolSeleccionado ? (
              <RolChip rol={rolSeleccionado} seleccionado bloqueado />
            ) : (
              rolesParaSelector.map((r) => (
                <RolChip
                  key={r.id}
                  rol={r}
                  seleccionado={rol_id === r.id.toString()}
                  onSelect={() => setRolId(r.id.toString())}
                />
              ))
            )}
          </div>
        </div>

        <div className="border dark:border-neutral-700 rounded-md p-4 bg-gray-50 dark:bg-neutral-900 mt-4">
          {isEdit ? (
            <button
              type="button"
              onClick={() => setShowPasswordAccordion(!showPasswordAccordion)}
              className="flex items-center justify-between w-full text-blue-700 font-semibold"
            >
              <span>
                {showPasswordAccordion
                  ? "Ocultar cambio de contraseña"
                  : "¿Deseas cambiar la contraseña?"}
              </span>
              {showPasswordAccordion ? <ChevronUp /> : <ChevronDown />}
            </button>
          ) : (
            <h4 className="font-bold text-gray-700 dark:text-gray-300">Configurar Seguridad</h4>
          )}

          <div className={`mt-4 ${showPasswordAccordion ? "block" : "hidden"}`}>
            <PasswordSection
              password={password}
              confirmar={confirmar}
              onPasswordChange={setPassword}
              onConfirmarChange={setConfirmar}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={!formularioValido || loading}
          className="h-14 text-xl w-full bg-blue-700 hover:bg-blue-800 mt-4"
        >
          {loading
            ? "Procesando..."
            : isEdit
              ? "Actualizar Datos"
              : modoCrearSede
                ? "Crear Sede"
                : modoSimulacion
                  ? "Simular Creación"
                  : "Crear Acceso"}
        </Button>
      </form>
      )}
    </div>
  );
}
