
import { Suspense } from 'react';
import { UsuarioPageContent } from '@/components/admin/users/ver/usuarioPage';

export default function VerUsuarioPage() {
  return (
    <Suspense >
      <UsuarioPageContent />
    </Suspense>
  );
}
