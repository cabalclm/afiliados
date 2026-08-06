// protected/admin/organos/page.tsx
'use client';

import { Suspense } from 'react';
import VerAfiliados from '@/components/afiliados/Ver';
import useUserData from '@/hooks/sesion/useUserData';

function VerAfiliadosConSesion() {
  const { userId, cargando } = useUserData();

  if (cargando) {
    return (
      <div className="animate-pulse space-y-4 px-2 md:px-6">
        <div className="h-14 bg-gray-100 dark:bg-neutral-800 rounded-lg" />
        <div className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-xl" />
      </div>
    );
  }

  return <VerAfiliados key={userId || 'sin-sesion'} />;
}

export default function OrganosPage() {
  return (
    <Suspense>
      <VerAfiliadosConSesion />
    </Suspense>
  );
}