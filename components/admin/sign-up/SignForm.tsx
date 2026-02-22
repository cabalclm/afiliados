"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signUpAction, updateUsuarioAction } from "@/app/actions/usuarios";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import Swal from "sweetalert2";
import PasswordSection from "@/components/admin/sign-up/PasswordSection";
import useUserData from "@/hooks/sesion/useUserData";
import { createClient } from "@/utils/supabase/client";

interface RolDisponible {
  id: number;
  nombre: string;
}
interface SignupFormProps {
  onSuccess: () => void;
  onClose: () => void;
  isModal?: boolean;
  initialData?: any;
}

export function SignupForm({
  onSuccess,
  onClose,
  isModal = false,
  initialData,
}: SignupFormProps) {
  const router = useRouter();
  const isEdit = !!initialData;
  const { rol: rolUsuarioSesion } = useUserData();

  const [loading, setLoading] = useState(false);
  const [rolesDisponibles, setRolesDisponibles] = useState<RolDisponible[]>([]);
  const [showPasswordAccordion, setShowPasswordAccordion] = useState(!isEdit);

  const [nombres, setNombres] = useState(initialData?.nombres || "");
  const [apellidos, setApellidos] = useState(initialData?.apellidos || "");
  const [email, setEmail] = useState(
    initialData?.email?.replace(/@.*$/, "") || "",
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
          const rolLider = r.find(
            (role) =>
              role.nombre.toUpperCase() === "LIDER" ||
              role.nombre.toUpperCase() === "LÍDER",
          );
          if (rolLider) setRolId(rolLider.id.toString());
        }
      }
    };
    fetchDatos();
  }, [initialData]);

  const rolesParaSelector = rolesDisponibles.filter(
    (r) => rolUsuarioSesion === "SUPER" || r.nombre !== "SUPER",
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const finalEmail = `${email.trim()}@app.com`;
    formData.set("email", finalEmail);
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
          {isEdit ? "Editar Perfil de Acceso" : "Nuevo Usuario Líder"}
        </h3>
        <Button onClick={onClose} variant="ghost" type="button">
          Cerrar
        </Button>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label>Nombres</Label>
            <Input
              name="nombres"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              className="h-12 text-lg"
            />
          </div>
          <div className="flex-1">
            <Label>Apellidos</Label>
            <Input
              name="apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              className="h-12 text-lg"
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
          />
        </div>

        <div>
          <Label>Asignar Rol</Label>
          <select
            name="rol_id"
            value={rol_id}
            onChange={(e) => setRolId(e.target.value)}
            className="w-full border rounded h-12 px-3 text-lg bg-white mt-1"
          >
            <option value="">Seleccione un rol...</option>
            {rolesParaSelector.map((r) => (
              <option key={r.id} value={r.id.toString()}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="border rounded-md p-4 bg-gray-50 mt-4">
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
            <h4 className="font-bold text-gray-700">Configurar Seguridad</h4>
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
              : "Crear Acceso"}
        </Button>
      </form>
    </div>
  );
}
