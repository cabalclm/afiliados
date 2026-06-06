import type { Afiliado, Lider } from "./esquemas";

export const LIDER_SIMULADO: Lider = {
  id: "simulado-demo",
  email: "clopez",
  nombres: "Carlos Eduardo",
  apellidos: "López Aguilar",
  rol: "LIDER",
  conteoAfiliados: 13,
  simulado: true,
};

export const NUEVO_LIDER_SIMULADO = {
  nombres: "Juan Carlos",
  apellidos: "Lemus Martínez",
  email: "jlemus",
  password: "Simulacion2025*",
};

const LUGARES = [
  "El Limón",
  "San José",
  "La Esperanza",
  "El Rodeo",
  "Las Flores",
  "El Naranjo",
  "Santa Cruz",
  "El Chaguite",
];

const POLITICAS = [
  "Salud",
  "Educación",
  "Red Vial",
  "Servicios Públicos",
  "de Seguridad",
  "Medio Ambiente",
];

const RELIGIONES = ["Católica", "Evangélica", "Ninguna"];

type SemillaAfiliado = {
  nombres: string;
  apellidos: string;
  sexo: "M" | "F";
  nacimiento: string;
};

const SEMILLAS: SemillaAfiliado[] = [
  { nombres: "Carlos Eduardo", apellidos: "López Aguilar", sexo: "M", nacimiento: "1985-03-12" },
  { nombres: "María Elena", apellidos: "Lemus Martínez", sexo: "F", nacimiento: "1990-07-25" },
  { nombres: "José Antonio", apellidos: "Pérez García", sexo: "M", nacimiento: "1978-11-03" },
  { nombres: "Ana Lucía", apellidos: "Morales Recinos", sexo: "F", nacimiento: "1995-01-18" },
  { nombres: "Luis Fernando", apellidos: "Hernández Cruz", sexo: "M", nacimiento: "1982-09-30" },
  { nombres: "Sandra Patricia", apellidos: "Ramírez Solís", sexo: "F", nacimiento: "1988-05-14" },
  { nombres: "Mario Roberto", apellidos: "González Funes", sexo: "M", nacimiento: "1975-12-22" },
  { nombres: "Claudia Verónica", apellidos: "Castro Rivera", sexo: "F", nacimiento: "1993-08-09" },
  { nombres: "Edgar Geovany", apellidos: "Méndez Orellana", sexo: "M", nacimiento: "1986-04-27" },
  { nombres: "Wendy Yamileth", apellidos: "Portillo Lemus", sexo: "F", nacimiento: "1997-02-11" },
  { nombres: "Byron Estuardo", apellidos: "Aguilar Súchite", sexo: "M", nacimiento: "1980-06-05" },
  { nombres: "Karla Andrea", apellidos: "Figueroa Rodríguez", sexo: "F", nacimiento: "1992-10-19" },
  { nombres: "Walter Alexander", apellidos: "Sandoval Marroquín", sexo: "M", nacimiento: "1984-01-07" },
];

export const AFILIADOS_SIMULADOS: Afiliado[] = SEMILLAS.map((s, i) => {
  const empadronado = i % 4 !== 0;
  return {
    id: `simulado-afiliado-${i + 1}`,
    nombres: s.nombres,
    apellidos: s.apellidos,
    sexo: s.sexo,
    nacimiento: s.nacimiento,
    telefono: `5${(5000000 + i * 13579).toString().padStart(7, "0")}`,
    dpi: `${(2500000000000 + i * 1234567).toString().slice(0, 13)}`,
    lugar_id: (i % LUGARES.length) + 1,
    lider_id: LIDER_SIMULADO.id,
    politica: POLITICAS[i % POLITICAS.length],
    empadronado,
    no_padron: empadronado ? `${1000 + i * 37}` : "",
    religion: RELIGIONES[i % RELIGIONES.length],
    created_at: new Date().toISOString(),
    lider_nombre: `${LIDER_SIMULADO.nombres} ${LIDER_SIMULADO.apellidos}`,
    lider_email: LIDER_SIMULADO.email,
    lugar_nombre: LUGARES[i % LUGARES.length],
  };
});
