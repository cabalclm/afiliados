"use client";

import { useEffect, useState } from "react";
import { getUserDataAction } from "./actions";

export default function useUserData() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [rol, setRol] = useState("");
  const [rol_id, setRolId] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerUsuario = async () => {
      try {
        const data = await getUserDataAction();

        if (data) {
          setUserId(data.id || "");
          setEmail(data.email?.replace(/@.*$/, "") || "");
          setNombres(data.nombres || "");
          setApellidos(data.apellidos || "");
          setRol(data.rol || "");
          setRolId(data.rol_id || null);
        }
      } catch (error) {
        console.error("Error al obtener sesión:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerUsuario();
  }, []);

  return {
    userId,
    email,
    nombres,
    apellidos,
    rol,
    rol_id,
    cargando,
  };
}
