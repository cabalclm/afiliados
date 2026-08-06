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

/** Parsea entrada manual `dd/mm/aaaa` o `d/m/aaaa`. */
export function parseFechaDMYInput(
  valor: string | null | undefined,
): FechaCalendario | null {
  if (!valor) return null;
  const m = String(valor).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

export function fechaCalendarioAISO(p: FechaCalendario): string {
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** Acepta `YYYY-MM-DD` o `dd/mm/aaaa` y devuelve ISO para guardar. */
export function normalizarNacimientoForm(valor: string): string {
  const trimmed = valor.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const p = parseFechaDMYInput(trimmed);
  if (p) return fechaCalendarioAISO(p);
  return trimmed;
}

/** Máscara progresiva mientras se escribe: `12061992` → `12/06/1992`. */
export function formatearEntradaDMY(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
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

/** Ej.: Lun 01/06/25 | 02:35 AM (zona Guatemala). */
export function formatearFechaHoraMensaje(
  valor: string | null | undefined,
): string {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";

  const tz = "America/Guatemala";
  const diaSemana = new Intl.DateTimeFormat("es-GT", {
    timeZone: tz,
    weekday: "short",
  })
    .format(d)
    .replace(/\.$/, "");
  const diaCap =
    diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1).toLowerCase();

  const partesFecha = new Intl.DateTimeFormat("es-GT", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).formatToParts(d);
  const dd = partesFecha.find((p) => p.type === "day")?.value ?? "00";
  const mm = partesFecha.find((p) => p.type === "month")?.value ?? "00";
  const yy = partesFecha.find((p) => p.type === "year")?.value ?? "00";

  const partesHora = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(d);
  const hour = partesHora.find((p) => p.type === "hour")?.value ?? "00";
  const minute = partesHora.find((p) => p.type === "minute")?.value ?? "00";
  const meridiano =
    partesHora.find((p) => p.type === "dayPeriod")?.value.toUpperCase() ?? "AM";

  return `${diaCap} ${dd}/${mm}/${yy} | ${hour}:${minute} ${meridiano}`;
}
