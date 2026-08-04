"use client";

import { useState, useEffect, useMemo } from "react";
import Swal from "@/lib/swal";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Building2,
  MoreVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { obtenerConfiguracionAction } from "@/components/dashboard/actions/configuracion";
import { eliminar } from "./acciones";
import { esUsuarioSede } from "./esquemas";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Lider {
  id: string;
  email: string;
  nombres: string;
  apellidos: string;
  rol: string;
  rol_id?: number;
  conteoAfiliados?: number;
  simulado?: boolean;
}

interface Props {
  lideres: Lider[];
  onVerCelula: (lider: Lider) => void;
  onEditar: (lider: Lider) => void;
  rolUsuarioSesion: string;
  onDataChange: () => void;
  searchTerm: string;
  idUsuarioSesion: string;
  isLoading?: boolean;
}

function LideresSkeleton({ esAdminOSuper }: { esAdminOSuper: boolean }) {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-20 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4 flex items-center gap-4"
        >
          <div className="h-10 w-10 bg-gray-100 dark:bg-neutral-800 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-gray-100 dark:bg-neutral-800 rounded"></div>
            <div className="h-3 w-1/4 bg-gray-50 dark:bg-neutral-800 rounded"></div>
          </div>
          <div className="h-10 w-24 bg-gray-100 dark:bg-neutral-800 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
}

