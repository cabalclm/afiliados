"use client";

import { Suspense } from "react";
import { LoginForm } from "./loginForm";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900 md:p-4 transition-colors">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
