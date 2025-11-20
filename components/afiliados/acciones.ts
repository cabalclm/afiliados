import Swal from 'sweetalert2';
import { createClient } from '@/utils/supabase/client';
import type { Afiliado, Lider } from './esquemas';
import { toast } from 'react-toastify';
import { deleteUserAccountAction } from '@/app/actions/usuarios';
import { deleteAfiliadoAction } from '@/app/actions/afiliados';

const COLOR_CANCELAR = '#DC3545';

export const eliminar = async (registro: Afiliado | Lider, onEliminado: () => void) => {
    
    const nombreCompleto = `${registro.nombres} ${registro.apellidos}`;
    const esLider = 'email' in registro;
    const tabla = esLider ? ' (LÍDER DE CÉLULA)' : '';

    const confirmacion = await Swal.fire({
        title: '¿Está seguro?',
        text: `Se eliminará permanentemente a "${nombreCompleto}"${tabla}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: COLOR_CANCELAR,
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, ¡eliminar!',
        cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
        let error: { message: string } | null = null;
        let result: { error: { message: string } | null };

        if (esLider) {
            result = await deleteUserAccountAction(registro.id);
            if (result.error) {
              error = result.error;
            }
        } else {
            result = await deleteAfiliadoAction(registro.id);
            if (result.error) {
              error = result.error;
            }
        }

        if (error && error.message) {
            toast.error('No se pudo eliminar el registro.');
            console.error('Error de eliminación:', error.message);
        } else {
            toast.error(`"${nombreCompleto}" ha sido eliminado.`);
            onEliminado();
        }
    }
};