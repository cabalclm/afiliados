"use client";

import { Suspense } from "react";
import { LoginForm } from "./loginForm";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 md:p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
