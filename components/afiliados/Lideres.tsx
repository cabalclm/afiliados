'use client';

import { useState, Fragment, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Pencil, Trash2, Eye, ChevronDown, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { eliminar } from './acciones';

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
  lugar_id: number;
  lugar_nombre: string;
  conteoAfiliados?: number;
}

interface Props {
  lideres: Lider[]; 
  onVerCelula: (lider: Lider) => void;
  rolUsuarioSesion: string;
  onDataChange: () => void;
  searchTerm: string;
  idUsuarioSesion: string;
}

export default function Lideres({ lideres, onVerCelula, rolUsuarioSesion, onDataChange, searchTerm, idUsuarioSesion }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();
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
  
  const isAdminOrSuper = rolUsuarioSesion === 'ADMINISTRADOR' || rolUsuarioSesion === 'SUPER';

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

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return '—';
    const date = new Date(fecha);
    date.setUTCHours(12); 
    return date.toLocaleDateString('es-GT', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const calcularEdad = (fechaNacimiento: string | Date) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const handleRowClick = (lider: Lider) => {
      if (!isLider || lider.id === idUsuarioSesion) {
          onVerCelula(lider);
      }
  };

  const getRowClass = (lider: Lider) => {
    let baseClass = lider.id === idUsuarioSesion ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200';
    if (!isLider || lider.id === idUsuarioSesion) {
        baseClass += ' cursor-pointer hover:bg-gray-100';
    } else {
        baseClass += ' cursor-default opacity-70';
    }
    return baseClass;
  };


  return (
    <>
      {/* VISTA MÓVIL */}
      <div className="md:hidden space-y-2">
        {lideresPaginados.map((lider, index) => {
          const isSuper = lider.rol === 'SUPER';
          const totalEnGrupo = (lider.conteoAfiliados || 0) + 1;
          const objetivo = 15;
          const progreso = totalEnGrupo > 0 ? Math.min((totalEnGrupo / objetivo) * 100, 100) : 0;
          
          let colorBarra = 'bg-blue-600';
          if (totalEnGrupo === 1) colorBarra = 'bg-blue-300';
          else if (totalEnGrupo <= 5) colorBarra = 'bg-blue-300';
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
                
                <div className="mb-2">
                  <span className="font-semibold text-gray-500">DPI: </span>
                  <span>{lider.dpi || '—'}</span>
                </div>
                
                <div className="flex justify-between items-center text-gray-600 mb-2">
                  <div>
                    <span className="font-semibold">Tel: </span>
                    <span>{lider.telefono || '—'}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Sexo: </span>
                    <span>{lider.sexo || '—'}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Edad: </span>
                    <span>{lider.nacimiento ? `${calcularEdad(lider.nacimiento)} años` : '—'}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold mb-1">{totalEnGrupo} / {objetivo}</span>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`${colorBarra} h-2.5 rounded-full transition-all duration-300`} 
                      style={{ width: `${progreso}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {liderAbiertoId === lider.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="bg-white rounded-b-lg border-x border-b border-gray-200 -mt-2 overflow-hidden"
                  >
                    <div className="flex">
                       {/* Restringe el botón de ver célula al propio líder */}
                      <Button 
                        variant="ghost" 
                        className={`flex-1 w-1/2 justify-center text-gray-700 rounded-none rounded-bl-lg p-3 ${isLider && lider.id !== idUsuarioSesion ? 'opacity-50 cursor-not-allowed' : 'hover:text-black'}`}
                        onClick={(e) => { e.stopPropagation(); handleRowClick(lider); }}
                        disabled={isLider && lider.id !== idUsuarioSesion}
                      >
                        <Eye className="h-4 w-4 mr-2" /> Ver Célula
                      </Button>
                      
                      {/* Oculta el botón Editar para el rol LIDER */}
                      {(rolUsuarioSesion !== 'LIDER') && (
                        <Button 
                            variant="ghost" 
                            className="flex-1 w-1/2 justify-center text-blue-600 hover:text-blue-700 rounded-none rounded-br-lg p-3 border-l"
                            onClick={(e) => { e.stopPropagation(); router.push(`/protected/admin/sign-up?id=${lider.id}`); }}
                        >
                            <Pencil className="h-4 w-4 mr-2" /> Editar
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Fragment>
          );
        })}
      </div>

      {/* VISTA ESCRITORIO */}
      <div className="hidden md:block border border-gray-300 rounded-lg overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium w-[5%]">No.</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Nombre Completo</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Correo</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Teléfono</th>
                <th className="px-3 py-2 text-left text-xs font-medium">DPI</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Nacimiento</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Edad</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Sexo</th>
                <th className="px-3 py-2 text-left text-xs font-medium">Ubicación</th>
                <th className="px-3 py-2 text-center text-xs font-medium min-w-[120px]">Afiliados</th>
                
                {/* Oculta la columna Acciones para el rol LIDER */}
                {rolUsuarioSesion !== 'LIDER' && (
                  <th className="px-3 py-2 text-center text-xs font-medium">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lideresPaginados.map((lider, index) => {
                const isSuper = lider.rol === 'SUPER';

                const totalEnGrupo = (lider.conteoAfiliados || 0) + 1;
                const objetivo = 15;
                const progreso = totalEnGrupo > 0 ? Math.min((totalEnGrupo / objetivo) * 100, 100) : 0;
                const puedeEliminar = totalEnGrupo === 1;

                let colorBarra = 'bg-blue-600';
                if (totalEnGrupo === 1) colorBarra = 'bg-blue-300';
                else if (totalEnGrupo <= 5) colorBarra = 'bg-blue-300';
                else if (totalEnGrupo <= 10) colorBarra = 'bg-yellow-600';
                else if (totalEnGrupo < 15) colorBarra = 'bg-purple-600';
                else if (totalEnGrupo === 15) colorBarra = 'bg-green-500';
                else colorBarra = 'bg-red-600';

                return (
                  <tr 
                      key={lider.id} 
                      className={`${getRowClass(lider)} ${lider.id === idUsuarioSesion ? 'font-bold' : ''}`}
                      onClick={() => handleRowClick(lider)}
                  >
                    <td className="px-3 py-2 text-xs font-medium whitespace-nowrap">{startIndex + index + 1}</td>
                    <td className="px-3 py-2 text-xs font-medium whitespace-nowrap">{lider.nombres} {lider.apellidos}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{lider.email}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{lider.telefono}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{lider.dpi}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{formatFecha(lider.nacimiento)}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">
                      {lider.nacimiento ? `${calcularEdad(lider.nacimiento)} años` : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{lider.sexo}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">{lider.lugar_nombre || '—'}</td>
  
                    <td className="px-3 py-2 text-xs whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-semibold mb-1">{totalEnGrupo} / {objetivo}</span>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`${colorBarra} h-2.5 rounded-full transition-all duration-300`} 
                              style={{ width: `${progreso}%` }}
                            ></div>
                          </div>
                        </div>
                    </td>

                    {/* Contenido de Acciones solo para Administradores/Super */}
                    {rolUsuarioSesion !== 'LIDER' && (
                        <td className="px-3 py-2 text-xs whitespace-nowrap text-center">
                            {puedeEliminar ? (
                                <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-600 hover:text-red-700 z-10 relative"
                                onClick={(e) => { e.stopPropagation(); eliminar(lider, onDataChange); }}
                                >
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            ) : (
                                <div className="group relative flex justify-center items-center">
                                <Info className="h-4 w-4 text-gray-400 cursor-default" />
                                <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 w-max scale-0 rounded bg-gray-800 p-2 text-xs text-white transition-all group-hover:scale-100 z-20">
                                    No se puede eliminar un líder con afiliados
                                </span>
                                </div>
                            )}
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
          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </>
  );
}