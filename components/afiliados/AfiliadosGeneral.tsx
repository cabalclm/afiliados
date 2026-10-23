"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Briefcase,
  Landmark,
  Medal,
  Users,
  ArrowLeft,
} from "lucide-react";
import {
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileDown,
  FileText,
  Sheet,
} from "lucide";
import { AnimatePresence, motion } from "framer-motion";
import HoverMorphIcon from "@/components/ui/HoverMorphIcon";
import { toast } from "@/lib/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Afiliado, Lider } from "./esquemas";
import { esRolAdminOSuper, esRolEmpleado, esRolLider, esRolPlanilla, esUsuarioSede } from "./esquemas";
import { formatearDpi, TelefonoInline } from "./contacto";
import { calcularEdadLabel } from "@/utils/formatoFechaGT";
import {
  descargarExcelEdades,
  descargarExcelLugares,
  descargarPdfEdades,
  descargarPdfLugares,
  GRUPOS_EDAD,
  type GrupoEdad,
} from "./exportEdades";
import { TEMA_MIEMBROS, type TemaLista } from "./temaPestana";
import PanelListaPestana from "./PanelListaPestana";
import {
  columnaNoFijaCelda,
  columnaNoFijaEncabezado,
} from "@/lib/tablaSticky";

interface Props {
  afiliados: Afiliado[];
  lideres: Lider[];
  onEditar: (afiliado: Afiliado) => void;
  onDataChange: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  tema?: TemaLista;
  isLoading?: boolean;
}

type GrupoTipo = "todos" | "sede" | "lider" | "trabajador" | "planilla";

type GrupoAfiliados = {
  lider: Lider;
  afiliados: Afiliado[];
  tipo: Exclude<GrupoTipo, "todos">;
};

const CATEGORIAS: Array<{
  tipo: GrupoTipo;
  titulo: string;
  icon: typeof Building2;
  active: string;
  idle: string;
  rowActive: string;
}> = [
  {
    tipo: "todos",
    titulo: "Todos",
    icon: Users,
    active:
      "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400",
    idle:
      "bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-neutral-800 dark:text-gray-400 dark:hover:text-gray-300",
    rowActive: "bg-sky-50 dark:bg-sky-950/40",
  },
  {
    tipo: "sede",
    titulo: "Sede",
    icon: Building2,
    active:
      "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
    idle:
      "bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-neutral-800 dark:text-gray-400 dark:hover:text-gray-300",
    rowActive: "bg-blue-50 dark:bg-blue-950/40",
  },
  {
    tipo: "lider",
    titulo: "Líderes",
    icon: Medal,
    active:
      "bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400",
    idle:
      "bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-neutral-800 dark:text-gray-400 dark:hover:text-gray-300",
    rowActive: "bg-orange-50 dark:bg-orange-950/30",
  },
  {
    tipo: "trabajador",
    titulo: "Empleado",
    icon: Briefcase,
    active:
      "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400",
    idle:
      "bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-neutral-800 dark:text-gray-400 dark:hover:text-gray-300",
    rowActive: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    tipo: "planilla",
    titulo: "Planilla",
    icon: Landmark,
    active:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    idle:
      "bg-gray-100 text-gray-500 hover:text-gray-700 dark:bg-neutral-800 dark:text-gray-400 dark:hover:text-gray-300",
    rowActive: "bg-emerald-50 dark:bg-emerald-950/30",
  },
];

function tipoDeLider(lider: Lider): Exclude<GrupoTipo, "todos"> | null {
  if (esUsuarioSede(lider)) return "sede";
  if (esRolEmpleado(lider.rol) || esRolAdminOSuper(lider.rol)) return "trabajador";
  if (esRolPlanilla(lider.rol)) return "planilla";
  if (esRolLider(lider.rol)) return "lider";
  return null;
}

