'use client';

import { Suspense } from 'react';
import { UsuarioPageContent } from './usuarioPage';

export default function VerUsuarioPage() {
  return (
    <Suspense >
      <UsuarioPageContent />
    </Suspense>
  );
}
