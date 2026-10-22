import type { Afiliado } from "./esquemas";
import { formatearDpi, formatearTelefono } from "./contacto";
import { calcularEdadAnios, calcularEdadLabel } from "@/utils/formatoFechaGT";

export type GrupoEdad = "todos" | "jovenes" | "adultos" | "mayores";

export const GRUPOS_EDAD: Array<{
  id: Exclude<GrupoEdad, "todos">;
  label: string;
  corto: string;
  min: number;
  max: number;
}> = [
  { id: "jovenes", label: "Jóvenes (18-30)", corto: "Jóvenes", min: 18, max: 30 },
  { id: "adultos", label: "Adultos (31-64)", corto: "Adultos", min: 31, max: 64 },
  { id: "mayores", label: "Mayores (65+)", corto: "Mayores", min: 65, max: 150 },
];

type Conteo = { label: string; hombres: number; mujeres: number };

function conteosDe(afiliados: Afiliado[], grupo: GrupoEdad): Conteo[] {
  const todos = conteos(afiliados);
  if (grupo === "todos") return todos;
  const etiqueta = GRUPOS_EDAD.find((g) => g.id === grupo)?.label;
  return todos.filter((stat) => stat.label === etiqueta);
}

function conteos(afiliados: Afiliado[]): Conteo[] {
  return GRUPOS_EDAD.map((grupo) => {
    let hombres = 0;
    let mujeres = 0;
    afiliados.forEach((af) => {
      const edad = calcularEdadAnios(af.nacimiento);
      if (edad === null || edad < grupo.min || edad > grupo.max) return;
      if (af.sexo === "M") hombres += 1;
      else mujeres += 1;
    });
    return { label: grupo.label, hombres, mujeres };
  });
}

function grupoDe(afiliado: Afiliado) {
  const edad = calcularEdadAnios(afiliado.nacimiento);
  if (edad === null) return null;
  return GRUPOS_EDAD.find((g) => edad >= g.min && edad <= g.max) ?? null;
}

function filtrar(afiliados: Afiliado[], grupo: GrupoEdad) {
  const lista = afiliados.filter((af) => grupoDe(af));
  const elegidos =
    grupo === "todos"
      ? lista
      : lista.filter((af) => grupoDe(af)?.id === grupo);
  return [...elegidos].sort((a, b) =>
    `${a.nombres} ${a.apellidos}`.localeCompare(
      `${b.nombres} ${b.apellidos}`,
      "es",
    ),
  );
}

function etiquetaGrupo(grupo: GrupoEdad) {
  if (grupo === "todos") return "Todos";
  return GRUPOS_EDAD.find((g) => g.id === grupo)?.corto ?? "Todos";
}