function liderDesdeAfiliado(liderId: string, lista: Afiliado[]): Lider {
  const nombre = (lista[0]?.lider_nombre || "Líder").trim();
  const partes = nombre.split(/\s+/);
  return {
    id: liderId,
    email: "",
    nombres: partes[0] || "Líder",
    apellidos: partes.slice(1).join(" ") || "",
    rol: "LIDER",
  };
}

function etiquetaGrupo(tipo: Exclude<GrupoTipo, "todos">) {
  if (tipo === "sede") return "Sede";
  if (tipo === "trabajador") return "Empleado";
  if (tipo === "planilla") return "Planilla";
  return "Líder";
}

function normalizarNombre(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function compararNombres(a: string, b: string) {
  return normalizarNombre(a).localeCompare(normalizarNombre(b), "es");
}

type TamanoPagina = 15 | 30 | 45 | "all";

function BtnPaginaMorph({
  direction,
  disabled,
  onClick,
  className,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Página anterior" : "Página siguiente"}
      disabled={disabled}
      onClick={onClick}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <HoverMorphIcon
        idle={direction === "prev" ? ChevronsLeft : ChevronsRight}
        hover={direction === "prev" ? ArrowLeft : ArrowRight}
        size={16}
        active={hovered && !disabled}
      />
    </button>
  );
}

function AfiliadosSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-12 w-36 bg-gray-100 dark:bg-neutral-800 rounded-xl"
          />
        ))}
      </div>
      <div className="h-64 bg-gray-100 dark:bg-neutral-800 rounded-xl" />
    </div>
  );
}

