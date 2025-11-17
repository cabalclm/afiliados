'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { signInAction } from '@/app/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Typewriter } from 'react-simple-typewriter';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

function PendingSignInButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className="text-2xl py-8 flex-1"
    >
      {pending ? 'Iniciando...' : 'Iniciar Sesión'}
    </Button>
  );
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const success = searchParams.get('success');
  const [verPassword, setVerPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function traducirError(mensaje: string) {
    const errores: Record<string, string> = {
      'email rate limit exceeded': 'Demasiados intentos. Espere unos minutos.',
      'user already registered': 'El usuario ya está registrado.',
      'invalid login credentials': 'Credenciales incorrectas.',
      'signup requires a valid password': 'Contraseña inválida.',
      'user not found': 'Usuario no encontrado.',
      'correo o contraseña incorrectos': 'Correo o contraseña incorrectos.',
    };
    return errores[mensaje.toLowerCase()] || mensaje;
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <Image
        src="/images/logo.png"
        alt="Logo"
        width={200}
        height={100}
        className="mb-8 object-contain"
        priority
      />
      <form
        ref={formRef}
        action={signInAction}
        className="w-full md:max-w-2xl flex flex-col gap-8 text-2xl bg-white md:rounded-xl px-5 py-5 border border-gray-300"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full px-4 flex flex-col gap-4"
        >
          <div className="flex justify-center w-full">
            <h1 className="text-2xl font-bold text-black md:text-3xl">
              <Typewriter
                words={['Inica sesión']}
                loop={1}
                cursor
                cursorStyle=""
                typeSpeed={70}
                deleteSpeed={50}
                delaySpeed={1000}
              />
            </h1>
          </div>

          <div className="flex items-center justify-between w-full gap-4 flex-wrap md:flex-nowrap">
            <div className="flex-1">
              <p className="text-[#06c] text-base md:text-lg font-medium">
                <Typewriter
                  words={['Ingresa tu usuario y contraseña para continuar']}
                  loop={1}
                  cursor
                  cursorStyle="|"
                  typeSpeed={70}
                  deleteSpeed={50}
                  delaySpeed={1000}
                />
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col gap-6"
        >
          {(error || success) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={`p-4 rounded border text-xl ${
                error
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : 'bg-green-100 text-green-800 border-green-300'
              }`}
            >
              {error && traducirError(decodeURIComponent(error))}
              {success && decodeURIComponent(success)}
            </motion.div>
          )}

          <div>
            <Label htmlFor="email" className="text-2xl mb-2 block">
              Email
            </Label>
            <Input
              name="email"
              placeholder="usuario@clmcabal.com"
              required
              className="text-2xl py-8 px-4"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-2xl mb-2 block">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                type={verPassword ? 'text' : 'password'}
                name="password"
                placeholder="Tu Contraseña"
                required
                className="text-2xl py-8 px-4 pr-12"
              />
              <button
                type="button"
                onClick={() => setVerPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                aria-label="Mostrar u ocultar contraseña"
              >
                {verPassword ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="flex items-center gap-4"
        >
          <div className="w-[120px] h-[120px] ">
            <Image
              src="/gif/afiliados/gif0.gif"
              alt="Iniciar sesión"
              width={120}
              height={120}
              className="w-full h-full object-contain"
            />
          </div>
          <PendingSignInButton />
        </motion.div>
      </form>
    </div>
  );
}