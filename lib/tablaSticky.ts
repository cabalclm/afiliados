const SOMBRA_COLUMNA_FIJA =
  "shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_6px_-2px_rgba(0,0,0,0.4)]";

export function columnaNoFijaEncabezado(fondo: string, extra = "") {
  return `sticky left-0 z-20 min-w-[2.75rem] ${SOMBRA_COLUMNA_FIJA} ${fondo} ${extra}`.trim();
}

export function columnaNoFijaCelda(fondo: string, extra = "") {
  return `sticky left-0 z-10 min-w-[2.75rem] ${SOMBRA_COLUMNA_FIJA} ${fondo} ${extra}`.trim();
}

export const FONDO_CELDA_TABLA =
  "bg-white dark:bg-neutral-900 group-hover:bg-gray-50 dark:group-hover:bg-neutral-800";

export const FONDO_ENCABEZADO_TABLA = "bg-gray-100 dark:bg-neutral-800";