export default function AfiliadosGeneral({
  afiliados,
  lideres,
  searchTerm,
  onSearchChange,
  placeholder = "Buscar por nombre o DPI...",
  tema = TEMA_MIEMBROS,
  isLoading = false,
}: Props) {
  const [categoria, setCategoria] = useState<GrupoTipo>("todos");
  const [liderSeleccionadoId, setLiderSeleccionadoId] = useState<string | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<TamanoPagina>(15);
  const [exportandoEdad, setExportandoEdad] = useState<"excel" | "pdf" | null>(
    null,
  );
  const [esTelefono, setEsTelefono] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const sincronizar = () => setEsTelefono(media.matches);
    sincronizar();
    media.addEventListener("change", sincronizar);
    return () => media.removeEventListener("change", sincronizar);
  }, []);

  const grupos = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const grouped = new Map<string, Afiliado[]>();

    afiliados.forEach((afiliado) => {
      if (!afiliado.lider_id) return;
      const fullName =
        `${afiliado.nombres} ${afiliado.apellidos}`.toLowerCase();
      const dpi = afiliado.dpi || "";
      if (searchTerm && !fullName.includes(term) && !dpi.includes(term)) {
        return;
      }
      if (!grouped.has(afiliado.lider_id)) {
        grouped.set(afiliado.lider_id, []);
      }
      grouped.get(afiliado.lider_id)?.push(afiliado);
    });

    const result: GrupoAfiliados[] = [];
    const liderMap = new Map(lideres.map((l) => [l.id, l]));
    const idsIncluidos = new Set<string>();

    lideres.forEach((lider) => {
      const tipo = tipoDeLider(lider);
      if (!tipo) return;
      result.push({
        lider,
        afiliados: grouped.get(lider.id) || [],
        tipo,
      });
      idsIncluidos.add(lider.id);
    });

    grouped.forEach((lista, liderId) => {
      if (idsIncluidos.has(liderId)) return;
      const lider =
        liderMap.get(liderId) ?? liderDesdeAfiliado(liderId, lista);
      const tipo = tipoDeLider(lider) ?? "lider";
      if (tipo !== "lider") return;
      result.push({ lider, afiliados: lista, tipo });
      idsIncluidos.add(liderId);
    });

    return result.sort((a, b) =>
      compararNombres(
        `${a.lider.nombres} ${a.lider.apellidos}`,
        `${b.lider.nombres} ${b.lider.apellidos}`,
      ),
    );
  }, [afiliados, lideres, searchTerm]);

  const conteosCategoria = useMemo(() => {
    const map: Record<GrupoTipo, number> = {
      todos: 0,
      sede: 0,
      lider: 0,
      trabajador: 0,
      planilla: 0,
    };
    grupos.forEach((g) => {
      map[g.tipo] += g.afiliados.length;
      map.todos += g.afiliados.length;
    });
    return map;
  }, [grupos]);

  const gruposDeCategoria = useMemo(() => {
    if (categoria === "todos") return [];
    return grupos.filter((g) => g.tipo === categoria);
  }, [grupos, categoria]);

  const miembrosTodos = useMemo(() => {
    const rows: Array<{
      afiliado: Afiliado;
      liderNombre: string;
      grupo: string;
    }> = [];

    grupos.forEach((g) => {
      const liderNombre = `${g.lider.nombres} ${g.lider.apellidos}`.trim();
      const grupo = etiquetaGrupo(g.tipo);
      g.afiliados.forEach((a) => {
        rows.push({ afiliado: a, liderNombre, grupo });
      });
    });

    return rows.sort((a, b) =>
      compararNombres(
        `${a.afiliado.nombres} ${a.afiliado.apellidos}`,
        `${b.afiliado.nombres} ${b.afiliado.apellidos}`,
      ),
    );
  }, [grupos]);

  useEffect(() => {
    setLiderSeleccionadoId(null);
  }, [categoria, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage, categoria]);

  const effectiveItemsPerPage =
    itemsPerPage === "all" ? miembrosTodos.length : itemsPerPage;
  const totalPages = Math.max(
    1,
    Math.ceil(miembrosTodos.length / (effectiveItemsPerPage || 1)),
  );
  const startIndex =
    itemsPerPage === "all" ? 0 : (currentPage - 1) * effectiveItemsPerPage;
  const miembrosPagina =
    itemsPerPage === "all"
      ? miembrosTodos
      : miembrosTodos.slice(startIndex, startIndex + effectiveItemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const grupoActivo = useMemo(
    () =>
      gruposDeCategoria.find((g) => g.lider.id === liderSeleccionadoId) || null,
    [gruposDeCategoria, liderSeleccionadoId],
  );

  const categoriaCfg =
    CATEGORIAS.find((c) => c.tipo === categoria) || CATEGORIAS[0];

  const exportarEdad = async (
    tipo: "excel" | "pdf",
    grupo: GrupoEdad | "lugar",
  ) => {
    if (exportandoEdad) return;
    setExportandoEdad(tipo);
    try {
      if (grupo === "lugar") {
        if (tipo === "excel") await descargarExcelLugares(afiliados);
        else await descargarPdfLugares(afiliados);
      } else if (tipo === "excel") await descargarExcelEdades(afiliados, grupo);
      else await descargarPdfEdades(afiliados, grupo);
      toast.success(tipo === "excel" ? "Excel descargado" : "PDF descargado");
    } catch (err) {
      console.error(err);
      toast.error(
        tipo === "excel"
          ? "No se pudo generar el Excel"
          : "No se pudo generar el PDF",
      );
    } finally {
      setExportandoEdad(null);
    }
  };

  const theadClass = `${tema.theadBg} ${tema.theadText} border-b border-black/5 dark:border-white/10`;

  const toolbarAcciones = (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
      <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:min-w-0 sm:flex-1 sm:flex-wrap sm:items-center">
        {CATEGORIAS.map((cat) => {
          const Icon = cat.icon;
          const activo = categoria === cat.tipo;
          const total = conteosCategoria[cat.tipo];
          return (
            <button
              key={cat.tipo}
              type="button"
              onClick={() => {
                setCategoria(cat.tipo);
                setLiderSeleccionadoId(null);
              }}
              className={`inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors duration-300 sm:w-auto sm:gap-2 sm:px-3 sm:text-sm ${
                activo ? cat.active : cat.idle
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>{cat.titulo}</span>
              <span className="font-bold">{total}</span>
            </button>
          );
        })}
      </div>

      <div className="relative w-full sm:ml-auto sm:w-auto sm:shrink-0">
        <p className="mb-1 text-center text-xs font-semibold leading-tight text-sky-700 dark:text-sky-300 sm:absolute sm:bottom-full sm:left-0 sm:right-0 sm:mb-1 sm:whitespace-nowrap">
          Descargar reportes
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1.5">
        {(
          [
            {
              id: "excel" as const,
              label: "Excel",
              idle: Download,
              hover: Sheet,
              className:
                "border-green-600 bg-green-100 text-green-800 hover:bg-green-200 dark:border-green-500 dark:bg-green-950/50 dark:text-green-300 dark:hover:bg-green-950/70",
            },
            {
              id: "pdf" as const,
              label: "PDF",
              idle: FileText,
              hover: FileDown,
              className:
                "border-red-500 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60",
            },
          ] as const
        ).map((boton) => (
          <DropdownMenu key={boton.id}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={exportandoEdad !== null}
                className={`inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors disabled:opacity-60 sm:w-auto sm:px-3 sm:text-sm ${boton.className}`}
              >
                <HoverMorphIcon idle={boton.idle} hover={boton.hover} size={16} />
                {exportandoEdad === boton.id ? "…" : boton.label}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={esTelefono ? "bottom" : "left"}
              align={
                esTelefono && boton.id === "pdf" ? "end" : "start"
              }
              sideOffset={6}
              collisionPadding={12}
              className={`z-[80] border-gray-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900 ${
                esTelefono
                  ? "w-[var(--radix-dropdown-menu-trigger-width)] min-w-0"
                  : "w-52 min-w-52"
              }`}
            >
              <DropdownMenuLabel className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Por edad
              </DropdownMenuLabel>
              {(
                [
                  { id: "todos" as GrupoEdad, nombre: "Todos", rango: "18+" },
                  ...GRUPOS_EDAD.map((g) => ({
                    id: g.id as GrupoEdad,
                    nombre: g.corto,
                    rango: g.id === "mayores" ? "65+" : `${g.min}-${g.max}`,
                  })),
                ]
              ).map((opcion) => (
                <DropdownMenuItem
                  key={opcion.id}
                  onSelect={() => exportarEdad(boton.id, opcion.id)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 whitespace-nowrap px-2.5 py-2 text-xs font-semibold text-gray-900 focus:bg-sky-50 dark:text-white dark:focus:bg-sky-950/40"
                >
                  <span>{opcion.nombre}</span>
                  <span className="shrink-0 font-bold text-sky-600 dark:text-sky-400">
                    ({opcion.rango})
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="my-1 bg-gray-200 dark:bg-neutral-700" />
              <DropdownMenuItem
                onSelect={() => exportarEdad(boton.id, "lugar")}
                className="cursor-pointer whitespace-nowrap px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider text-sky-600 focus:bg-sky-50 dark:text-sky-400 dark:focus:bg-sky-950/40"
              >
                Por lugar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ))}
        </div>
      </div>
    </div>
  );

  if (isLoading) return <AfiliadosSkeleton />;

  if (grupos.every((g) => g.afiliados.length === 0) && afiliados.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 mt-8 border dark:border-neutral-700 rounded-lg p-4">
        No se encontraron miembros.
      </div>
    );
  }

  return (
    <PanelListaPestana
      tema={tema}
      placeholder={placeholder}
      value={searchTerm}
      onChange={onSearchChange}
      acciones={toolbarAcciones}
      contenidoSinPadding
      footer={
        categoria === "todos" && miembrosTodos.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm font-semibold tabular-nums text-gray-800 dark:text-gray-200">
              Pág. {Math.min(currentPage, totalPages)}/{totalPages}
            </span>
            <div className="flex items-center gap-1">
              <BtnPaginaMorph
                direction="prev"
                disabled={currentPage <= 1 || itemsPerPage === "all"}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:bg-neutral-900 ${tema.pagination} ${tema.btnHover}`}
              />
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const val = e.target.value;
                  setItemsPerPage(
                    val === "all" ? "all" : (parseInt(val, 10) as 15 | 30 | 45),
                  );
                }}
                className="h-8 cursor-pointer rounded-lg border border-gray-200 bg-white px-2 text-sm font-semibold text-gray-700 outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-300"
                aria-label="Cantidad por página"
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={45}>45</option>
                <option value="all">Todos</option>
              </select>
              <BtnPaginaMorph
                direction="next"
                disabled={currentPage >= totalPages || itemsPerPage === "all"}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white disabled:cursor-not-allowed disabled:opacity-30 dark:border-neutral-700 dark:bg-neutral-900 ${tema.pagination} ${tema.btnHover}`}
              />
            </div>
          </div>
        ) : null
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {categoria === "todos" ? (
          <motion.div
            key="lista-todos"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-x-auto"
          >
            {miembrosTodos.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                No hay miembros{searchTerm ? " para esta búsqueda" : ""}.
              </div>
            ) : (
              <table className="min-w-full bg-white text-xs dark:bg-neutral-900">
                <thead className={theadClass}>
                  <tr>
                    <th
                      className={columnaNoFijaEncabezado(
                        tema.theadBg,
                        "px-4 py-2.5 text-left font-bold uppercase",
                      )}
                    >
                      No.
                    </th>
                    <th className="px-4 py-2.5 text-left font-bold uppercase">
                      Nombre
                    </th>
                    <th className="px-4 py-2.5 text-left font-bold uppercase">
                      DPI
                    </th>
                    <th className="px-4 py-2.5 text-left font-bold uppercase">
                      Teléfono
                    </th>
                    <th className="px-4 py-2.5 text-left font-bold uppercase">
                      Edad
                    </th>
                    <th className="px-4 py-2.5 text-left font-bold uppercase">
                      Ubicación
                    </th>
                    <th className="px-4 py-2.5 text-left font-bold uppercase">
                      Líder
                    </th>
                    <th className="px-4 py-2.5 text-left font-bold uppercase">
                      Grupo
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                  {miembrosPagina.map((row, index) => (
                    <tr
                      key={row.afiliado.id}
                      className={`group ${tema.filaHover} uppercase`}
                    >
                      <td
                        className={columnaNoFijaCelda(
                          tema.filaHoverSticky,
                          "px-4 py-2 whitespace-nowrap text-gray-500 dark:text-gray-400",
                        )}
                      >
                        {startIndex + index + 1}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap font-bold text-gray-900 dark:text-gray-100">
                        {row.afiliado.nombres} {row.afiliado.apellidos}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap font-mono">
                        {row.afiliado.dpi
                          ? formatearDpi(row.afiliado.dpi)
                          : "—"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap font-mono normal-case">
                        <TelefonoInline
                          telefono={row.afiliado.telefono || ""}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap font-bold">
                        {calcularEdadLabel(row.afiliado.nacimiento)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {row.afiliado.lugar_nombre || "—"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap font-semibold text-sky-700 dark:text-sky-400">
                        {row.liderNombre}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {row.grupo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        ) : gruposDeCategoria.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="rounded-xl border border-dashed border-gray-200 dark:border-neutral-700 px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            No hay {categoriaCfg.titulo.toLowerCase()}
            {searchTerm ? " para esta búsqueda" : ""}.
          </motion.div>
        ) : !grupoActivo ? (
          <motion.div
            key={`lista-${categoria}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-x-auto"
          >
            <table className="min-w-full bg-white text-sm dark:bg-neutral-900">
              <thead className={theadClass}>
                <tr>
                  <th
                    className={columnaNoFijaEncabezado(
                      tema.theadBg,
                      "px-4 py-2.5 text-left text-xs font-bold uppercase",
                    )}
                  >
                    No.
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase">
                    Nombre
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-bold uppercase">
                    Miembros
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                {gruposDeCategoria.map(({ lider, afiliados: list }, index) => (
                  <tr
                    key={lider.id}
                    onClick={() => setLiderSeleccionadoId(lider.id)}
                    className={`group cursor-pointer transition-colors ${tema.filaHover}`}
                  >
                    <td
                      className={columnaNoFijaCelda(
                        tema.filaHoverSticky,
                        "px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400",
                      )}
                    >
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900 dark:text-gray-100 uppercase">
                      {lider.nombres} {lider.apellidos}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-black text-gray-800 dark:text-gray-200">
                      {list.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        ) : (
          <motion.div
            key={`celula-${grupoActivo.lider.id}`}
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.99 }}
            transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-0"
          >
            <div className="px-3 pt-2">
              <button
                type="button"
                onClick={() => setLiderSeleccionadoId(null)}
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline dark:text-blue-400"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a {categoriaCfg.titulo}
              </button>
            </div>

            <div className="overflow-x-auto">
              <div
                className={`flex items-center justify-between gap-3 border-b px-4 py-3 dark:border-neutral-800 ${categoriaCfg.rowActive}`}
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Célula de
                  </p>
                  <h3 className="text-sm md:text-base font-black uppercase truncate text-gray-900 dark:text-gray-100">
                    {grupoActivo.lider.nombres} {grupoActivo.lider.apellidos}
                  </h3>
                </div>
                <span className="shrink-0 text-sm font-black text-gray-800 dark:text-gray-200">
                  {grupoActivo.afiliados.length} miembro
                  {grupoActivo.afiliados.length === 1 ? "" : "s"}
                </span>
              </div>

              {grupoActivo.afiliados.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  Este líder aún no tiene miembros
                  {searchTerm ? " que coincidan con la búsqueda" : ""}.
                </div>
              ) : (
                <table className="min-w-full bg-white text-xs dark:bg-neutral-900">
                  <thead className={theadClass}>
                    <tr>
                      <th
                        className={columnaNoFijaEncabezado(
                          tema.theadBg,
                          "px-4 py-2.5 text-left font-bold uppercase",
                        )}
                      >
                        No.
                      </th>
                      <th className="px-4 py-2.5 text-left font-bold uppercase">
                        Nombre
                      </th>
                      <th className="px-4 py-2.5 text-left font-bold uppercase">
                        DPI
                      </th>
                      <th className="px-4 py-2.5 text-left font-bold uppercase">
                        Teléfono
                      </th>
                      <th className="px-4 py-2.5 text-left font-bold uppercase">
                        Edad
                      </th>
                      <th className="px-4 py-2.5 text-left font-bold uppercase">
                        Ubicación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                    {[...grupoActivo.afiliados]
                      .sort((a, b) =>
                        compararNombres(
                          `${a.nombres} ${a.apellidos}`,
                          `${b.nombres} ${b.apellidos}`,
                        ),
                      )
                      .map((afiliado, index) => (
                        <motion.tr
                          key={afiliado.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.22,
                            delay: Math.min(index * 0.02, 0.24),
                            ease: [0.25, 0.46, 0.45, 0.94],
                          }}
                          className={`group ${tema.filaHover} uppercase`}
                        >
                          <td
                            className={columnaNoFijaCelda(
                              tema.filaHoverSticky,
                              "px-4 py-2 whitespace-nowrap text-gray-500 dark:text-gray-400",
                            )}
                          >
                            {index + 1}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap font-bold text-gray-900 dark:text-gray-100">
                            {afiliado.nombres} {afiliado.apellidos}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap font-mono">
                            {afiliado.dpi ? formatearDpi(afiliado.dpi) : "—"}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap font-mono normal-case">
                            <TelefonoInline
                              telefono={afiliado.telefono || ""}
                            />
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap font-bold">
                            {calcularEdadLabel(afiliado.nacimiento)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            {afiliado.lugar_nombre || "—"}
                          </td>
                        </motion.tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PanelListaPestana>
  );
}
