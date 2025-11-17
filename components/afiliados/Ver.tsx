'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'react-toastify';
import Estadisticas from './Estadisticas';
import Lideres from './Lideres';
import Form from './Form';
import Celula from './Celula';
import type { Afiliado, Lider } from './esquemas';
import { createClient } from '@/utils/supabase/client';
import useUserData from '@/hooks/sesion/useUserData';

type Lugar = { id: number; nombre: string; };

export default function Ver() {
    const { rol, cargando: cargandoRol } = useUserData();
    const router = useRouter();

    const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
    const [lideres, setLideres] = useState<Lider[]>([]);
    const [lugares, setLugares] = useState<Lugar[]>([]);
    const [loading, setLoading] = useState(true);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isCelulaOpen, setIsCelulaOpen] = useState(false);

    const [afiliadoParaEditar, setAfiliadoParaEditar] = useState<Afiliado | null>(null);
    const [liderParaCelula, setLiderParaCelula] = useState<Lider | null>(null);
    const [liderParaNuevoAfiliado, setLiderParaNuevoAfiliado] = useState<string | null>(null);

    const [isEstadisticasOpen, setIsEstadisticasOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const supabase = createClient();
        
        try {
            const { data: lideresResult, error: lideresError } = await supabase
                .rpc('listar_usuarios', { rol_filtro: 'LIDER' }) 
                .single();
            
            const { data: afiliadosResult, error: afiliadosError } = await supabase
                .rpc('obtener_afiliados')
                .single();
            
            const { data: lugaresResult, error: lugaresError } = await supabase
                .rpc('obtener_lugares')
                .single();

            if (lideresError || afiliadosError || lugaresError) {
                console.error('Error al cargar líderes:', lideresError?.message);
                console.error('Error al cargar afiliados:', afiliadosError?.message);
                console.error('Error al cargar lugares:', lugaresError?.message);
                toast.error('Error al cargar los datos.');
            } else {
                setLideres((lideresResult || []) as Lider[]);
                setAfiliados((afiliadosResult || []) as Afiliado[]);
                setLugares((lugaresResult || []) as Lugar[]);
            }
        } catch (e) {
            console.error('Error inesperado durante fetchData:', e);
            toast.error('Error inesperado al cargar los datos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
      if (!cargandoRol && rol) {
        fetchData(); 
      }
    }, [rol, cargandoRol]);

    const handleOpenCreateLiderModal = () => {
        router.push('/protected/admin/sign-up');
    };

    const handleOpenAnadirAfiliadoModal = (liderId: string) => {
        setIsCelulaOpen(false);
        setAfiliadoParaEditar(null);
        setLiderParaNuevoAfiliado(liderId);
        setIsFormOpen(true);
    };

    const handleOpenEditModal = (afiliado: Afiliado) => {
        setIsCelulaOpen(false);
        setAfiliadoParaEditar(afiliado);
        setLiderParaNuevoAfiliado(null);
        setIsFormOpen(true);
    };

    const handleOpenCelulaModal = (lider: Lider) => {
        // Lógica de apertura asegurada: setea el líder y luego abre el modal.
        setLiderParaCelula(lider); 
        setIsCelulaOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormOpen(false);
        if (liderParaCelula) {
            setIsCelulaOpen(true);
        }
    };

    const handleCloseCelulaModal = () => {
        setIsCelulaOpen(false);
        setLiderParaCelula(null);
    };

    const handleSaveAndCloseForm = async () => {
        const wasViewingCelula = !!liderParaCelula;
        const leaderIdToReturnTo = liderParaCelula?.id;

        setIsFormOpen(false);
        await fetchData();

        if (wasViewingCelula && leaderIdToReturnTo) {
            const updatedLider = lideres.find(l => l.id === leaderIdToReturnTo);
            
            if (updatedLider) {
                setLiderParaCelula(updatedLider); 
                setIsCelulaOpen(true);
            } else {
                setLiderParaCelula(null); 
                setIsCelulaOpen(false);
            }
        }
    };

    if (loading || cargandoRol) { return <div className="text-center py-10">Cargando...</div>; }

    return (
        <>
            <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <h1 className="text-2xl font-bold text-black md:text-3xl">Líderes de Células 🤝</h1>                   
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-end gap-2 w-full md:w-auto mt-4 md:mt-0">
                        <Button onClick={() => setIsEstadisticasOpen(true)} variant="outline" className="gap-2 w-full text-xl">
                           📊  Estadísticas
                        </Button>
                        
                        {(rol === 'ADMINISTRADOR' || rol === 'SUPER') && (
                            <Button onClick={handleOpenCreateLiderModal} className="gap-2 w-full text-xl">
                               🦸 Nuevo Líder
                            </Button>
                        )}
                    </div>
                </div>

                <Lideres
                    lideres={lideres}
                    onVerCelula={handleOpenCelulaModal}
                    rolUsuarioSesion={rol}
                />
            </div>

            {isEstadisticasOpen && (
                    <Estadisticas
                        afiliados={afiliados}
                        onClose={() => setIsEstadisticasOpen(false)}
                    />
                )}

            <Celula
                isOpen={isCelulaOpen}
                onClose={handleCloseCelulaModal}
                lider={liderParaCelula}
                afiliados={afiliados}
                onEditar={handleOpenEditModal}
                onAnadirAfiliado={handleOpenAnadirAfiliadoModal}
                onDataChange={fetchData}
            />

            <Form
                isOpen={isFormOpen}
                onClose={handleCloseFormModal}
                onSave={handleSaveAndCloseForm}
                afiliadoAEditar={afiliadoParaEditar}
                liderPredefinidoId={liderParaNuevoAfiliado}
                lugares={lugares}
                lideres={lideres}
            />
        </>
    );
}