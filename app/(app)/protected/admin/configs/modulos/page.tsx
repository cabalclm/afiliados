'use client';

import { Suspense } from 'react';
import VerModulos from '@/components/admin/modulos/VerModulos';

export default function ModulosPage() {
  return (
    <Suspense >
      <VerModulos />
    </Suspense>
  );
}
