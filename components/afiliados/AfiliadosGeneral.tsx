"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Download,
  Medal,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import * as XLSX from "xlsx";
import type { Afiliado, Lider } from "./esquemas";
import { esRolEmpleado, esRolLider, esUsuarioSede } from "./esquemas";
import { formatearDpi, TelefonoInline } from "./contacto";
import { calcularEdadLabel } from "@/utils/formatoFechaGT";
import { TEMA_MIEMBROS, type TemaLista } from "./temaPestana";
import PanelListaPestana from "./PanelListaPestana";
import {
  columnaNoFijaCelda,
  columnaNoFijaEncabezado,
  FONDO_CELDA_TABLA,
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

type GrupoTipo = "todos" | "sede" | "lider" | "trabajador";

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
];

function tipoDeLider(lider: Lider): Exclude<GrupoTipo, "todos"> | null {
  if (esUsuarioSede(lider)) return "sede";
  if (esRolEmpleado(lider.rol)) return "trabajador";
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

function filaExcel(
  afiliado: Afiliado,
  liderNombre: string,
  grupo: string,
) {
  return {
    Nombre: `${afiliado.nombres} ${afiliado.apellidos}`.trim(),
    DPI: afiliado.dpi || "",
    Teléfono: afiliado.telefono || "",
    Edad: calcularEdadLabel(afiliado.nacimiento),
    Sexo: afiliado.sexo || "",
    Ubicación: afiliado.lugar_nombre || "",
    Empadronado: afiliado.empadronado ? "Sí" : "No",
    "No. Padrón": afiliado.no_padron || "",
    Líder: liderNombre,
    Grupo: grupo,
  };
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

  const grupoActivo = useMemo(
    () =>
      gruposDeCategoria.find((g) => g.lider.id === liderSeleccionadoId) || null,
    [gruposDeCategoria, liderSeleccionadoId],
  );

  const categoriaCfg =
    CATEGORIAS.find((c) => c.tipo === categoria) || CATEGORIAS[0];

  const descargarExcel = () => {
    const porTipo = {
      sede: [] as ReturnType<typeof filaExcel>[],
      lider: [] as ReturnType<typeof filaExcel>[],
      trabajador: [] as ReturnType<typeof filaExcel>[],
    };

    grupos.forEach((g) => {
      const liderNombre = `${g.lider.nombres} ${g.lider.apellidos}`.trim();
      const grupo = etiquetaGrupo(g.tipo);
      const ordenados = [...g.afiliados].sort((a, b) =>
        compararNombres(
          `${a.nombres} ${a.apellidos}`,
          `${b.nombres} ${b.apellidos}`,
        ),
      );
      ordenados.forEach((a) => {
        porTipo[g.tipo].push(filaExcel(a, liderNombre, grupo));
      });
    });

    const todos = [...porTipo.sede, ...porTipo.lider, ...porTipo.trabajador].sort(
      (a, b) => compararNombres(a.Nombre, b.Nombre),
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(todos),
      "Todos",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(porTipo.sede),
      "Sede",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(porTipo.lider),
      "Lideres",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(porTipo.trabajador),
      "Empleados",
    );

    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `miembros_${fecha}.xlsx`);
  };

  const theadClass = `${tema.theadBg} ${tema.theadText} border-b border-black/5 dark:border-white/10`;

  const toolbarAcciones = (
    <div className="flex w-full items-center gap-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
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
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors duration-300 sm:gap-2 sm:px-3 sm:text-sm ${
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

      <button
        type="button"
        onClick={descargarExcel}
        className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-green-600 bg-green-100 px-2.5 py-2 text-xs font-semibold text-green-800 transition-colors hover:bg-green-200 dark:border-green-500 dark:bg-green-950/50 dark:text-green-300 dark:hover:bg-green-950/70 sm:gap-2 sm:px-3 sm:text-sm [&_svg]:text-green-700 dark:[&_svg]:text-green-400"
      >
        <Download className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
        Excel
      </button>
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
                  {miembrosTodos.map((row, index) => (
                    <tr
                      key={row.afiliado.id}
                      className="group hover:bg-gray-50 dark:hover:bg-neutral-800/50 uppercase"
                    >
                      <td
                        className={columnaNoFijaCelda(
                          FONDO_CELDA_TABLA,
                          "px-4 py-2 whitespace-nowrap text-gray-500 dark:text-gray-400",
                        )}
                      >
                        {index + 1}
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
                    className="group cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/60 transition-colors"
                  >
                    <td
                      className={columnaNoFijaCelda(
                        FONDO_CELDA_TABLA,
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
                          className="group hover:bg-gray-50 dark:hover:bg-neutral-800/50 uppercase"
                        >
                          <td
                            className={columnaNoFijaCelda(
                              FONDO_CELDA_TABLA,
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
