'use client';

import { Suspense } from 'react';
import { LoginForm } from './sign-in/loginForm';

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
