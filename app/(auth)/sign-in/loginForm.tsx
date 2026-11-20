"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { signInAction } from "@/app/actions/usuarios";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Swal from "@/lib/swal";

const EASE = [0.22, 1, 0.36, 1] as const;

function PendingSignInButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-700 to-sky-500 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/30 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:focus-visible:ring-offset-neutral-900"
    >
      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      {isPending ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Iniciando...
        </>
      ) : (
        "Iniciar sesión"
      )}
    </button>
  );
}

export function LoginForm() {
  const [verPassword, setVerPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  function traducirError(mensaje: string) {
    const errores: Record<string, string> = {
      "email rate limit exceeded": "Demasiados intentos. Espere unos minutos.",
      "user already registered": "El usuario ya está registrado.",
      "invalid login credentials": "Credenciales incorrectas.",
      "signup requires a valid password": "Contraseña inválida.",
      "user not found": "Usuario no encontrado.",
      "Usuario o contraseña incorrectos": "Usuario o contraseña incorrectos.",
    };
    return errores[mensaje.toLowerCase()] || mensaje;
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleFormAction = async (formData: FormData) => {
    const finalEmail = `${email.trim()}@app.com`;

    setClientError(null);
    formData.set("email", finalEmail);
    formData.set("password", password);

    startTransition(async () => {
      const result = await signInAction(formData);

      if (result && result.error) {
        Swal.fire({
          title: "Error al iniciar sesión",
          text: traducirError(result.error),
          icon: "error",
        });
      }
    });
  };

  const inputClass =
    "h-12 w-full rounded-xl border border-gray-200 bg-gray-50/80 pl-11 pr-4 text-base text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/15 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-sky-400 dark:focus:bg-neutral-900";

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10">
      {/* Fondo decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-sky-50 via-white to-blue-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-blue-950/60"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 -z-10 h-96 w-96 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-600/15"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-24 -z-10 h-[28rem] w-[28rem] rounded-full bg-blue-400/25 blur-3xl dark:bg-blue-700/20"
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="mb-5 rounded-3xl bg-white p-3 shadow-xl shadow-blue-900/10 ring-1 ring-black/5 dark:bg-neutral-800 dark:ring-white/10"
          >
            <Image
              src="/svg/logo-2.svg"
              alt="Sistema de Organización Territorial Estratégica"
              height={100}
              width={100}
              className="h-20 w-20 rounded-2xl object-contain"
              priority
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
            className="text-2xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white md:text-3xl"
            style={{ fontFamily: "'DM Serif Display', serif" }}
          >
            Sistema de Organización
            <br />
            <span className="bg-gradient-to-r from-blue-700 via-sky-500 to-blue-700 bg-clip-text text-transparent dark:from-blue-400 dark:via-sky-300 dark:to-blue-400">
              Territorial Estratégica
            </span>
          </motion.h1>
        </div>

        <form
          ref={formRef}
          action={handleFormAction}
          className="flex flex-col gap-6 rounded-3xl border border-white/60 bg-white/80 p-7 shadow-2xl shadow-blue-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-800/70 md:p-9"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Bienvenido
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ingresa tus credenciales para continuar.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
            className="flex flex-col gap-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Usuario
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value.replace(/@.*$/, ""));
                    setClientError(null);
                  }}
                  placeholder="Ingrese su usuario"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={verPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  required
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-700 dark:hover:text-gray-200"
                  aria-label="Mostrar u ocultar contraseña"
                >
                  {verPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {clientError ? (
              <p className="text-sm text-red-600">{clientError}</p>
            ) : null}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65, ease: EASE }}
          >
            <PendingSignInButton isPending={isPending} />
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
