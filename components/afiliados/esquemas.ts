import { z } from "zod";

export interface Lider {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  rol: string;
  conteoAfiliados?: number;
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
