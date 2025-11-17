'use client';

import { createPortal } from 'react-dom';
import { useState, useRef, useEffect } from 'react';
import { Pencil, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Afiliado, Lider } from './esquemas';
import { eliminar } from './acciones';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  lider: Lider;
  afiliados: Afiliado[];
  onEditar: (afiliado: Afiliado) => void;
  onDataChange: () => void;
  liderPuedeSerEliminado?: boolean;
}

export default function Tabla({ lider, afiliados, onEditar, onDataChange, liderPuedeSerEliminado = true }: Props) {
  const [menuAbierto, setMenuAbierto] = useState<Afiliado | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  const handleMenuOpen = (afiliado: Afiliado, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const menuWidth = 192; 
    const menuHeight = 80; 

    const { clientX, clientY } = event;
    const { innerWidth, innerHeight } = window;

    let top = clientY;
    let left = clientX;

    if (clientY + menuHeight > innerHeight) {
      top = clientY - menuHeight;
    }

    if (clientX + menuWidth > innerWidth) {
      left = clientX - menuWidth;
    }

    setMenuPosition({ top, left });
    setMenuAbierto(afiliado);
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

  useEffect(() => {
    setPortalNode(document.body);

    const handleClose = () => setMenuAbierto(null);
    
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true); 
    
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, []);

  const liderAny = lider as any;

  return (
    <>
      <div className="overflow-x-auto overflow-y-auto border border-gray-300 rounded-lg max-h-[60vh]">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-center text-xs font-medium uppercase w-[5%]">No.</th>
              <th className="px-3 py-2 text-center text-xs font-medium uppercase">Nombres</th>
              <th className="px-3 py-2 text-center text-xs font-medium uppercase">Apellidos</th>
              <th className="px-3 py-2 text-center text-xs font-medium uppercase">DPI</th>
              <th className="px-3 py-2 text-center text-xs font-medium uppercase">Teléfono</th>
              <th className="px-3 py-2 text-center text-xs font-medium uppercase">Sexo</th>
              <th className="px-3 py-2 text-center text-xs font-medium uppercase">Edad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            
            <tr key={lider.id} className="bg-blue-50 hover:bg-blue-100 font-medium">
              <td className="px-3 py-2 text-xs whitespace-nowrap text-blue-800">★ 1 (Líder)</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap">{lider.nombres}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap">{lider.apellidos}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap">{liderAny.dpi || '—'}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap">{liderAny.telefono || '—'}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap">{liderAny.sexo || '—'}</td>
              <td className="px-3 py-2 text-xs whitespace-nowrap">
                  {(liderAny.nacimiento) ? `${calcularEdad(liderAny.nacimiento)} años` : '—'}
              </td>
            </tr>

            {afiliados.map((afiliado, index) => {
              return (
                <tr 
                  key={afiliado.id} 
                  className={'hover:bg-gray-50 cursor-pointer'}
                  onClick={(e) => handleMenuOpen(afiliado, e)}
                >
                  <td className="px-3 py-2 text-xs font-medium whitespace-nowrap">{index + 2}</td>
                  <td className="px-3 py-2 text-xs font-medium whitespace-nowrap">{afiliado.nombres}</td>
                  <td className="px-3 py-2 text-xs font-medium whitespace-nowrap">{afiliado.apellidos}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{afiliado.dpi || '—'}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{afiliado.telefono || '—'}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{afiliado.sexo || '—'}</td>
                   <td className="px-3 py-2 text-xs whitespace-nowrap">
                       {(afiliado.nacimiento) ? `${calcularEdad(afiliado.nacimiento)} años` : '—'}
                    </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {portalNode && createPortal(
        <AnimatePresence>
          {menuAbierto && (
            <motion.div
              className="fixed w-48 rounded-md bg-white shadow-lg p-1 z-[100]" 
              style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Button variant="ghost" className="w-full justify-start" onClick={() => { onEditar(menuAbierto); setMenuAbierto(null); }}>
                <Pencil className="h-4 w-4 mr-2" /> Editar
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 disabled:opacity-50 disabled:text-gray-400"
                onClick={() => { eliminar(menuAbierto, onDataChange); setMenuAbierto(null); }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Eliminar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>,
        portalNode
      )}
    </>
  );
}