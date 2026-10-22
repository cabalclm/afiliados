import type { Afiliado, Lider } from "./esquemas";
import { formatearDpi, formatearTelefono } from "./contacto";
import { calcularEdadLabel } from "@/utils/formatoFechaGT";

type FilaCelula = {
  No: number;
  Nombre: string;
  DPI: string;
  Teléfono: string;
  Edad: string;
  Sexo: string;
  Ubicación: string;
  Empadronado: string;
  "No. Padrón": string;
};

const COLUMNAS: Array<{ key: keyof FilaCelula; width: number }> = [
  { key: "No", width: 6 },
  { key: "Nombre", width: 36 },
  { key: "DPI", width: 18 },
  { key: "Teléfono", width: 14 },
  { key: "Edad", width: 12 },
  { key: "Sexo", width: 8 },
  { key: "Ubicación", width: 22 },
  { key: "Empadronado", width: 14 },
  { key: "No. Padrón", width: 14 },
];

function nombreLider(lider: Lider) {
  return `${lider.nombres} ${lider.apellidos}`.trim();
}

function slug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
}

function filasCelula(afiliados: Afiliado[]): FilaCelula[] {
  return afiliados.map((afiliado, index) => ({
    No: index + 1,
    Nombre: `${afiliado.nombres} ${afiliado.apellidos}`.trim(),
    DPI: afiliado.dpi ? formatearDpi(afiliado.dpi) : "",
    Teléfono: afiliado.telefono ? formatearTelefono(afiliado.telefono) : "",
    Edad: calcularEdadLabel(afiliado.nacimiento),
    Sexo: afiliado.sexo === "M" ? "M" : afiliado.sexo === "F" ? "F" : "",
    Ubicación: afiliado.lugar_nombre || "",
    Empadronado: afiliado.empadronado ? "Sí" : "No",
    "No. Padrón": afiliado.no_padron || "",
  }));
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

function hexArgb(hex: string) {
  return hex.replace("#", "").toUpperCase();
}

function descargarBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function descargarExcelCelula(
  lider: Lider,
  afiliados: Afiliado[],
) {
  const mod = await import("exceljs");
  const ExcelJS = (mod as { default?: typeof import("exceljs") }).default ?? mod;
  const filas = filasCelula(afiliados);
  const responsable = nombreLider(lider);
  const accent = "#0F766E";

  const wb = new ExcelJS.Workbook();
  wb.creator = "CLM Afiliados";
  wb.created = new Date();
  const ws = wb.addWorksheet("Célula", {
    views: [{ state: "frozen", ySplit: 3, showGridLines: false }],
    properties: { tabColor: { argb: hexArgb(accent) } },
  });

  const lastCol = COLUMNAS.length;
  const lastLetter = String.fromCharCode(64 + lastCol);

  ws.mergeCells(`A1:${lastLetter}1`);
  const titulo = ws.getCell("A1");
  titulo.value = `CLM — Célula de ${responsable}`;
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
  sub.value = `Generado ${ahoraGT()}  ·  ${filas.length} integrante${filas.length === 1 ? "" : "s"}`;
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
    ws.getColumn(i + 1).width = col.width;
  });

  filas.forEach((fila, idx) => {
    const row = ws.getRow(4 + idx);
    row.height = 18;
    const zebra = idx % 2 === 0 ? "FFFFFFFF" : "FFF8FAFC";
    COLUMNAS.forEach((col, i) => {
      const cell = row.getCell(i + 1);
      cell.value = fila[col.key];
      cell.font = {
        name: "Calibri",
        size: 11,
        bold: col.key === "Nombre",
        color: { argb: "FF0F172A" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: col.key === "Nombre" || col.key === "Ubicación" ? "left" : "center",
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: zebra },
      };
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
    paperSize: 5,
    margins: {
      left: 0.4,
      right: 0.4,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    },
  };

  const buffer = await wb.xlsx.writeBuffer();
  const bytes =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer);
  const fecha = new Date().toISOString().slice(0, 10);
  descargarBlob(
    new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `celula_${slug(responsable) || "integrantes"}_${fecha}.xlsx`,
  );
}

/** Oficio Guatemala: 216 × 330 mm, en horizontal para que quepa la tabla. */
const OFICIO_GT: [number, number] = [216, 330];

/** El PNG trae fondo negro; se deja transparente para que se vea el logo sobre el papel. */
async function logoSoteDataUrl() {
  const res = await fetch("/icons/logo.png");
  if (!res.ok) return null;
  const blob = await res.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = frame.data;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i] < 28 && px[i + 1] < 28 && px[i + 2] < 28) px[i + 3] = 0;
  }
  ctx.putImageData(frame, 0, 0);
  return canvas.toDataURL("image/png");
}

