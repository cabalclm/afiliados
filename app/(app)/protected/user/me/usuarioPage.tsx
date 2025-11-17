'use client';

import { useState, useEffect, Fragment } from 'react';
import { Transition, TransitionChild } from '@headlessui/react';
import BotonVolver from '@/components/ui/botones/BotonVolver';
import useUserData from '@/hooks/sesion/useUserData';

export function UsuarioPageContent() {
  const { email, nombres, apellidos, rol, cargando } = useUserData();
  const [mostrarContenido, setMostrarContenido] = useState(false);

  useEffect(() => {
    if (!cargando) {
      setTimeout(() => setMostrarContenido(true), 50);
    }
  }, [cargando]);

  if (cargando) return <p className="text-center mt-10">Cargando usuario...</p>;
  if (!email) return <p className="text-center mt-10 text-red-500">No se pudo cargar el usuario actual.</p>;

  return (
    <Transition show={mostrarContenido} as={Fragment}>
      <TransitionChild
        enter="transition ease-out duration-500"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-300"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div className=" mx-auto p-6 border rounded shadow bg-background text-foreground text-sm">
          <div className="flex justify-between items-center mb-6">
            <BotonVolver ruta="/protected" />
            <h1 className="text-2xl font-bold">Mi Perfil</h1>
          </div>

          <div className="mt-4 border-[2.5px] border-gray-400 overflow-x-auto text-xl">
            <table className="w-full border-collapse border-[2.5px] border-gray-300">
              <thead className="bg-gray-200">
                <tr className="text-left text-2xl font-semibold">
                  <th className="p-2 border-[1.5px] border-gray-300">Campo</th>
                  <th className="p-2 border-[1.5px] border-gray-300">Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white hover:bg-green-50">
                  <td className="p-2 border-[1.5px] border-gray-300 font-semibold min-w-[140px]">Usuario</td>
                  <td className="p-2 border-[1.5px] border-gray-300">{email}</td>
                </tr>
                <tr className="bg-white hover:bg-green-50">
                  <td className="p-2 border-[1.5px] border-gray-300 font-semibold">Nombres</td>
                  <td className="p-2 border-[1.5px] border-gray-300">{nombres || '—'}</td>
                </tr>
                <tr className="bg-white hover:bg-green-50">
                  <td className="p-2 border-[1.5px] border-gray-300 font-semibold">Apellidos</td>
                  <td className="p-2 border-[1.5px] border-gray-300">{apellidos || '—'}</td>
                </tr>
                <tr className="bg-white hover:bg-green-50">
                  <td className="p-2 border-[1.5px] border-gray-300 font-semibold">Rol</td>
                  <td className="p-2 border-[1.5px] border-gray-300">
                    {rol || 'Sin rol'}
                  </td>
                </tr>
                <tr className="bg-white hover:bg-green-50">
                  <td className="p-2 border-[1.5px] border-gray-300 font-semibold">Estado</td>
                  <td className="p-2 border-[1.5px] border-gray-300">🟢 Activo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </TransitionChild>
    </Transition>
  );
}