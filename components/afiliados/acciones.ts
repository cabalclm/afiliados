import Swal from 'sweetalert2';
import { createClient } from '@/utils/supabase/client';
import type { Afiliado, Lider } from './esquemas';
import { toast } from 'react-toastify';

const COLOR_CANCELAR = '#DC3545';

export const eliminar = async (afiliado: Afiliado | Lider, onEliminado: () => void) => {
    
    const nombreCompleto = `${afiliado.nombres} ${afiliado.apellidos}`;
    const esLider = 'email' in afiliado;
    
    const confirmacion = await Swal.fire({
        title: '¿Está seguro?',
        text: `Se eliminará permanentemente a "${nombreCompleto}"${esLider ? ' (LÍDER DE CÉLULA). Esto requiere permisos especiales.' : '.'}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: COLOR_CANCELAR,
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, ¡eliminar!',
        cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
        const supabase = createClient();
        let error;

        if (esLider) {
            const { error: authError } = await supabase.rpc('delete_user_by_id', { user_id_input: afiliado.id });
            error = authError;
        } else {
            const result = await supabase.from('afiliados').delete().eq('id', afiliado.id);
            error = result.error;
        }

        if (error) {
            toast.error('No se pudo eliminar el registro.');
            console.error('Error de eliminación:', error);
        } else {
            toast.error(`"${nombreCompleto}" ha sido eliminado.`);
            onEliminado();
        }
    }
};