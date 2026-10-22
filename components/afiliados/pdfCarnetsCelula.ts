import type { Afiliado, Lider } from "./esquemas";
import { formatearDpi } from "./contacto";
import { calcularEdadLabel, formatearFechaDMY } from "@/utils/formatoFechaGT";

const ANCHO_PX = 1000;
const ALTO_PX = 600;
const LOGO_URL = "/images/logosede.png";

function etiquetaGenero(sexo: string | null | undefined) {
  if (sexo === "M") return "Masculino";
  if (sexo === "F") return "Femenino";
  return sexo || "—";
}

function slug(texto: string) {
  return (
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "celula"
  );
}

function el(
  tag: string,
  style: string,
  children?: Array<Node | string>,
) {
  const node = document.createElement(tag);
  node.setAttribute("style", style);
  children?.forEach((child) => {
    node.append(child);
  });
  return node;
}

function etiqueta(texto: string) {
  return el(
    "p",
    "margin:0;font-size:20px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#94a3b8;line-height:1.1;",
    [texto],
  );
}

function valor(texto: string, mono = false) {
  return el(
    "p",
    `margin:6px 0 0;font-size:32px;font-weight:800;color:#111827;line-height:1.1;overflow:hidden;white-space:nowrap;${mono ? "font-family:ui-monospace,SFMono-Regular,Menlo,monospace;" : ""}`,
    [texto],
  );
}

function bloque(titulo: string, dato: string, mono = false) {
  return el("div", "min-width:0;", [etiqueta(titulo), valor(dato, mono)]);
}

function onda() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 856 540");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute(
    "style",
    "position:absolute;inset:0;width:100%;height:100%;",
  );
  svg.innerHTML = `
    <rect width="856" height="540" fill="#ffffff"/>
    <path d="M0 455 C160 435 260 480 400 458 C520 440 620 425 856 412 L856 540 L0 540 Z" fill="#1d4ed8"/>
    <path d="M0 468 C150 450 250 490 390 472 C520 455 630 442 856 430" fill="none" stroke="#1e3a8a" stroke-width="3" opacity="0.4"/>
    <path d="M0 480 C140 462 240 498 380 484 C520 470 640 458 856 448" fill="none" stroke="#1e40af" stroke-width="2.5" opacity="0.35"/>
    <path d="M0 450 C160 430 260 475 400 453 C520 435 620 420 856 407" fill="none" stroke="#2563eb" stroke-width="4" opacity="0.55"/>
    <path d="M400 458 C520 440 620 425 856 412 L856 540 L480 540 C440 520 410 490 400 458 Z" fill="#1e3a8a"/>
    <path d="M460 462 C560 440 680 425 856 418 L856 540 L510 540 C475 515 450 485 460 462 Z" fill="#1d4ed8" opacity="0.95"/>
  `;
  return svg;
}

