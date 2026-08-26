import { z } from "zod";

export interface Lider {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  rol: string;
  conteoAfiliados?: number;
  simulado?: boolean;
}

/** Normaliza rol para comparar sin tildes ni mayúsculas inconsistentes. */
export function normalizarRol(rol: string | null | undefined) {
  return (rol || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

export function esRolLider(rol: string | null | undefined) {
  return normalizarRol(rol) === "LIDER";
}

export function esRolEmpleado(rol: string | null | undefined) {
  const r = normalizarRol(rol);
  return r === "EMPLEADO" || r === "TRABAJADOR";
}

export function esRolPlanilla(rol: string | null | undefined) {
  return normalizarRol(rol) === "PLANILLA";
}

export const META_CELULA_DEFAULT = 15;
export const META_CELULA_MINIMA_DEFAULT = 10;
/** Meta de integrantes por persona de planilla (distinta a líderes/empleados). */
export const META_PLANILLA_DEFAULT = 100;
export const META_PLANILLA_MINIMA_DEFAULT = 67;

export type ConfigMetas = {
  meta_celula?: number | null;
  meta_celula_minima?: number | null;
  meta_planilla?: number | null;
  meta_planilla_minima?: number | null;
} | null | undefined;

/** Meta y umbral mínimo según el rol de quien encabeza la célula. */
export function metasCelulaParaRol(
  rol: string | null | undefined,
  config: ConfigMetas,
): { meta: number; minima: number } {
  const metaCelula = config?.meta_celula ?? META_CELULA_DEFAULT;
  const metaMinima = config?.meta_celula_minima ?? META_CELULA_MINIMA_DEFAULT;
  if (esRolPlanilla(rol)) {
    const meta = config?.meta_planilla ?? META_PLANILLA_DEFAULT;
    const minima =
      config?.meta_planilla_minima ?? META_PLANILLA_MINIMA_DEFAULT;
    return { meta, minima };
  }
  return { meta: metaCelula, minima: metaMinima };
}

/** Admin / Super: sus afiliados cuentan en el bucket de Empleados (meta). */
export function esRolAdminOSuper(rol: string | null | undefined) {
  const r = normalizarRol(rol);
  return r === "ADMIN" || r === "ADMINISTRADOR" || r === "SUPER";
}

/** Detecta el usuario especial "Sede" (rol SEDE, o nombre/usuario legado). */
export function esUsuarioSede(lider: {
  nombres?: string | null;
  apellidos?: string | null;
  email?: string | null;
  rol?: string | null;
}): boolean {
  if ((lider.rol || "").trim().toUpperCase() === "SEDE") return true;

  const nombres = (lider.nombres || "").trim().toLowerCase();
  const apellidos = (lider.apellidos || "").trim().toLowerCase();
  const nombreCompleto = `${nombres} ${apellidos}`.trim();
  const emailLocal = (lider.email || "").split("@")[0].trim().toLowerCase();

  return (
    nombres === "sede" ||
    nombreCompleto === "sede" ||
    nombreCompleto.startsWith("sede ") ||
    emailLocal === "sede"
  );
}

export const POLITICAS = [
  "Obras de Infraestructura",
  "Red Vial",
  "Educación",
  "Medio Ambiente",
  "Desarrollo Económico Local",
  "Servicios Públicos",
  "de Seguridad",
  "Salud",
] as const;

export const afiliadoSchema = z.object({
  nombres: z.string().min(2, "Requerido"),
  apellidos: z.string().min(2, "Requerido"),
  telefono: z
    .string()
    .length(8, "Debe tener 8 dígitos")
    .regex(/^\d+$/, "Solo números"),
  dpi: z
    .string()
    .length(13, "Debe tener 13 dígitos")
    .regex(/^\d+$/, "Solo números"),
  nacimiento: z.string().min(1, "Requerido"),
  sexo: z.enum(["M", "F"]),
  lugar_id: z.number().min(1, "Seleccione un lugar"),
  lider_id: z.string().uuid().nullable(),
  politica: z.string().optional(),
  empadronado: z.boolean().optional(),
  no_padron: z.string().min(1, "El No. de Padrón es obligatorio"),
  religion: z.string().optional(),
  religion_otra: z.string().optional(),
});

// Definimos AfiliadoFormData directamente desde Zod
export type AfiliadoFormData = z.infer<typeof afiliadoSchema>;

// Extendemos Afiliado para que herede TODO de AfiliadoFormData
export interface Afiliado extends AfiliadoFormData {
  id: string;
  created_at: string;
  lider_nombre: string | null;
  lider_email: string | null;
  lugar_nombre: string | null;
  conteoAfiliados?: number;
}
