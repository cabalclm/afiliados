'use client';

import { Suspense } from 'react';
import { SignupForm } from './signupForm';

export default function SignupPage() {
  return (
    <Suspense >
      <SignupForm />
    </Suspense>
  );
}
