import type { Afiliado, Lider } from "./esquemas";
import {
  esRolEmpleado,
  esRolLider,
  esRolPlanilla,
  esUsuarioSede,
} from "./esquemas";
import {
  calcularEdadAnios,
  formatearFechaDMY,
} from "@/utils/formatoFechaGT";
import { formatearDpi, formatearTelefono } from "./contacto";

export type FilaEquipo = {
  Nombre: string;
  Apellidos: string;
  Tipo: string;
  Rol: string;
  Correo: string;
  Teléfono: string;
  DPI: string;
  Nacimiento: string;
  Edad: number | string;
  Sexo: string;
  Ubicación: string;
  Empadronado: string;
  "No. Padrón": string;
  Religión: string;
  Política: string;
  Miembros: number;
  Meta: number;
  Compromiso: string;
};

const COLUMNAS: Array<{ key: keyof FilaEquipo; width: number }> = [
  { key: "Nombre", width: 22 },
  { key: "Apellidos", width: 26 },
  { key: "Tipo", width: 12 },
  { key: "Rol", width: 14 },
  { key: "Correo", width: 32 },
  { key: "Teléfono", width: 14 },
  { key: "DPI", width: 18 },
  { key: "Nacimiento", width: 14 },
  { key: "Edad", width: 10 },
  { key: "Sexo", width: 8 },
  { key: "Ubicación", width: 22 },
  { key: "Empadronado", width: 14 },
  { key: "No. Padrón", width: 14 },
  { key: "Religión", width: 18 },
  { key: "Política", width: 24 },
  { key: "Miembros", width: 12 },
  { key: "Meta", width: 10 },
  { key: "Compromiso", width: 14 },
];

