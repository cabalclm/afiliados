'use client';

import { useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import type { Afiliado, Lider } from './esquemas';
import Tabla from './Tabla';
import { motion, AnimatePresence } from 'framer-motion';
import TextoAnimado from '@/components/ui/Typeanimation';
import Image from 'next/image';
import { Dialog, Transition, TransitionChild, DialogPanel } from '@headlessui/react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    lider: Lider | null;
    afiliados: Afiliado[];
    onEditar: (afiliado: Afiliado) => void;
    onAnadirAfiliado: (liderId: string) => void;
    onDataChange: () => void;
}

export default function Celula({ isOpen, onClose, lider, afiliados, onEditar, onAnadirAfiliado, onDataChange }: Props) {

    useEffect(() => {
        if (isOpen && lider) {
            const leaderExists = afiliados.some(a => a.lider_id === lider.id) || lider.rol === 'USUARIO';
            if (!leaderExists && afiliados.length > 0) {
                onClose();
            }
        }
    }, [afiliados, lider, isOpen, onClose]);

    if (!lider) return null;

    const afiliadosDelLider = afiliados?.filter(a => a.lider_id === lider.id) || [];
    
    const totalEnGrupo = afiliadosDelLider.length + 1; 
    const objetivo = 15;
    const progreso = Math.min((totalEnGrupo / objetivo) * 100, 100);

    let mensaje = '';
    let colorBarra = 'bg-blue-600';
    let gifUrl = '';

    if (totalEnGrupo === 1) {
        mensaje = `🎉 ¡El líder ha iniciado su grupo! 🎉 `;
        gifUrl = '/gif/afiliados/gif1.gif';
    } else if (totalEnGrupo <= 5) {
        mensaje = `🎉 ¡El grupo está creciendo con ${totalEnGrupo} miembros! 🎉 `;
        colorBarra = 'bg-blue-300';
        gifUrl = '/gif/afiliados/gif1.gif';
    } else if (totalEnGrupo <= 10) {
        mensaje = `🚀 ¡Vamos muy bien! Somos ${totalEnGrupo} de ${objetivo}. 🚀`;
        colorBarra = 'bg-yellow-600';
        gifUrl = '/gif/afiliados/gif2.gif';
    } else if (totalEnGrupo < 15) {
        mensaje = `😎 ¡Ya pasamos los 10! Somos ${totalEnGrupo} de ${objetivo}. 😎`;
        colorBarra = 'bg-purple-600';
        gifUrl = '/gif/afiliados/gif3.gif';
    } else if (totalEnGrupo === 15) {
        mensaje = `🏆 ¡Felicidades! Haz alcanzado el objetivo de ${objetivo} afiliados. 🏆`;
        colorBarra = 'bg-green-500';
        gifUrl = '/gif/afiliados/gif5.gif';
    } else {
        mensaje = `🔥 ¡Woow! Haz superado el objetivo con ${totalEnGrupo} afiliados! ¡Bien Hecho! 🔥`;
        colorBarra = 'bg-red-600';
        gifUrl = '/gif/afiliados/fire.gif';
    }

    const liderPuedeSerEliminado = afiliadosDelLider.length === 0;

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                            <DialogPanel className="bg-white rounded-lg shadow-xl w-full mx-4 max-w-full md:max-w-7xl p-6 transform transition-all">
                                
                                <div className="flex justify-between items-center mb-4">
                                    <Button onClick={onClose} variant="ghost">Cerrar</Button>
                                </div>
                                
                                <h3 className="text-xl font-bold text-center mb-2">Célula de: {lider.nombres} {lider.apellidos}</h3>

                                <div className="mb-4 p-4 border rounded-lg bg-slate-50">
                                    <div className="flex items-center gap-6">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-semibold">{totalEnGrupo} / {objetivo}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div className={`${colorBarra} h-2.5 rounded-full`} style={{ width: `${progreso}%` }}></div>
                                            </div>
                                            <div className="text-center text-sm text-gray-600 mt-2">
                                                <TextoAnimado textos={[mensaje]} />
                                            </div>
                                        </div>
                                        {gifUrl && <Image src={gifUrl} alt="Animación" width={100} height={100} unoptimized />}
                                    </div>
                                </div>
                                <div className="flex justify-center mb-4">
                                    <Button size="lg" className='text-xl' variant="outline" onClick={() => onAnadirAfiliado(lider.id)}>
                                        🙋 Añadir Afiliados
                                    </Button>
                                </div>

                                <Tabla
                                    lider={lider}
                                    afiliados={afiliadosDelLider}
                                    onEditar={onEditar}      
                                    onDataChange={onDataChange} 
                                    liderPuedeSerEliminado={liderPuedeSerEliminado}
                                />
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}