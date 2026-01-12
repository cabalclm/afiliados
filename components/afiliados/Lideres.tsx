'use client';

import { useState, Fragment, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Pencil, 
  Trash2, 
  Eye, 
  ChevronDown, 
  MoreVertical 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { eliminar } from './acciones';
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
  telefono: string;
  dpi: string;
  nacimiento: string;
  sexo: string;
  rol: string;
  rol_id?: number;
  lugar_id: number;
  lugar_nombre: string;
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

export default function Lideres({ lideres, onVerCelula, onEditar, rolUsuarioSesion, onDataChange, searchTerm, idUsuarioSesion }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [liderAbiertoId, setLiderAbiertoId] = useState<string | null>(null);
  
  const isLider = rolUsuarioSesion === 'LIDER';

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredLideres = lideres.filter(lider => {
    const term = searchTerm.toLowerCase();
    const fullName = `${lider.nombres} ${lider.apellidos}`.toLowerCase();
    const dpi = lider.dpi || '';
    return fullName.includes(term) || dpi.includes(term);
  });

  if (lideres.length === 0) {
    return <div className="text-center text-gray-500 mt-8 border rounded-lg p-4">No hay líderes registrados.</div>;
  }

  if (filteredLideres.length === 0 && searchTerm) {
     return <div className="text-center text-gray-500 mt-8 border rounded-lg p-4">No se encontraron líderes con esa búsqueda.</div>;
  }

  const totalPages = Math.ceil(filteredLideres.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const lideresPaginados = filteredLideres.slice(startIndex, endIndex);

  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const calcularEdad = (fechaNacimiento: string | Date) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  };

  const handleRowClick = (lider: Lider) => {
      if (!isLider || lider.id === idUsuarioSesion) {
          onVerCelula(lider);
      }
  };

  const getRowClass = (lider: Lider) => {
    let baseClass = lider.id === idUsuarioSesion ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200';
    if (!isLider || lider.id === idUsuarioSesion) baseClass += ' cursor-pointer hover:bg-gray-100';
    else baseClass += ' cursor-default opacity-70';
    return baseClass;
  };

  return (
    <>
      <div className="md:hidden space-y-2">
        {lideresPaginados.map((lider, index) => {
          const totalEnGrupo = (lider.conteoAfiliados || 0) + 1;
          const objetivo = 15;
          const progreso = Math.min((totalEnGrupo / objetivo) * 100, 100);
          
          let colorBarra = 'bg-blue-600';
          if (totalEnGrupo <= 5) colorBarra = 'bg-blue-300';
          else if (totalEnGrupo <= 10) colorBarra = 'bg-yellow-600';
          else if (totalEnGrupo < 15) colorBarra = 'bg-purple-600';
          else if (totalEnGrupo === 15) colorBarra = 'bg-green-500';
          else colorBarra = 'bg-red-600';

          return (
            <Fragment key={lider.id}>
              <div
                className={`border rounded-lg p-3 text-xs shadow-sm ${getRowClass(lider)}`}
                onClick={() => setLiderAbiertoId(liderAbiertoId === lider.id ? null : lider.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`font-bold ${lider.id === idUsuarioSesion ? 'text-indigo-800' : 'text-gray-800'}`}>
                    {startIndex + index + 1}. {lider.nombres} {lider.apellidos}
                  </span>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${liderAbiertoId === lider.id ? 'rotate-180' : ''}`} />
                </div>
                <div className="mb-2"><span className="font-semibold text-gray-500">DPI: </span><span>{lider.dpi || '—'}</span></div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold mb-1">{totalEnGrupo} / {objetivo}</span>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className={`${colorBarra} h-2.5 rounded-full`} style={{ width: `${progreso}%` }}></div>
                  </div>
                </div>
              </div>
              <AnimatePresence>
                {liderAbiertoId === lider.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white rounded-b-lg border-x border-b border-gray-200 -mt-2 overflow-hidden flex"
                  >
                    <Button 
                      variant="ghost" 
                      className="flex-1 justify-center text-gray-700 rounded-none p-3 hover:text-black"
                      onClick={(e) => { e.stopPropagation(); handleRowClick(lider); }}
                      disabled={isLider && lider.id !== idUsuarioSesion}
                    >
                      <Eye className="h-4 w-4 mr-2" /> Célula
                    </Button>
                    {rolUsuarioSesion !== 'LIDER' && (
                      <Button 
                          variant="ghost" 
                          className="flex-1 justify-center text-blue-600 hover:text-blue-700 rounded-none p-3 border-l"
                          onClick={(e) => { e.stopPropagation(); onEditar(lider); }}
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

      <div className="hidden md:block border border-gray-300 rounded-lg overflow-visible">
          <table className="min-w-full bg-white text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">No.</th>
                <th className="px-3 py-2 text-left font-medium">Nombre</th>
                <th className="px-3 py-2 text-left font-medium">Teléfono</th>
                <th className="px-3 py-2 text-left font-medium">DPI</th>
                <th className="px-3 py-2 text-left font-medium">Edad</th>
                <th className="px-3 py-2 text-left font-medium">Ubicación</th>
                <th className="px-3 py-2 text-center font-medium min-w-[120px]">Progreso</th>
                {rolUsuarioSesion !== 'LIDER' && <th className="px-3 py-2 text-center font-medium">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lideresPaginados.map((lider, index) => {
                const totalEnGrupo = (lider.conteoAfiliados || 0) + 1;
                const objetivo = 15;
                const progreso = Math.min((totalEnGrupo / objetivo) * 100, 100);
                const tieneAfiliados = totalEnGrupo > 1;

                let colorBarra = 'bg-blue-600';
                if (totalEnGrupo <= 5) colorBarra = 'bg-blue-300';
                else if (totalEnGrupo <= 10) colorBarra = 'bg-yellow-600';
                else if (totalEnGrupo < 15) colorBarra = 'bg-purple-600';
                else if (totalEnGrupo === 15) colorBarra = 'bg-green-500';
                else colorBarra = 'bg-red-600';

                return (
                  <tr key={lider.id} className={getRowClass(lider)} onClick={() => handleRowClick(lider)}>
                    <td className="px-3 py-2 font-medium">{startIndex + index + 1}</td>
                    <td className="px-3 py-2 font-medium">{lider.nombres} {lider.apellidos}</td>
                    <td className="px-3 py-2">{lider.telefono}</td>
                    <td className="px-3 py-2">{lider.dpi}</td>
                    <td className="px-3 py-2">{lider.nacimiento ? `${calcularEdad(lider.nacimiento)} años` : '—'}</td>
                    <td className="px-3 py-2">{lider.lugar_nombre || '—'}</td>
                    <td className="px-3 py-2">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold mb-1">{totalEnGrupo} / {objetivo}</span>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className={`${colorBarra} h-2 rounded-full`} style={{ width: `${progreso}%` }}></div>
                          </div>
                        </div>
                    </td>
                    {rolUsuarioSesion !== 'LIDER' && (
                        <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 overflow-visible">
                                    <DropdownMenuItem onClick={() => onEditar(lider)} className="cursor-pointer text-blue-600">
                                        <Pencil className="h-4 w-4 mr-2" /> Editar
                                    </DropdownMenuItem>
                                    
                                    <div className="group relative">
                                        <DropdownMenuItem 
                                            disabled={tieneAfiliados}
                                            onClick={() => !tieneAfiliados && eliminar(lider, onDataChange)}
                                            className={`cursor-pointer ${tieneAfiliados ? 'text-gray-400 opacity-50' : 'text-red-600'}`}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                                        </DropdownMenuItem>
                                        
                                        {tieneAfiliados && (
                                            <div className="absolute right-full top-0 mr-2 hidden group-hover:block z-50 w-max">
                                                <div className="bg-gray-800 text-white text-[10px] py-1 px-2 rounded shadow-lg">
                                                    No se puede eliminar un líder con afiliados, primero reasigne o elimine sus afiliados.
                                                </div>
                                                <div className="absolute top-2 -right-1 w-2 h-2 bg-gray-800 rotate-45"></div>
                                            </div>
                                        )}
                                    </div>
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
        <div className="flex items-center justify-end gap-4 mt-4">
          <span className="text-sm text-gray-600">Página {currentPage} de {totalPages}</span>
          <Button size="sm" variant="outline" onClick={goToPreviousPage} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={goToNextPage} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </>
  );
}