export function obtenerFechaYFormatoGT() {
  const fecha = new Date();
  const formateada = fecha.toLocaleString("es-GT", {
    timeZone: "America/Guatemala",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return { fecha, formateada };
}

/** Partes de calendario (año/mes/día) sin corrimiento por UTC. */
export type FechaCalendario = { y: number; m: number; d: number };

/**
 * Parsea fechas de nacimiento (`date` o `timestamptz` serializado a ISO).
 * Usa el YYYY-MM-DD del string, no `new Date()` local: con timestamptz a
 * medianoche UTC, en America/Guatemala `new Date()` resta un día (2000→1999).
 */
export function parseFechaCalendario(
  valor: string | null | undefined,
): FechaCalendario | null {
  if (!valor) return null;
  const s = String(valor).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
    return { y, m, d };
  }
  const fecha = new Date(s);
  if (Number.isNaN(fecha.getTime())) return null;
  return {
    y: fecha.getFullYear(),
    m: fecha.getMonth() + 1,
    d: fecha.getDate(),
  };
}

/** Para inputs `type="date"`: siempre `YYYY-MM-DD` del calendario. */
export function aFechaInput(
  valor: string | null | undefined,
): string {
  const p = parseFechaCalendario(valor);
  if (!p) return "";
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

export function formatearFechaDMY(
  valor: string | null | undefined,
): string {
  const p = parseFechaCalendario(valor);
  if (!p) return "—";
  return `${String(p.d).padStart(2, "0")}/${String(p.m).padStart(2, "0")}/${p.y}`;
}

export function calcularEdadAnios(
  valor: string | null | undefined,
  referencia: Date = new Date(),
): number | null {
  const p = parseFechaCalendario(valor);
  if (!p) return null;
  let edad = referencia.getFullYear() - p.y;
  const mes = referencia.getMonth() + 1 - p.m;
  if (mes < 0 || (mes === 0 && referencia.getDate() < p.d)) edad -= 1;
  return edad < 0 ? 0 : edad;
}

export function calcularEdadLabel(
  valor: string | null | undefined,
  referencia?: Date,
): string {
  const edad = calcularEdadAnios(valor, referencia);
  if (edad === null) return "—";
  return `${edad} años`;
}
