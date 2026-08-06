'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Usuario } from '@/components/admin/users/types';
import {
  columnaNoFijaCelda,
  columnaNoFijaEncabezado,
  FONDO_CELDA_TABLA,
} from '@/lib/tablaSticky';

type Props = {
  usuarios: Usuario[];
};

export default function UsersTable({ usuarios }: Props) {
  const router = useRouter();
  const [paginaActual, setPaginaActual] = useState(1);
  const [usuariosPorPagina, setUsuariosPorPagina] = useState(10);

  const totalPaginas = Math.ceil(usuarios.length / usuariosPorPagina);
  const inicio = (paginaActual - 1) * usuariosPorPagina;
  const usuariosPaginados = usuarios.slice(inicio, inicio + usuariosPorPagina);

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto border-[2.5px] border-gray-400 dark:border-neutral-600">
        <table className="w-full border-collapse border-[2.5px] border-gray-300 dark:border-neutral-700 text-lg">
          <thead>
            <tr className="text-left text-[15px] font-semibold bg-gray-200 dark:bg-neutral-800 border-b-[2.5px] border-gray-400 dark:border-neutral-600 text-gray-900 dark:text-gray-100">
              <th
                className={columnaNoFijaEncabezado(
                  "bg-gray-200 dark:bg-neutral-800",
                  "p-2 border-[1.5px] border-gray-300 dark:border-neutral-700 text-center",
                )}
              >
                No.
              </th>
              <th className="p-2 border-[1.5px] border-gray-300 dark:border-neutral-700">Usuario</th>
              <th className="p-2 border-[1.5px] border-gray-300 dark:border-neutral-700">Nombres</th>
              <th className="p-2 border-[1.5px] border-gray-300 dark:border-neutral-700">Apellidos</th>
              <th className="p-2 border-[1.5px] border-gray-300 dark:border-neutral-700">Rol</th>
              <th className="p-2 border-[1.5px] border-gray-300 dark:border-neutral-700 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosPaginados.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-3 text-center text-muted-foreground border-[1.5px] border-gray-300 dark:border-neutral-700">
                  No hay resultados
                </td>
              </tr>
            ) : (
              usuariosPaginados.map((usuario, index) => (
                <tr
                  key={usuario.id}
                  className="group hover:bg-gray-50 dark:hover:bg-neutral-800/50 border-[1.5px] border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-gray-100"
                >
                  <td
                    className={columnaNoFijaCelda(
                      FONDO_CELDA_TABLA,
                      "p-2 border-[1.5px] border-gray-300 dark:border-neutral-700 text-center",
                    )}
                  >
                    {inicio + index + 1}
                  </td>
                  <td className="p-2 border-[1.5px] border-gray-300 dark:border-neutral-700">{usuario.email}</td>
                  <td className="p-2 border-[1.5px] border-gray-300 dark:border-neutral-700">{usuario.nombres || '—'}</td>
                  <td className="p-2 border-[1.5px] border-gray-300 dark:border-neutral-700">{usuario.apellidos || '—'}</td>
                  <td className="p-2 border-[1.5px] border-gray-300 dark:border-neutral-700">{usuario.rol || '—'}</td>
                  <td className="p-2 text-center border-[1.5px] border-gray-300 dark:border-neutral-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/protected/admin/users/ver?id=${usuario.id}`)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs"
                    >
                      Ver Usuario
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-6 mb-4 gap-2 flex-wrap items-center text-sm">
        <span className="font-medium">Ver por:</span>
        <select
          value={usuariosPorPagina}
          onChange={(e) => {
            setUsuariosPorPagina(parseInt(e.target.value));
            setPaginaActual(1); 
          }}
          className="border border-gray-300 dark:border-neutral-700 rounded px-2 py-1 bg-white dark:bg-neutral-900"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      <div className="flex justify-center mt-2 mb-6 gap-2 flex-wrap">
        <button
          onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
          disabled={paginaActual === 1}
          className={`px-3 py-2 rounded border dark:border-neutral-700 ${
            paginaActual === 1 ? 'bg-gray-200 dark:bg-neutral-800 text-gray-500 dark:text-gray-400' : 'bg-white dark:bg-neutral-900 hover:bg-blue-50 dark:hover:bg-neutral-800'
          }`}
        >
          ←
        </button>

        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setPaginaActual(n)}
            className={`px-4 py-2 rounded border dark:border-neutral-700 font-medium ${
              paginaActual === n ? 'bg-blue-600 dark:bg-blue-700 text-white' : 'bg-white dark:bg-neutral-900 hover:bg-blue-50 dark:hover:bg-neutral-800'
            }`}
          >
            {n}
          </button>
        ))}

        <button
          onClick={() => setPaginaActual((prev) => Math.min(prev + 1, totalPaginas))}
          disabled={paginaActual === totalPaginas}
          className={`px-3 py-2 rounded border dark:border-neutral-700 ${
            paginaActual === totalPaginas ? 'bg-gray-200 dark:bg-neutral-800 text-gray-500 dark:text-gray-400' : 'bg-white dark:bg-neutral-900 hover:bg-blue-50 dark:hover:bg-neutral-800'
          }`}
        >
          →
        </button>
      </div>
    </div>
  );
}