function crearCarnet(afiliado: Afiliado) {
  const nombre = `${afiliado.nombres} ${afiliado.apellidos}`.trim().toUpperCase();
  const tamanoNombre =
    nombre.length > 36 ? "28px" : nombre.length > 28 ? "32px" : "36px";
  const dpi = afiliado.dpi ? formatearDpi(afiliado.dpi) : "—";
  const padron = afiliado.no_padron || "—";
  const dpiNorm = (afiliado.dpi || "").replace(/\D/g, "");
  const padronNorm = padron.replace(/\D/g, "");
  const mismo = !!dpiNorm && !!padronNorm && dpiNorm === padronNorm;

  const raiz = el(
    "div",
    `position:relative;width:${ANCHO_PX}px;height:${ALTO_PX}px;overflow:hidden;background:#ffffff;border:5px solid #1d4ed8;box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;`,
  );
  raiz.append(onda());

  const logo = document.createElement("img");
  logo.src = LOGO_URL;
  logo.alt = "CABAL";
  logo.crossOrigin = "anonymous";
  logo.draggable = false;
  logo.setAttribute(
    "style",
    "position:absolute;right:18px;top:10px;height:188px;width:auto;object-fit:contain;z-index:3;",
  );

  const titulo = el(
    "p",
    `margin:0;font-weight:900;text-transform:uppercase;letter-spacing:-0.02em;color:#111827;line-height:1.05;white-space:nowrap;overflow:hidden;padding-right:220px;font-size:${tamanoNombre};`,
    [nombre],
  );

  const filaDpi = mismo
    ? bloque("DPI y Padrón", dpi, true)
    : el(
        "div",
        "display:grid;grid-template-columns:1fr 1fr;column-gap:24px;padding-right:210px;box-sizing:border-box;",
        [bloque("DPI", dpi, true), bloque("Padrón", padron, true)],
      );

  const filaDatos = el(
    "div",
    "display:grid;grid-template-columns:1fr 1fr 1fr;column-gap:24px;border-top:2px solid #e2e8f0;border-bottom:2px solid #e2e8f0;padding:14px 0;",
    [
      bloque("Género", etiquetaGenero(afiliado.sexo)),
      bloque("Nacimiento", formatearFechaDMY(afiliado.nacimiento)),
      bloque("Edad", calcularEdadLabel(afiliado.nacimiento)),
    ],
  );

  const contenido = el(
    "div",
    "position:absolute;z-index:2;top:0;left:0;right:0;height:74%;display:flex;flex-direction:column;justify-content:space-between;padding:36px 40px 8px;box-sizing:border-box;",
    [
      titulo,
      el(
        "div",
        "display:flex;flex:1;flex-direction:column;justify-content:space-evenly;padding-right:16px;padding-top:8px;",
        [filaDpi, filaDatos, bloque("Lugar", afiliado.lugar_nombre || "—")],
      ),
    ],
  );

  const pie = el(
    "div",
    "position:absolute;right:40px;bottom:22px;z-index:4;text-align:right;color:#ffffff;font-weight:900;font-size:34px;line-height:1.05;letter-spacing:0.03em;text-transform:uppercase;",
    ["Carnet de", document.createElement("br"), "Afiliación"],
  );

  raiz.append(logo, contenido, pie);
  return raiz;
}

function esperarImagenes(raiz: HTMLElement) {
  const imgs = Array.from(raiz.querySelectorAll("img"));
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

/** Oficio Guatemala vertical. Cada carnet mide 10 × 6 cm, 2 × 5 por hoja. */
export async function descargarPdfCarnetsCelula(
  lider: Lider,
  afiliados: Afiliado[],
) {
  const { jsPDF } = await import("jspdf");
  const { toJpeg } = await import("html-to-image");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [216, 330],
    compress: true,
  });

  const cardW = 100;
  const cardH = 60;
  const cols = 2;
  const rows = 5;
  const porPagina = cols * rows;
  const gapX = 4;
  const gapY = 3;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const gridW = cols * cardW + (cols - 1) * gapX;
  const gridH = rows * cardH + (rows - 1) * gapY;
  const originX = (pageW - gridW) / 2;
  const originY = (pageH - gridH) / 2;

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-14000px;top:0;z-index:-1;pointer-events:none;background:#ffffff;";
  document.body.appendChild(host);

  try {
    for (let i = 0; i < afiliados.length; i += 1) {
      const slot = i % porPagina;
      if (i > 0 && slot === 0) doc.addPage();

      const nodo = crearCarnet(afiliados[i]);
      host.replaceChildren(nodo);
      await esperarImagenes(nodo);
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

      const jpeg = await toJpeg(nodo, {
        pixelRatio: 1,
        quality: 0.62,
        backgroundColor: "#ffffff",
        width: ANCHO_PX,
        height: ALTO_PX,
      });

      const col = slot % cols;
      const row = Math.floor(slot / cols);
      doc.addImage(
        jpeg,
        "JPEG",
        originX + col * (cardW + gapX),
        originY + row * (cardH + gapY),
        cardW,
        cardH,
        undefined,
        "FAST",
      );
    }
  } finally {
    host.remove();
  }

  const responsable = `${lider.nombres} ${lider.apellidos}`.trim();
  doc.save(`carnets_${slug(responsable)}.pdf`);
}
