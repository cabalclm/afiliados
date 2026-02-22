"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordEditor from "./PasswordEditor";
import { Switch } from "@/components/ui/Switch";
import useUserData from "@/hooks/sesion/useUserData";
import { createClient } from "@/utils/supabase/client";

interface RolDisponible {
  id: number;
  nombre: string;
}

export default function EditarUsuarioForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { rol: rolUsuarioSesion } = useUserData();

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<string | null>(null);
  const [activo, setActivo] = useState(true);
  const [cargando, setCargando] = useState(false);

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const [original, setOriginal] = useState({
    nombres: "",
    apellidos: "",
    email: "",
    rol: "",
    activo: true,
  });

  const [rolesDisponibles, setRolesDisponibles] = useState<RolDisponible[]>([]);

  useEffect(() => {
    if (!id) return;

    const cargarUsuario = async () => {
      const res = await fetch("/api/users/ver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const json = await res.json();
      if (!res.ok || !json.usuario) {
        Swal.fire(
          "Error",
          json.error || "No se pudo obtener el usuario.",
          "error",
        );
        return router.push("/protected/admin/users");
      }

      const user = json.usuario;

      setNombres(user.nombres || "");
      setApellidos(user.apellidos || "");
      setEmail(user.email || "");
      setRol(user.rol_id ? user.rol_id.toString() : null);
      setActivo(user.activo === true);

      setOriginal({
        nombres: user.nombres || "",
        apellidos: user.apellidos || "",
        email: user.email || "",
        rol: user.rol_id ? user.rol_id.toString() : "",
        activo: user.activo === true,
      });
    };

    cargarUsuario();
  }, [id, router]);

  useEffect(() => {
    const fetchRoles = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("roles").select("id, nombre");
      if (data) setRolesDisponibles(data);
    };
    fetchRoles();
  }, []);

  const rolesParaSelector = rolesDisponibles.filter(
    (r) => rolUsuarioSesion === "SUPER" || r.nombre !== "SUPER",
  );

  const hayCambios =
    nombres !== original.nombres ||
    apellidos !== original.apellidos ||
    email !== original.email ||
    rol !== original.rol ||
    activo !== original.activo ||
    mostrarPassword;

  const contraseñaValida =
    password &&
    password === confirmar &&
    /^.*(?=.{8,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).*$/.test(password);

  const guardarCambios = async () => {
    if (!id || !hayCambios)
      return Swal.fire("Sin cambios", "No hay modificaciones.", "info");
    if (!rol)
      return Swal.fire("Rol requerido", "Debes seleccionar un rol.", "warning");

    if (mostrarPassword && !contraseñaValida) {
      return Swal.fire(
        "Contraseña inválida",
        "Debe cumplir con los requisitos de seguridad.",
        "error",
      );
    }

    setCargando(true);
    const payload: any = { id, email, nombres, apellidos, rol, activo };
    if (mostrarPassword) payload.password = password;

    const res = await fetch("/api/users/editar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setCargando(false);

    if (!res.ok) return Swal.fire("Error", json.error, "error");

    Swal.fire("Actualizado", "Usuario actualizado con éxito.", "success").then(
      () => {
        router.push(`/protected/admin/users/ver?id=${id}`);
        router.refresh();
      },
    );
  };

  if (!id)
    return (
      <p className="text-center text-red-600 font-bold">
        Error: ID no proporcionado.
      </p>
    );

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Label className="text-blue-700 font-bold mb-2 block">Nombres</Label>
          <Input
            value={nombres}
            onChange={(e) => setNombres(e.target.value)}
            className="h-12"
          />
        </div>
        <div className="flex-1">
          <Label className="text-blue-700 font-bold mb-2 block">
            Apellidos
          </Label>
          <Input
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            className="h-12"
          />
        </div>
      </div>

      <div>
        <Label className="text-blue-700 font-bold mb-2 block">
          Usuario electrónico de acceso
        </Label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12"
        />
      </div>

      <div>
        <Label className="text-blue-700 font-bold mb-2 block">
          Asignar Rol de Sistema
        </Label>
        <select
          value={rol || ""}
          onChange={(e) => setRol(e.target.value || null)}
          className="w-full border rounded-md px-3 h-12 bg-white"
        >
          <option value="">-- Seleccione un rol --</option>
          {rolesParaSelector.map((r) => (
            <option key={r.id} value={r.id.toString()}>
              {r.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
        <div className="flex flex-col">
          <span className="font-bold text-gray-700">Estado de la cuenta</span>
          <span className="text-sm text-gray-500">
            {activo ? "Acceso permitido" : "Acceso bloqueado"}
          </span>
        </div>
        <Switch checked={activo} onCheckedChange={setActivo} />
      </div>

      <div className="border-t pt-4 flex flex-col gap-4">
        <Button
          variant="ghost"
          onClick={() => setMostrarPassword(!mostrarPassword)}
          className={`font-semibold ${mostrarPassword ? "text-red-500" : "text-blue-600"}`}
        >
          {mostrarPassword
            ? "Cancelar cambio de contraseña"
            : "¿Deseas cambiar la contraseña?"}
        </Button>

        {mostrarPassword && (
          <PasswordEditor
            password={password}
            confirmar={confirmar}
            onPasswordChange={setPassword}
            onConfirmarChange={setConfirmar}
          />
        )}
      </div>

      <Button
        onClick={guardarCambios}
        disabled={!hayCambios || cargando}
        className="h-14 text-xl bg-blue-700 hover:bg-blue-800 text-white font-bold"
      >
        {cargando ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </div>
  );
}
