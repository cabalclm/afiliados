// protected/admin/organos/page.tsx
'use client';

import { Suspense } from 'react';
import VerAfiliados from '@/components/afiliados/Ver';

export default function OrganosPage() {
  return (
    <Suspense >
      <VerAfiliados/>
    </Suspense>
  );
}