export default function Lideres({
  lideres,
  onVerCelula,
  onEditar,
  rolUsuarioSesion,
  onDataChange,
  searchTerm,
  idUsuarioSesion,
  isLoading = false,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(15);

  const rolUpper = (rolUsuarioSesion || "").toUpperCase();
  const isLider = rolUpper === "LIDER";
  const esAdminOSuper =
    rolUpper === "ADMINISTRADOR" ||
    rolUpper === "ADMIN" ||
    rolUpper === "SUPER";
  const puedeGestionarUsuarios =
    esAdminOSuper || rolUpper === "DOCUMENTADOR";

  const { data: config } = useQuery({
    queryKey: ["config_sistema"],
    queryFn: () => obtenerConfiguracionAction(),
  });

  const META_CELULA = config?.meta_celula ?? 15;
  const META_MINIMA = config?.meta_celula_minima ?? 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const sede = useMemo(
    () => lideres.find((l) => esUsuarioSede(l)) || null,
    [lideres],
  );

  const sortedLideres = useMemo(
    () =>
      [...lideres].sort((a, b) => {
        const aSede = esUsuarioSede(a);
        const bSede = esUsuarioSede(b);
        if (aSede !== bSede) return aSede ? -1 : 1;
        if (a.simulado) return -1;
        if (b.simulado) return 1;
        if (a.id === idUsuarioSesion) return -1;
        if (b.id === idUsuarioSesion) return 1;
        return (b.conteoAfiliados || 0) - (a.conteoAfiliados || 0);
      }),
    [lideres, idUsuarioSesion],
  );

  const filteredLideres = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return sortedLideres.filter((lider) => {
      const fullName = `${lider.nombres} ${lider.apellidos}`.toLowerCase();
      const email = lider.email.toLowerCase();
      return fullName.includes(term) || email.includes(term);
    });
  }, [sortedLideres, searchTerm]);

  const effectiveItemsPerPage = useMemo(() =>
    itemsPerPage === "all" ? filteredLideres.length : itemsPerPage
  , [itemsPerPage, filteredLideres.length]);

  const totalPages = useMemo(() =>
    Math.ceil(filteredLideres.length / (effectiveItemsPerPage || 1))
  , [filteredLideres.length, effectiveItemsPerPage]);

  const startIndex = (currentPage - 1) * (effectiveItemsPerPage as number);

  const lideresPaginados = useMemo(() =>
    itemsPerPage === "all"
      ? filteredLideres
      : filteredLideres.slice(
          startIndex,
          startIndex + (effectiveItemsPerPage as number),
        )
  , [filteredLideres, startIndex, effectiveItemsPerPage, itemsPerPage]);

  if (isLoading) return <LideresSkeleton esAdminOSuper={esAdminOSuper} />;

  const getRowClass = (lider: Lider) => {
    if (esUsuarioSede(lider)) {
      return "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-1 ring-blue-200 dark:ring-blue-700/60";
    }
    if (lider.id === idUsuarioSesion) {
      return "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 ring-1 ring-blue-300 dark:ring-blue-700 shadow-blue-50 dark:shadow-none";
    }
    return "bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 hover:border-blue-400 hover:shadow-lg dark:hover:shadow-none";
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
        {lideresPaginados.map((lider, index) => {
          const esSede = esUsuarioSede(lider);
          const totalEnGrupo = lider.conteoAfiliados || 0;
          const progreso = Math.min((totalEnGrupo / META_CELULA) * 100, 100);
          const tieneAfiliados = totalEnGrupo > 0;

          let nivelCompromiso = "";
          let colorBarra = "";
          let textoColor = "";

          if (totalEnGrupo > META_CELULA) {
            nivelCompromiso = "Alto";
            colorBarra = "bg-green-500";
            textoColor = "text-green-600 dark:text-green-400";
          } else if (totalEnGrupo === META_CELULA) {
            nivelCompromiso = "Cumple";
            colorBarra = "bg-blue-600";
            textoColor = "text-blue-600 dark:text-blue-400";
          } else if (totalEnGrupo >= META_MINIMA && totalEnGrupo < META_CELULA) {
            nivelCompromiso = "Medio";
            colorBarra = "bg-yellow-500";
            textoColor = "text-yellow-600 dark:text-yellow-400";
          } else {
            nivelCompromiso = "Bajo";
            colorBarra = "bg-red-500";
            textoColor = "text-red-600 dark:text-red-400";
          }

          return (
            <motion.div
              key={lider.id}
              layout
              initial={
                lider.simulado
                  ? { opacity: 0, y: -24, scale: 0.97 }
                  : false
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={
                lider.simulado
                  ? { opacity: 0, y: -16, scale: 0.98 }
                  : undefined
              }
              transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`flex flex-col border rounded-xl overflow-hidden shadow-sm ${getRowClass(lider)}`}
            >
              <div
                className={`p-4 pb-2 flex flex-col gap-3 ${isLider && lider.id !== idUsuarioSesion ? "" : "cursor-pointer"}`}
                onClick={() => {
                  if (isLider && lider.id !== idUsuarioSesion) return;
                  onVerCelula(lider);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black shrink-0 ${
                        esSede
                          ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400"
                          : "bg-blue-50 dark:bg-neutral-800 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {esSede ? (
                        <Building2 className="h-4 w-4" />
                      ) : (
                        startIndex + index + 1
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3
                          className={`font-black text-sm md:text-base leading-tight truncate ${
                            esSede
                              ? "text-blue-900 dark:text-blue-300"
                              : lider.id === idUsuarioSesion
                                ? "text-blue-900 dark:text-blue-400"
                                : "text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {lider.nombres} {lider.apellidos}
                        </h3>
                        {esSede && (
                          <span className="text-[8px] bg-blue-200 dark:bg-blue-900/60 text-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded-full font-black uppercase shrink-0">
                            Sede
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm md:text-base font-black tabular-nums">
                      <span
                        className={
                          esSede
                            ? "text-blue-600 dark:text-blue-400"
                            : textoColor
                        }
                      >
                        {totalEnGrupo.toLocaleString()}
                      </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        /
                        {esSede
                          ? totalEnGrupo.toLocaleString()
                          : META_CELULA}
                      </span>
                    </span>
                    {puedeGestionarUsuarios && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800"
                              aria-label="Acciones"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              className="cursor-pointer gap-2"
                              onClick={() => onEditar(lider)}
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            {esAdminOSuper && !esSede && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
                                  onClick={() => {
                                    if (tieneAfiliados) {
                                      Swal.fire({
                                        icon: "error",
                                        title: "Acción no permitida",
                                        text: "Sólo se puede eliminar un líder sin integrantes",
                                        confirmButtonColor: "#3b82f6",
                                      });
                                    } else {
                                      eliminar(lider, onDataChange);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full bg-gray-100 dark:bg-neutral-800 rounded-full h-2 border dark:border-neutral-700 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: esSede ? "100%" : `${progreso}%`,
                    }}
                    className={`${esSede ? "bg-blue-500" : colorBarra} h-full rounded-full shadow-sm`}
                  />
                </div>

                {!esSede && (
                  <div className="flex justify-end">
                    <span className="text-sm md:text-base tracking-wide text-right text-gray-500 dark:text-gray-400 font-bold normal-case">
                      Nivel de compromiso:{" "}
                      <span className={`font-black ${textoColor}`}>
                        {nivelCompromiso}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-center gap-4 mt-8 mb-12">
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            aria-label="Página anterior"
            className="p-1 rounded text-blue-600 dark:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || itemsPerPage === "all"}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-semibold text-gray-800 dark:text-gray-200 tabular-nums min-w-[2.5rem] text-center">
            {currentPage}/{totalPages || 1}
          </span>
          <button
            type="button"
            aria-label="Página siguiente"
            className="p-1 rounded text-blue-600 dark:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || itemsPerPage === "all"}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <select
          value={itemsPerPage}
          onChange={(e) => {
            const val = e.target.value;
            setItemsPerPage(val === "all" ? "all" : parseInt(val, 10));
          }}
          className="text-sm border border-gray-200 dark:border-neutral-700 rounded-md px-2 py-1 bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
          aria-label="Cantidad por página"
        >
          <option value={15}>15</option>
          <option value={30}>30</option>
          <option value={45}>45</option>
          <option value="all">Todos</option>
        </select>
      </div>
    </>
  );
}
