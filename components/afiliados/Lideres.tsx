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
}

export default function Lideres({
  lideres,
  onVerCelula,
  onEditar,
  rolUsuarioSesion,
  onDataChange,
  searchTerm,
  idUsuarioSesion,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [liderAbiertoId, setLiderAbiertoId] = useState<string | null>(null);

  const isLider = rolUsuarioSesion === "LIDER";

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredLideres = lideres.filter((lider) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${lider.nombres} ${lider.apellidos}`.toLowerCase();
    const email = lider.email.toLowerCase();
    return fullName.includes(term) || email.includes(term);
  });

  if (lideres.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-8 border rounded-lg p-4">
        No hay líderes registrados.
      </div>
    );
  }

  if (filteredLideres.length === 0 && searchTerm) {
    return (
      <div className="text-center text-gray-500 mt-8 border rounded-lg p-4">
        No se encontraron resultados.
      </div>
    );
  }

  const totalPages = Math.ceil(filteredLideres.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const lideresPaginados = filteredLideres.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleRowClick = (lider: Lider) => {
    if (!isLider || lider.id === idUsuarioSesion) onVerCelula(lider);
  };

  const getRowClass = (lider: Lider) => {
    let baseClass =
      lider.id === idUsuarioSesion
        ? "bg-indigo-50 border-indigo-200"
        : "bg-white border-gray-200";
    if (!isLider || lider.id === idUsuarioSesion)
      baseClass += " cursor-pointer hover:bg-gray-100";
    else baseClass += " cursor-default opacity-70";
    return baseClass;
  };

  return (
    <>
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
                    className={`font-bold ${lider.id === idUsuarioSesion ? "text-indigo-800" : "text-gray-800"}`}
                  >
                    {startIndex + index + 1}. {lider.nombres} {lider.apellidos}
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
                      className="flex-1 text-gray-700 p-3 hover:text-black"
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
                        className="flex-1 text-blue-600 p-3 border-l"
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

      <div className="hidden md:block border border-gray-300 rounded-lg overflow-hidden">
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
                Correo
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
          <tbody className="divide-y divide-gray-200">
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
                  <td className="px-4 py-3 font-bold text-gray-900 uppercase">
                    {lider.nombres} {lider.apellidos}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{lider.email}</td>
                  <td className="px-4 py-3 text-center font-bold text-lg">
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
                            className="cursor-pointer text-blue-600 font-bold"
                          >
                            <Pencil className="h-4 w-4 mr-2" /> Editar Acceso
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={tieneAfiliados}
                            onClick={() =>
                              !tieneAfiliados && eliminar(lider, onDataChange)
                            }
                            className={`cursor-pointer font-bold ${tieneAfiliados ? "text-gray-300" : "text-red-600"}`}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft />
          </Button>
          <span className="text-sm font-bold px-4">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight />
          </Button>
        </div>
      )}
    </>
  );
}