function ahoraGT() {
  return new Date().toLocaleString("es-GT", {
    timeZone: "America/Guatemala",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function slug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

const BARRAS = 18;

function pintarBarra(
  row: import("exceljs").Row,
  desde: number,
  valor: number,
  maximo: number,
  color: string,
) {
  const celdas = maximo > 0 ? Math.max(1, Math.round((valor / maximo) * BARRAS)) : 0;
  const pintadas = valor === 0 ? 0 : celdas;
  for (let i = 0; i < BARRAS; i += 1) {
    const cell = row.getCell(desde + i);
    cell.value = i === 0 && pintadas === 0 ? "" : null;
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: i < pintadas ? color : "FFF8FAFC" },
    };
  }
  const total = row.getCell(desde + BARRAS);
  total.value = valor;
  total.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF0F172A" } };
  total.alignment = { vertical: "middle", horizontal: "left" };
}

export async function descargarExcelEdades(
  afiliados: Afiliado[],
  grupo: GrupoEdad,
) {
  const mod = await import("exceljs");
  const ExcelJS = (mod as { default?: typeof import("exceljs") }).default ?? mod;
  const stats = conteosDe(afiliados, grupo);
  const personas = filtrar(afiliados, grupo);
  const maximo = Math.max(
    1,
    ...stats.flatMap((s) => [s.hombres, s.mujeres]),
  );
  const nombreGrupo = etiquetaGrupo(grupo);

  const wb = new ExcelJS.Workbook();
  wb.creator = "CLM Afiliados";
  const ws = wb.addWorksheet("Edades", {
    views: [{ showGridLines: false }],
  });

  ws.mergeCells("A1:V1");
  const titulo = ws.getCell("A1");
  titulo.value = `Demografía por edad — ${nombreGrupo}`;
  titulo.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  titulo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0369A1" } };
  titulo.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(1).height = 26;

  ws.mergeCells("A2:V2");
  const sub = ws.getCell("A2");
  sub.value = `Generado ${ahoraGT()}  ·  ${personas.length} registro${personas.length === 1 ? "" : "s"} en el listado`;
  sub.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF475569" } };
  ws.getRow(2).height = 18;

  const head = ws.getRow(4);
  ["Rango", "Hombres", "Mujeres", "Total"].forEach((texto, i) => {
    const cell = head.getCell(i + 1);
    cell.value = texto;
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF0C4A6E" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFBAE6FD" } };
    cell.alignment = { horizontal: "center" };
  });
  ws.getColumn(1).width = 22;
  ws.getColumn(2).width = 12;
  ws.getColumn(3).width = 12;
  ws.getColumn(4).width = 12;

  stats.forEach((stat, i) => {
    const row = ws.getRow(5 + i);
    row.getCell(1).value = stat.label;
    row.getCell(2).value = stat.hombres;
    row.getCell(3).value = stat.mujeres;
    row.getCell(4).value = stat.hombres + stat.mujeres;
    row.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 11, color: { argb: "FF0F172A" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    row.getCell(1).alignment = { horizontal: "left" };
    row.getCell(1).font = { name: "Calibri", size: 11, bold: true };
  });

  ws.getCell("A9").value = "Gráfica horizontal";
  ws.getCell("A9").font = { name: "Calibri", size: 12, bold: true, color: { argb: "FF0369A1" } };
  ws.getCell("B10").value = "Hombres";
  ws.getCell("B10").font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF1D4ED8" } };
  ws.getCell("B11").value = "Mujeres";
  ws.getCell("B11").font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFBE185D" } };

  stats.forEach((stat, i) => {
    const base = 13 + i * 2;
    const hombres = ws.getRow(base);
    const mujeres = ws.getRow(base + 1);
    hombres.height = 16;
    mujeres.height = 16;
    hombres.getCell(1).value = stat.label;
    hombres.getCell(1).font = { name: "Calibri", size: 10, bold: true };
    hombres.getCell(1).alignment = { vertical: "middle" };
    pintarBarra(hombres, 10, stat.hombres, maximo, "FF3B82F6");
    pintarBarra(mujeres, 10, stat.mujeres, maximo, "FFEC4899");
  });

  ws.getColumn(1).width = 24;
  ws.getColumn(2).width = 36;
  ws.getColumn(3).width = 18;
  ws.getColumn(4).width = 14;
  ws.getColumn(5).width = 12;
  ws.getColumn(6).width = 10;
  ws.getColumn(7).width = 22;
  ws.getColumn(8).width = 14;
  for (let c = 10; c < 10 + BARRAS; c += 1) ws.getColumn(c).width = 2.4;
  ws.getColumn(10 + BARRAS).width = 8;

  const inicioLista = 13 + stats.length * 2 + 2;
  const columnas = [
    "No.",
    "Nombre",
    "DPI",
    "Teléfono",
    "Edad",
    "Sexo",
    "Ubicación",
    "Rango",
  ];
  const encabezado = ws.getRow(inicioLista);
  columnas.forEach((texto, i) => {
    const cell = encabezado.getCell(i + 1);
    cell.value = texto;
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
    cell.alignment = { horizontal: "center" };
  });
  ws.getColumn(2).width = 36;

  personas.forEach((af, i) => {
    const row = ws.getRow(inicioLista + 1 + i);
    const valores = [
      i + 1,
      `${af.nombres} ${af.apellidos}`.trim(),
      af.dpi ? formatearDpi(af.dpi) : "",
      af.telefono ? formatearTelefono(af.telefono) : "",
      calcularEdadLabel(af.nacimiento),
      af.sexo === "M" ? "M" : af.sexo === "F" ? "F" : "",
      af.lugar_nombre || "",
      grupoDe(af)?.corto || "",
    ];
    valores.forEach((valor, col) => {
      const cell = row.getCell(col + 1);
      cell.value = valor;
      cell.font = { name: "Calibri", size: 11, color: { argb: "FF0F172A" } };
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer);
  const url = URL.createObjectURL(
    new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `edades_${slug(nombreGrupo)}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function descargarPdfEdades(
  afiliados: Afiliado[],
  grupo: GrupoEdad,
) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const stats = conteosDe(afiliados, grupo);
  const personas = filtrar(afiliados, grupo);
  const nombreGrupo = etiquetaGrupo(grupo);
  const maximo = Math.max(1, ...stats.flatMap((s) => [s.hombres, s.mujeres]));

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [216, 330],
    compress: true,
  });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margen = 10;

  doc.setFillColor(3, 105, 161);
  doc.rect(0, 0, pageWidth, 16, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`Demografía por edad — ${nombreGrupo}`, margen, 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    `${personas.length} registro${personas.length === 1 ? "" : "s"}  ·  ${ahoraGT()}`,
    margen,
    12,
  );

  let y = 24;
  doc.setTextColor(12, 74, 110);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Hombres y mujeres por rango", margen, y);
  y += 8;

  const barraX = 36;
  const barraAlto = 7;
  const barraMax = pageWidth - margen - barraX - 16;

  const dibujarTotal = (total: number, centroY: number) => {
    const texto = String(total);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const numW = doc.getTextWidth(texto);
    doc.setFontSize(7);
    const labelW = doc.getTextWidth("TOTAL");
    const ancho = 4 + labelW + 4 + numW + 4;
    const alto = 8;
    const x = pageWidth - margen - ancho;
    const top = centroY - alto / 2;
    doc.setFillColor(240, 249, 255);
    doc.setDrawColor(125, 211, 252);
    doc.setLineWidth(0.35);
    doc.roundedRect(x, top, ancho, alto, 1.6, 1.6, "FD");
    doc.setFillColor(3, 105, 161);
    doc.rect(x, top, 1.6, alto, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(3, 105, 161);
    doc.text("TOTAL", x + 4.2, centroY + 0.9);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(texto, x + ancho - 3.2, centroY + 1.2, { align: "right" });
  };

  const dibujarFila = (
    etiqueta: string,
    colorTexto: [number, number, number],
    colorBarra: [number, number, number],
    valor: number,
    top: number,
  ) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...colorTexto);
    doc.text(etiqueta, margen, top + 5);

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(barraX, top, barraMax, barraAlto, 1.4, 1.4, "F");
    const ancho = (valor / maximo) * barraMax;
    if (valor > 0) {
      doc.setFillColor(...colorBarra);
      doc.roundedRect(barraX, top, Math.max(ancho, 2), barraAlto, 1.4, 1.4, "F");
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...colorTexto);
    doc.text(String(valor), barraX + Math.max(ancho, 0) + 2, top + 5);
  };

  stats.forEach((stat) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(stat.label, margen, y + 1);
    dibujarTotal(stat.hombres + stat.mujeres, y - 1.2);
    y += 5;
    dibujarFila("Hombres", [29, 78, 216], [59, 130, 246], stat.hombres, y);
    y += barraAlto + 2.4;
    dibujarFila("Mujeres", [190, 24, 93], [236, 72, 153], stat.mujeres, y);
    y += barraAlto + 7;
  });

  autoTable(doc, {
    startY: y,
    head: [["No.", "Nombre", "DPI", "Teléfono", "Edad", "Sexo", "Ubicación", "Rango"]],
    body: personas.map((af, i) => [
      String(i + 1),
      `${af.nombres} ${af.apellidos}`.trim(),
      af.dpi ? formatearDpi(af.dpi) : "",
      af.telefono ? formatearTelefono(af.telefono) : "",
      calcularEdadLabel(af.nacimiento),
      af.sexo === "M" ? "M" : af.sexo === "F" ? "F" : "",
      af.lugar_nombre || "",
      grupoDe(af)?.corto || "",
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 1.5,
      textColor: [30, 41, 59],
      lineColor: [186, 230, 253],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [186, 230, 253],
      textColor: [12, 74, 110],
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: { fillColor: [240, 249, 255] },
    margin: { left: 10, right: 10, bottom: 16 },
  });

  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margen, pageHeight - 11, pageWidth - margen, pageHeight - 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Página ${i} de ${totalPaginas}`, pageWidth / 2, pageHeight - 6, {
      align: "center",
    });
  }

  doc.save(
    `edades_${slug(nombreGrupo)}_${new Date().toISOString().slice(0, 10)}.pdf`,
  );
}