export async function descargarPdfCelula(lider: Lider, afiliados: Afiliado[]) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const filas = filasCelula(afiliados);
  const responsable = nombreLider(lider);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: OFICIO_GT,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 10;
  const logo = await logoSoteDataUrl();
  const logoSize = 18;
  if (logo) {
    doc.addImage(logo, "PNG", marginX, 6, logoSize, logoSize);
  }

  const textoX = logo ? marginX + logoSize + 4 : marginX;
  doc.setTextColor(12, 74, 110);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Listado de integrantes", textoX, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(3, 105, 161);
  doc.text(`Célula de ${responsable}`, textoX, 18);
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `${filas.length} integrante${filas.length === 1 ? "" : "s"}  ·  ${ahoraGT()}`,
    textoX,
    23,
  );

  const usable = pageWidth - marginX * 2;
  const anchosFijos = [12, 58, 36, 28, 20, 14, 40, 26, 26];
  const usado = anchosFijos.reduce((suma, n) => suma + n, 0);
  const anchoLibre = Math.max(usable - usado, 16);
  const anchos = [...anchosFijos, anchoLibre];

  autoTable(doc, {
    startY: 30,
    tableWidth: usable,
    head: [
      [
        "No.",
        "Nombre",
        "DPI",
        "Teléfono",
        "Edad",
        "Sexo",
        "Ubicación",
        "Empadronado",
        "No. Padrón",
        "",
      ],
    ],
    body: filas.map((fila) => [
      String(fila.No),
      fila.Nombre,
      fila.DPI,
      fila.Teléfono,
      fila.Edad,
      fila.Sexo,
      fila.Ubicación,
      fila.Empadronado,
      fila["No. Padrón"],
      "",
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: { top: 1.8, right: 1.4, bottom: 1.8, left: 1.4 },
      textColor: [30, 41, 59],
      lineColor: [186, 230, 253],
      lineWidth: 0.15,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [186, 230, 253],
      textColor: [12, 74, 110],
      fontStyle: "bold",
      halign: "center",
      fontSize: 8,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
    },
    alternateRowStyles: { fillColor: [240, 249, 255] },
    columnStyles: {
      0: { halign: "center", cellWidth: anchos[0] },
      1: { halign: "left", cellWidth: anchos[1] },
      2: { halign: "center", cellWidth: anchos[2] },
      3: { halign: "center", cellWidth: anchos[3] },
      4: { halign: "center", cellWidth: anchos[4] },
      5: { halign: "center", cellWidth: anchos[5] },
      6: { halign: "left", cellWidth: anchos[6] },
      7: { halign: "center", cellWidth: anchos[7] },
      8: { halign: "center", cellWidth: anchos[8] },
      9: { cellWidth: anchos[9], fillColor: [255, 255, 255] },
    },
    margin: { left: marginX, right: marginX, bottom: 12 },
  });

  const pages = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Página ${page} de ${pages}`, pageWidth - 8, pageHeight - 6, {
      align: "right",
    });
  }

  const fecha = new Date().toISOString().slice(0, 10);
  doc.save(`celula_${slug(responsable) || "integrantes"}_${fecha}.pdf`);
}
