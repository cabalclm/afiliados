'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import BotonVolver from '@/components/ui/botones/BotonVolver';
import BotonEditar from '@/components/ui/botones/BotonEditar';
import useUserData from '@/hooks/sesion/useUserData'; 

const fetchUsuario = async (id: string) => {
  const res = await fetch('/api/users/ver', {
    method: 'POST',
    body: JSON.stringify({ id }),
    headers: { 'Content-Type': 'application/json' },
  });

  const json = await res.json();
  if (!res.ok || !json?.usuario) {
    console.error('Respuesta del backend:', json);
    throw new Error(json.error || 'Error al obtener usuario');
  }

  return json.usuario;
};

export function UsuarioPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const { rol } = useUserData();

  const { data: usuario, error, isLoading } = useSWR(
    id ? ['usuario', id] : null,
    () => fetchUsuario(id!)
  );

  if (!id) return <p>No se proporcionó un ID.</p>;
  if (isLoading) return <p>Cargando usuario...</p>;
  if (error) {
    console.error(error);
    router.push('/protected/admin/users');
    return null;
  }
  if (!usuario) return null;


  return (
    <div className="max-w-4xl mx-auto p-6 border rounded shadow bg-background text-foreground text-sm">
      <div className="flex justify-between items-center mb-4">
        <BotonVolver ruta="/protected/admin/users" />

        {(rol === 'SUPER' || rol === 'ADMIN') && (
          <BotonEditar ruta={`/protected/admin/users/editar?id=${usuario.id}`} />
        )}
      </div>

      <h1 className="text-2xl font-bold mb-4">Informe de Datos de Empleado Municipal</h1>

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
              <td className="p-2 border-[1.5px] border-gray-300">{usuario.email}</td>
            </tr>
            <tr className="bg-white hover:bg-green-50">
              <td className="p-2 border-[1.5px] border-gray-300 font-semibold">Nombre</td>
              <td className="p-2 border-[1.5px] border-gray-300">{usuario.nombre || 'Sin nombre registrado'}</td>
            </tr>
            <tr className="bg-white hover:bg-green-50">
              <td className="p-2 border-[1.5px] border-gray-300 font-semibold">Rol</td>
              <td className="p-2 border-[1.5px] border-gray-300">
                
     
                {usuario.rol || 'Sin rol'}

              </td>
            </tr>
            <tr className="bg-white hover:bg-green-50">
              <td className="p-2 border-[1.5px] border-gray-300 font-semibold">Estado</td>
              <td className="p-2 border-[1.5px] border-gray-300">
                {usuario.activo === true ? '🟢 Activo' : '🔴 Inactivo'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>


    </div>
  );
}