function normalizarNombre(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function compararNombres(a: string, b: string) {
  return normalizarNombre(a).localeCompare(normalizarNombre(b), "es");
}

function tipoDeUsuario(user: Lider): "Líder" | "Empleado" | "Planilla" | null {
  if (esUsuarioSede(user)) return null;
  if (esRolLider(user.rol)) return "Líder";
  if (esRolEmpleado(user.rol)) return "Empleado";
  if (esRolPlanilla(user.rol)) return "Planilla";
  return null;
}

function etiquetaRol(rol: string) {
  const r = (rol || "").trim().toUpperCase();
  if (r === "LIDER") return "Líder";
  if (r === "EMPLEADO" || r === "TRABAJADOR") return "Empleado";
  if (r === "PLANILLA") return "Planilla";
  return rol || "";
}

function religionDe(afiliado: Afiliado | null) {
  if (!afiliado) return "";
  const otra = (afiliado.religion_otra || "").trim();
  const rel = (afiliado.religion || "").trim();
  if (rel.toLowerCase() === "otra" && otra) return otra;
  return otra || rel;
}

function nivelCompromiso(total: number, meta: number, metaMinima: number) {
  if (total > meta) return "Alto";
  if (total === meta) return "Cumple";
  if (total >= metaMinima && total < meta) return "Medio";
  return "Bajo";
}

/** Cruza usuario (líder/empleado) con su ficha de afiliado por célula y nombre. */
export function perfilAfiliadoDeUsuario(
  user: Lider,
  afiliados: Afiliado[],
): Afiliado | null {
  const nombre = normalizarNombre(`${user.nombres} ${user.apellidos}`);
  if (!nombre) return null;

  const deCelula = afiliados.filter((a) => a.lider_id === user.id);
  const enCelula = deCelula.find(
    (a) =>
      normalizarNombre(`${a.nombres} ${a.apellidos}`) === nombre,
  );
  if (enCelula) return enCelula;

  return (
    afiliados.find(
      (a) =>
        normalizarNombre(`${a.nombres} ${a.apellidos}`) === nombre,
    ) || null
  );
}

export function filasEquipoExcel(
  usuarios: Lider[],
  afiliados: Afiliado[],
  metaCelula = 15,
  metaMinima = 10,
): FilaEquipo[] {
  const filas: FilaEquipo[] = [];

  for (const user of usuarios) {
    if (user.simulado) continue;
    const tipo = tipoDeUsuario(user);
    if (!tipo) continue;

    const afiliado = perfilAfiliadoDeUsuario(user, afiliados);
    const miembros = user.conteoAfiliados || 0;
    const edad = afiliado ? calcularEdadAnios(afiliado.nacimiento) : null;

    filas.push({
      Nombre: (user.nombres || afiliado?.nombres || "").trim(),
      Apellidos: (user.apellidos || afiliado?.apellidos || "").trim(),
      Tipo: tipo,
      Rol: etiquetaRol(user.rol),
      Correo: user.email || "",
      Teléfono: afiliado?.telefono
        ? formatearTelefono(afiliado.telefono)
        : "",
      DPI: afiliado?.dpi ? formatearDpi(afiliado.dpi) : "",
      Nacimiento: afiliado?.nacimiento
        ? formatearFechaDMY(afiliado.nacimiento)
        : "",
      Edad: edad ?? "",
      Sexo: afiliado?.sexo === "M" ? "M" : afiliado?.sexo === "F" ? "F" : "",
      Ubicación: afiliado?.lugar_nombre || "",
      Empadronado: afiliado
        ? afiliado.empadronado
          ? "Sí"
          : "No"
        : "",
      "No. Padrón": afiliado?.no_padron || "",
      Religión: religionDe(afiliado),
      Política: afiliado?.politica || "",
      Miembros: miembros,
      Meta: metaCelula,
      Compromiso: nivelCompromiso(miembros, metaCelula, metaMinima),
    });
  }

  return filas.sort((a, b) => {
    const orden: Record<string, number> = {
      Líder: 0,
      Empleado: 1,
      Planilla: 2,
    };
    if (a.Tipo !== b.Tipo) return (orden[a.Tipo] ?? 9) - (orden[b.Tipo] ?? 9);
    return compararNombres(
      `${a.Nombre} ${a.Apellidos}`,
      `${b.Nombre} ${b.Apellidos}`,
    );
  });
}

function hexArgb(hex: string) {
  return hex.replace("#", "").toUpperCase();
}

async function escribirHoja(
  workbook: import("exceljs").Workbook,
  nombre: string,
  filas: FilaEquipo[],
  accent: string,
) {
  const ws = workbook.addWorksheet(nombre, {
    views: [{ state: "frozen", ySplit: 3, showGridLines: false }],
    properties: { tabColor: { argb: hexArgb(accent) } },
  });

  const lastCol = COLUMNAS.length;
  const lastLetter = String.fromCharCode(64 + lastCol);

  ws.mergeCells(`A1:${lastLetter}1`);
  const titulo = ws.getCell("A1");
  titulo.value = "CLM — Equipo: líderes y empleados";
  titulo.font = {
    name: "Calibri",
    size: 16,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  titulo.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  titulo.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: hexArgb(accent) },
  };
  ws.getRow(1).height = 28;

  ws.mergeCells(`A2:${lastLetter}2`);
  const sub = ws.getCell("A2");
  const ahora = new Date().toLocaleString("es-GT", {
    timeZone: "America/Guatemala",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  sub.value = `Generado ${ahora}  ·  ${filas.length} registro${filas.length === 1 ? "" : "s"}  ·  Datos de usuario cruzados con ficha de afiliado`;
  sub.font = {
    name: "Calibri",
    size: 10,
    italic: true,
    color: { argb: "FF64748B" },
  };
  sub.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sub.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF1F5F9" },
  };
  ws.getRow(2).height = 20;

  const header = ws.getRow(3);
  header.height = 22;
  COLUMNAS.forEach((col, i) => {
    const cell = header.getCell(i + 1);
    cell.value = col.key;
    cell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" },
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: hexArgb(accent) } },
    };
    ws.getColumn(i + 1).width = col.width;
  });

  filas.forEach((fila, idx) => {
    const row = ws.getRow(4 + idx);
    row.height = 18;
    const zebra = idx % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC";
    const tipoFill =
      fila.Tipo === "Líder"
        ? "FFFFF7ED"
        : fila.Tipo === "Planilla"
          ? "FFFEF2F2"
          : "FFF5F3FF";

    COLUMNAS.forEach((col, i) => {
      const cell = row.getCell(i + 1);
      cell.value = fila[col.key];
      cell.font = { name: "Calibri", size: 11, color: { argb: "FF0F172A" } };
      cell.alignment = {
        vertical: "middle",
        horizontal: i === 0 || i === 1 || i === 4 || i === 10 ? "left" : "center",
      };
      const bg =
        col.key === "Nombre" || col.key === "Apellidos"
          ? tipoFill
          : col.key === "Tipo"
            ? fila.Tipo === "Líder"
              ? "FFFDBA74"
              : fila.Tipo === "Planilla"
                ? "FFFECACA"
                : "FFC4B5FD"
            : col.key === "Compromiso"
              ? fila.Compromiso === "Alto"
                ? "FFBBF7D0"
                : fila.Compromiso === "Cumple"
                  ? "FFBFDBFE"
                  : fila.Compromiso === "Medio"
                    ? "FFFEF08A"
                    : "FFFECACA"
              : zebra;
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bg },
      };
      cell.border = {
        top: { style: "hair", color: { argb: "FFE2E8F0" } },
        bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
        left: { style: "hair", color: { argb: "FFE2E8F0" } },
        right: { style: "hair", color: { argb: "FFE2E8F0" } },
      };
      if (col.key === "Nombre") {
        cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF0F172A" } };
      }
    });
  });

  if (filas.length > 0) {
    ws.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 3 + filas.length, column: lastCol },
    };
  }

  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
  };
}

function descargarBuffer(buffer: ArrayBuffer | Uint8Array, filename: string) {
  const bytes =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function descargarExcelEquipo(
  usuarios: Lider[],
  afiliados: Afiliado[],
  metaCelula = 15,
  metaMinima = 10,
) {
  const mod = await import("exceljs");
  const ExcelJS = (mod as { default?: typeof import("exceljs") }).default ?? mod;
  const todas = filasEquipoExcel(usuarios, afiliados, metaCelula, metaMinima);
  const lideres = todas.filter((f) => f.Tipo === "Líder");
  const empleados = todas.filter((f) => f.Tipo === "Empleado");
  const planilla = todas.filter((f) => f.Tipo === "Planilla");

  const wb = new ExcelJS.Workbook();
  wb.creator = "CLM Afiliados";
  wb.created = new Date();
  wb.modified = new Date();

  await escribirHoja(wb, "Equipo", todas, "#0F766E");
  await escribirHoja(wb, "Líderes", lideres, "#EA580C");
  await escribirHoja(wb, "Empleados", empleados, "#7C3AED");
  await escribirHoja(wb, "Planilla", planilla, "#DC2626");

  const buffer = await wb.xlsx.writeBuffer();
  const fecha = new Date().toISOString().slice(0, 10);
  descargarBuffer(buffer as ArrayBuffer, `equipo_lideres_empleados_${fecha}.xlsx`);
}
