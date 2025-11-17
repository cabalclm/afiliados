import { z } from 'zod';

export interface Lider {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  dpi: string; 
  nacimiento: string; 
  sexo: string; 
  rol: string;
  lugar_id: number; 
  lugar_nombre: string;
  conteoAfiliados?: number;
}

export const afiliadoSchema = z.object({
  nombres: z.string().min(1, { message: 'Los nombres son obligatorios.' }),
  apellidos: z.string().min(1, { message: 'Los apellidos son obligatorios.' }),
  
  telefono: z.string().length(8, { message: 'El teléfono debe tener 8 dígitos.' }).nullable().optional(),
  
  dpi: z.string().length(13, { message: 'El DPI debe tener 13 dígitos.' }),
  nacimiento: z.string().min(1, { message: 'La fecha es obligatoria.' })
    .refine((date) => new Date(date) <= new Date(), { message: "La fecha no puede ser en el futuro." })
    .refine((date) => new Date(date) >= new Date('1900-01-01'), { message: "El año no puede ser anterior a 1900." }),
  sexo: z.enum(['F', 'M']),
  
  lider_id: z.string().uuid().nullable().optional(), 
  lugar_id: z.number().int().min(1, { message: 'Debe seleccionar un lugar.' }), 
});

export type AfiliadoFormData = z.infer<typeof afiliadoSchema> & {
    lugar_id: number;
};

export type Afiliado = AfiliadoFormData & {
  id: string;
  created_at: string;
  
  lider_nombre: string | null;
  lider_email: string | null;
  lugar_nombre: string | null;
  
  conteoAfiliados?: number; 
};