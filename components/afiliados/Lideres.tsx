"use client";

import { useState, Fragment, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Eye,
  ChevronDown,
  MoreVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { eliminar } from "./acciones";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
    <div className="animate-pulse space-y-6">
      <div className="flex flex-col items-center justify-center py-4">
        <span className="text-xs font-black text-blue-600 animate-bounce uppercase tracking-widest">
          Cargando datos...
        </span>
      </div>

      {esAdminOSuper && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-32 bg-gray-300 rounded"></div>
            <div className="h-3 w-16 bg-gray-300 rounded"></div>
          </div>
          <div className="h-6 w-full bg-gray-200 rounded-full border border-gray-100"></div>
        </div>
      )}

      <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="bg-gray-100 h-10 border-b border-gray-200"></div>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-12 border-b border-gray-100 bg-white flex items-center px-4 gap-4"
          >
            <div className="h-4 w-8 bg-gray-200 rounded"></div>
            <div className="h-4 flex-1 bg-gray-100 rounded"></div>
            <div className="h-4 w-24 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>

      <div className="md:hidden space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-white border border-gray-200 rounded-lg p-4 space-y-3"
          >
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
            <div className="h-2 w-full bg-gray-100 rounded-full"></div>
          </div>
        ))}
      </div>
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
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(10);
  const [liderAbiertoId, setLiderAbiertoId] = useState<string | null>(null);

  const isLider = rolUsuarioSesion === "LIDER";
  const esAdminOSuper =
    rolUsuarioSesion === "ADMINISTRADOR" || rolUsuarioSesion === "SUPER";
  const OBJETIVO_GENERAL = 2250;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  if (isLoading) return <LideresSkeleton esAdminOSuper={esAdminOSuper} />;

  if (lideres.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-8 border rounded-lg p-4 font-bold uppercase">
        No hay líderes registrados.
      </div>
    );
  }

  const totalAfiliadosGeneral = lideres.reduce(
    (acc, curr) => acc + (curr.conteoAfiliados || 0),
    0,
  );

  const progresoGeneral = Math.min(
    (totalAfiliadosGeneral / OBJETIVO_GENERAL) * 100,
    100,
  );

  const sortedLideres = [...lideres].sort((a, b) => {
    if (a.id === idUsuarioSesion) return -1;
    if (b.id === idUsuarioSesion) return 1;
    return (b.conteoAfiliados || 0) - (a.conteoAfiliados || 0);
  });
  const filteredLideres = sortedLideres.filter((lider) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${lider.nombres} ${lider.apellidos}`.toLowerCase();
    const email = lider.email.toLowerCase();
    return fullName.includes(term) || email.includes(term);
  });

  const effectiveItemsPerPage =
    itemsPerPage === "all" ? filteredLideres.length : itemsPerPage;
  const totalPages = Math.ceil(
    filteredLideres.length / (effectiveItemsPerPage || 1),
  );
  const startIndex = (currentPage - 1) * (effectiveItemsPerPage || 0);
  const lideresPaginados =
    itemsPerPage === "all"
      ? filteredLideres
      : filteredLideres.slice(
          startIndex,
          startIndex + (effectiveItemsPerPage as number),
        );

  const handleRowClick = (lider: Lider) => {
    if (!isLider || lider.id === idUsuarioSesion) onVerCelula(lider);
  };

  const getRowClass = (lider: Lider) => {
    if (lider.id === idUsuarioSesion) {
      return "bg-blue-100 border-blue-200 cursor-pointer hover:bg-blue-100";
    }

    let baseClass = "bg-white border-gray-200";

    if (!isLider) {
      baseClass += " cursor-pointer hover:bg-gray-100";
    } else {
      baseClass += " cursor-default";
    }

    return baseClass;
  };

  return (
    <>
      {esAdminOSuper && (
        <div className="mb-6 w-full">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold uppercase text-gray-600 font-sans">
              Meta General de Afiliación
            </span>
            <span className="text-sm font-black text-blue-700">
              {totalAfiliadosGeneral.toLocaleString()} /{" "}
              {OBJETIVO_GENERAL.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6 border-2 border-white shadow-inner overflow-hidden flex items-center relative font-sans">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progresoGeneral}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-blue-600 h-full shadow-[inset_0px_0px_10px_rgba(0,0,0,0.2)]"
            />
          </div>
        </div>
      )}

      <div className="md:hidden space-y-2">
        {lideresPaginados.map((lider, index) => {
          const totalEnGrupo = lider.conteoAfiliados || 0;
          const progreso = Math.min((totalEnGrupo / 15) * 100, 100);

          return (
            <Fragment key={lider.id}>
              <div
                className={`border rounded-lg p-3 text-xs shadow-sm ${getRowClass(lider)}`}
                onClick={() =>
                  setLiderAbiertoId(
                    liderAbiertoId === lider.id ? null : lider.id,
                  )
                }
              >
                <div className="flex justify-between items-center mb-2">
                  <span
                    className={`font-bold flex items-center flex-wrap gap-2 ${lider.id === idUsuarioSesion ? "text-indigo-800" : "text-gray-800"}`}
                  >
                    <span>
                      {startIndex + index + 1}. {lider.nombres}{" "}
                      {lider.apellidos}
                    </span>
                    {lider.id === idUsuarioSesion && (
                      <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Mi Célula
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${liderAbiertoId === lider.id ? "rotate-180" : ""}`}
                  />
                </div>
                <div className="mb-2 text-gray-500">{lider.email}</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${progreso}%` }}
                  ></div>
                </div>
              </div>
              <AnimatePresence>
                {liderAbiertoId === lider.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white rounded-b-lg border-x border-b border-gray-200 -mt-2 overflow-hidden flex"
                  >
                    <Button
                      variant="ghost"
                      className="flex-1 text-gray-700 p-3 hover:text-black font-bold uppercase"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(lider);
                      }}
                      disabled={isLider && lider.id !== idUsuarioSesion}
                    >
                      <Eye className="h-4 w-4 mr-2" /> Célula
                    </Button>
                    {rolUsuarioSesion !== "LIDER" && (
                      <Button
                        variant="ghost"
                        className="flex-1 text-blue-600 p-3 border-l font-bold uppercase"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditar(lider);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" /> Editar
                      </Button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Fragment>
          );
        })}
      </div>

      <div className="hidden md:block border border-gray-300 rounded-lg overflow-hidden font-sans">
        <table className="min-w-full bg-white text-xs">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">
                No.
              </th>
              <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">
                Nombre del Líder
              </th>
              <th className="px-4 py-3 text-left font-bold uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">
                Integrantes
              </th>
              <th className="px-4 py-3 text-center font-bold uppercase tracking-wider min-w-[150px]">
                Meta (15)
              </th>
              {rolUsuarioSesion !== "LIDER" && (
                <th className="px-4 py-3 text-center font-bold uppercase tracking-wider">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 uppercase font-bold">
            {lideresPaginados.map((lider, index) => {
              const totalEnGrupo = lider.conteoAfiliados || 0;
              const progreso = Math.min((totalEnGrupo / 15) * 100, 100);
              const tieneAfiliados = totalEnGrupo > 0;

              return (
                <tr
                  key={lider.id}
                  className={getRowClass(lider)}
                  onClick={() => handleRowClick(lider)}
                >
                  <td className="px-4 py-3 font-medium text-gray-500">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>
                        {lider.nombres} {lider.apellidos}
                      </span>
                      {lider.id === idUsuarioSesion && (
                        <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 ml-2 rounded-full font-bold uppercase tracking-wider shadow-sm">
                          Mi Célula
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 lowercase font-normal italic">
                    {lider.email}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-lg text-blue-800">
                    {totalEnGrupo}
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-full bg-gray-100 rounded-full h-3 border shadow-sm">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progreso}%` }}
                      ></div>
                    </div>
                  </td>
                  {rolUsuarioSesion !== "LIDER" && (
                    <td
                      className="px-4 py-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => onEditar(lider)}
                            className="cursor-pointer text-blue-600 font-bold uppercase"
                          >
                            <Pencil className="h-4 w-4 mr-2" /> Editar Acceso
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={tieneAfiliados}
                            onClick={() =>
                              !tieneAfiliados && eliminar(lider, onDataChange)
                            }
                            className={`cursor-pointer font-bold uppercase ${tieneAfiliados ? "text-gray-300" : "text-red-600"}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Eliminar Cuenta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-end gap-4 mt-4 font-sans">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1 || itemsPerPage === "all"}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-bold px-2 uppercase">
            Página {currentPage} de {totalPages || 1}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || itemsPerPage === "all"}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 border rounded-md px-2 py-1 bg-white">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              const val = e.target.value;
              setItemsPerPage(val === "all" ? "all" : parseInt(val));
            }}
            className="text-xs font-bold outline-none bg-transparent cursor-pointer uppercase"
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value="all">Todos</option>
          </select>
        </div>
      </div>
    </>
  );
}
