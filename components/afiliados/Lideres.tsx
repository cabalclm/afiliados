'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
}

export default function Lideres({ lideres, onVerCelula, rolUsuarioSesion }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const isAdminOrSuper = rolUsuarioSesion === 'ADMINISTRADOR' || rolUsuarioSesion === 'SUPER';

  if (lideres.length === 0) {
    return <div className="text-center text-gray-500 mt-8 p-4 border rounded-lg">No hay líderes registrados.</div>;
  }

  const totalPages = Math.ceil(lideres.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const lideresPaginados = lideres.slice(startIndex, endIndex);

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

  return (
    <>
      <div className="border border-gray-300 rounded-lg overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50"><tr>
                    <th className="px-3 py-2 text-left text-xs font-medium w-[5%]">No.</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Nombre Completo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Correo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Teléfono</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">DPI</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Nacimiento</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Sexo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Ubicación</th>
                    {isAdminOrSuper && (
                        <th className="px-3 py-2 text-left text-xs font-medium">Rol</th>
                    )}
                    <th className="px-3 py-2 text-center text-xs font-medium">Afiliados</th>
                  </tr></thead>
                <tbody className="divide-y divide-gray-200">
                  {lideresPaginados.map((lider, index) => {
                    const isSuper = lider.rol === 'SUPER';
                    return (
                      <tr 
                          key={lider.id} 
                          className={`cursor-pointer ${isSuper ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-gray-100'}`}
                          onClick={() => onVerCelula(lider)}
                      >
                        <td className="px-3 py-2 text-xs font-medium whitespace-nowrap">{startIndex + index + 1}</td>
                        <td className="px-3 py-2 text-xs font-medium whitespace-nowrap">{lider.nombres} {lider.apellidos}</td>
                        <td className="px-3 py-2 text-xs whitespace-nowrap">{lider.email}</td>
                        <td className="px-3 py-2 text-xs whitespace-nowrap">{lider.telefono}</td>
                        <td className="px-3 py-2 text-xs whitespace-nowrap">{lider.dpi}</td>
                        <td className="px-3 py-2 text-xs whitespace-nowrap">{formatFecha(lider.nacimiento)}</td>
                        <td className="px-3 py-2 text-xs whitespace-nowrap">{lider.sexo}</td>
                        <td className="px-3 py-2 text-xs whitespace-nowrap">{lider.lugar_nombre || '—'}</td>
                        {isAdminOrSuper && (
                            <td className="px-3 py-2 text-xs whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isSuper ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-200 text-gray-800'}`}>
                                    {lider.rol}
                                </span>
                            </td>
                        )}
                        <td className="px-3 py-2 text-center text-xs">
                          {lider.conteoAfiliados !== undefined ? lider.conteoAfiliados : 'N/A'}
                        </td>
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