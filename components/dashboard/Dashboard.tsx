'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Suspense } from 'react'; 
import VerAfiliados from '@/components/afiliados/Ver'; 
import useUserData from '@/hooks/sesion/useUserData'; 
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const { rol, cargando } = useUserData();

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center text-gray-700">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg font-semibold">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="w-full flex flex-col sm:flex-row sm:justify-between gap-4 items-stretch sm:items-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      >

        <h1 className="text-lg md:text-xl font-bold">
          {rol === 'SUPER' ? `Dashboard de ${rol}` : 'Dashboard de Usuario'}
        </h1>
      </motion.div>

      <section>
        <Suspense fallback={<div className="text-center py-10">Cargando Afiliados...</div>}>
          <VerAfiliados />
        </Suspense>
      </section>
    </>
  );
}