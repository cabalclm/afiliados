'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { Search } from 'lucide-react';
import Estadisticas from './Estadisticas';
import Lideres from './Lideres';
import AfiliadosGeneral from './AfiliadosGeneral';
import Form from './Form';
import Celula from './Celula';
import { SignupForm } from '@/components/admin/sign-up/SignForm';
import type { Afiliado, Lider } from './esquemas';
import { createClient } from '@/utils/supabase/client';
import useUserData from '@/hooks/sesion/useUserData';
import { Dialog, Transition, TransitionChild, DialogPanel } from '@headlessui/react';

type Lugar = { id: number; nombre: string; };
type Tab = 'Lideres' | 'Afiliados';

export default function Ver() {
    const { rol, cargando: cargandoRol, userId } = useUserData();
    const router = useRouter();

    const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
    const [lideres, setLideres] = useState<Lider[]>([]);
    const [lugares, setLugares] = useState<Lugar[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('Lideres');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isCelulaOpen, setIsCelulaOpen] = useState(false);
    const [isEstadisticasOpen, setIsEstadisticasOpen] = useState(false);
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

    const [afiliadoParaEditar, setAfiliadoParaEditar] = useState<Afiliado | null>(null);
    const [liderParaCelula, setLiderParaCelula] = useState<Lider | null>(null);
    const [liderParaNuevoAfiliado, setLiderParaNuevoAfiliado] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');

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
                console.error('Error fetching data:', lideresError || afiliadosError || lugaresError);
                toast.error('Error al cargar los datos.');
            } else {
                const allLideres = (lideresResult || []) as Lider[];

                if (rol === 'LIDER' && userId) {
                    const myLider = allLideres.find(l => l.id === userId);
                    const otherLideres = allLideres.filter(l => l.id !== userId);

                    if (myLider) {
                        setLideres([myLider, ...otherLideres]);
                    } else {
                        setLideres(allLideres);
                    }
                } else {
                    setLideres(allLideres);
                }
                
                setAfiliados((afiliadosResult || []) as Afiliado[]);
                setLugares((lugaresResult || []) as Lugar[]);
            }
        } catch (e) {
            console.error('Excepción en fetchData:', e);
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
        setIsSignupModalOpen(true);
    };

    const handleSignupSuccess = () => {
        setIsSignupModalOpen(false);
        fetchData();
    };

    const handleCloseSignupModal = () => {
        setIsSignupModalOpen(false);
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
        if (!lider) return;
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

    const TabButton = ({ tabName }: { tabName: Tab }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-base font-semibold transition-colors duration-200 ${
                activeTab === tabName
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
            }`}
        >
            {tabName === 'Lideres' ? '👥 Líderes' : '✅ Afiliados'}
        </button>
    );

    return (
        <>
            <div className="p-2 md:px-6 md:py-2">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                         <h1 className="text-2xl font-bold text-black md:text-3xl whitespace-nowrap">Gestión de Datos 📊</h1>                  
                    </div>

                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o DPI..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-end gap-2 w-full md:w-auto">
                        <Button onClick={() => setIsEstadisticasOpen(true)} variant="outline" className="gap-2 w-full text-xl">
                           📊 Estadísticas Generales
                        </Button>
                        
                        {(rol === 'ADMINISTRADOR' || rol === 'SUPER') && (
                            <Button onClick={handleOpenCreateLiderModal} className="gap-2 w-full text-xl">
                               🦸 Nuevo Líder
                            </Button>
                        )}
                    </div>
                </div>
                
                <div className="flex border-b mb-6">
                    <TabButton tabName="Lideres" />
                    <TabButton tabName="Afiliados" />
                </div>
                
                {activeTab === 'Lideres' && (
                    <Lideres
                        lideres={lideres}
                        onVerCelula={handleOpenCelulaModal}
                        rolUsuarioSesion={rol}
                        onDataChange={fetchData}
                        searchTerm={searchTerm}
                        idUsuarioSesion={userId}
                    />
                )}
                
                {activeTab === 'Afiliados' && (
                    <AfiliadosGeneral
                        afiliados={afiliados}
                        lideres={lideres}
                        onEditar={handleOpenEditModal}
                        onDataChange={fetchData}
                        searchTerm={searchTerm}
                    />
                )}
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
                rolUsuarioSesion={rol ?? ''}            
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

            {/* Modal para Crear Líder (SignupForm) */}
            <Transition show={isSignupModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={handleCloseSignupModal}>
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50" />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <TransitionChild
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <DialogPanel className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
                                    <div className="p-4 md:p-8">
                                        <SignupForm onSuccess={handleSignupSuccess} isModal={true} />
                                    </div>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
}