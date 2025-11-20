'use client';

import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { eliminar } from './acciones'; 
import type { Afiliado, Lider } from './esquemas';

interface Props {
    lider: Lider;
    afiliados: Afiliado[];
    onEditar: (afiliado: Afiliado) => void;
    onDataChange: () => void;
    liderPuedeSerEliminado: boolean;
    rolUsuarioSesion: string;
}

export default function Tabla({ lider, afiliados, onEditar, onDataChange, rolUsuarioSesion }: Props) {

    const puedeVerAcciones = rolUsuarioSesion === 'ADMINISTRADOR' || rolUsuarioSesion === 'SUPER';

    if (afiliados.length === 0) {
        return <div className="text-center py-4 text-gray-500">No hay afiliados en esta célula aún.</div>;
    }

    const formatFecha = (fecha: string) => {
        if (!fecha) return '—';
        const date = new Date(fecha);
        date.setUTCHours(12);
        return date.toLocaleDateString('es-GT', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    const calcularEdad = (fechaNacimiento: string) => {
        if (!fechaNacimiento) return '—';
        const hoy = new Date();
        const nacimiento = new Date(fechaNacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        return `${edad} años`;
    };

    return (
        <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Completo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DPI</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edad</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sexo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                        {puedeVerAcciones && (
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {afiliados.map((afiliado, index) => (
                        <tr key={afiliado.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-900">{index + 1}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 font-medium">
                                {afiliado.nombres} {afiliado.apellidos}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">{afiliado.telefono || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{afiliado.dpi || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{calcularEdad(afiliado.nacimiento)}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">{afiliado.sexo || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                                {afiliado.lugar_nombre || lider.lugar_nombre || '—'}
                            </td>
                            {puedeVerAcciones && (
                                <td className="px-4 py-2 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-blue-600 hover:text-blue-700"
                                            onClick={() => onEditar(afiliado)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-600 hover:text-red-700"
                                            onClick={() => eliminar(afiliado, onDataChange)}                                    >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}