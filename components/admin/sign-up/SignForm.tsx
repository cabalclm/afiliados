"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signUpAction, updateUsuarioAction } from "@/app/actions/usuarios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import Swal from "@/lib/swal";
import PasswordSection from "@/components/admin/sign-up/PasswordSection";
import useUserData from "@/hooks/sesion/useUserData";
import { createClient } from "@/utils/supabase/client";
import { NUEVO_LIDER_SIMULADO } from "@/components/afiliados/datosSimulados";

interface RolDisponible {
  id: number;
  nombre: string;
}
interface SignupFormProps {
  onSuccess: () => void;
  onClose: () => void;
  isModal?: boolean;
  initialData?: any;
  rolSesion?: string;
  modoCrearSede?: boolean;
}

export function SignupForm({
  onSuccess,
  onClose,
  isModal = false,
  initialData,
  rolSesion,
  modoCrearSede = false,
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
  }, [initialData, modoCrearSede]);

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
  const editandoSede =
    isEdit &&
    ((initialData?.rol || "").toUpperCase() === "SEDE" ||
      Number(initialData?.rol_id) === 5);
  const rolesParaSelector = rolesDisponibles.filter((r) => {
    const nombre = r.nombre.toUpperCase();
    if (!esSuperSesion && nombre === "SUPER") return false;
    if (modoCrearSede) return nombre === "SEDE" || r.id === 5;
    if (editandoSede) return true;
    return nombre !== "SEDE";
  });

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
        <h3 className="text-xl font-bold text-blue-700">
          {isEdit
            ? "Editar Perfil de Acceso"
            : modoCrearSede
              ? "Crear Usuario Sede"
              : modoSimulacion
                ? "Nuevo Usuario Líder (Simulación)"
                : "Nuevo Usuario Líder"}
        </h3>
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
          <select
            name="rol_id"
            value={rol_id}
            onChange={(e) => setRolId(e.target.value)}
            disabled={modoCrearSede}
            className="w-full border dark:border-neutral-700 rounded h-12 px-3 text-lg bg-white dark:bg-neutral-900 mt-1 disabled:opacity-70"
          >
            <option value="">Seleccione un rol...</option>
            {rolesParaSelector.map((r) => (
              <option key={r.id} value={r.id.toString()}>
                {r.nombre}
              </option>
            ))}
          </select>
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
