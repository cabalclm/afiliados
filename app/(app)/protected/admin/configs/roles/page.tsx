'use client';

import { Suspense } from 'react';
import VerRoles from '@/components/admin/roles/VerRoles';

export default function RolesPage() {
  return (
    <Suspense>
      <VerRoles />
    </Suspense>
  );
}
