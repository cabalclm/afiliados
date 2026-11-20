"use client";

import { Suspense } from "react";
import { LoginForm } from "./loginForm";

export default function SignInPage() {
  return (
    <div className="flex w-full min-h-screen items-center justify-center">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
