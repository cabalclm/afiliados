'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { signInAction } from '@/app/actions/usuarios';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Typewriter } from 'react-simple-typewriter';
import { Button } from '@/components/ui/button';
import Swal from 'sweetalert2';

function PendingSignInButton({ isPending }: { isPending: boolean }) {
  return (
    <Button
      type="submit"
      disabled={isPending}
      className="text-2xl py-8 flex-1 bg-blue-700"
    >
      {isPending ? 'Iniciando...' : 'Iniciar Sesión'}
    </Button>
  );
}

export function LoginForm() {
  const [verPassword, setVerPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

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

  const handleEmailBlur = () => {
    let finalEmail = email.trim();
    if (finalEmail && !finalEmail.includes('@')) {
      finalEmail += '@clmcabal.com';
      setEmail(finalEmail);
    }
  };

  const handleFormAction = async (formData: FormData) => {
    let finalEmail = email.trim(); 

    if (!finalEmail.endsWith('@clmcabal.com')) {
      Swal.fire({
        title: 'Error de validación',
        text: 'El dominio del correo debe ser @clmcabal.com',
        icon: 'error',
      });
      return;
    }
    
    setClientError(null);
    formData.set('email', finalEmail);
    formData.set('password', password); 

    startTransition(async () => {
      const result = await signInAction(formData);

      if (result && result.error) {
        Swal.fire({
          title: 'Error al iniciar sesión',
          text: traducirError(result.error),
          icon: 'error',
        });
      }
    });
  };

  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: -30, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 2.0, ease: [0.25, 1, 0.5, 1] }}
      >
        <Image
          src="/images/logo.png"
          alt="Logo"
          width={200}
          height={100}
          className="object-contain"
          priority
        />
      </motion.div>
      <form
        ref={formRef}
        action={handleFormAction}
        className="w-full md:max-w-2xl flex flex-col gap-8 text-2xl bg-white md:rounded-xl px-5 py-5 border border-gray-300"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full px-4 flex flex-col gap-4"
        >
          <div className="flex justify-center w-full">
            <h1 className="text-2xl font-bold text-blue-600 md:text-3xl">
              <Typewriter
                words={['Iniciar sesión']}
                loop={1}
                cursor
                cursorStyle=""
                typeSpeed={70}
                deleteSpeed={50}
                delaySpeed={1000}
              />
            </h1>
          </div>

        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col gap-6"
        >
          <div>
            <Label htmlFor="email" className="text-2xl text-blue-600 mb-2 block">
              Email
            </Label>
            <Input
              name="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setClientError(null);
              }}
              onBlur={handleEmailBlur} 
              placeholder="usuario@clmcabal.com"
              required
              className="text-2xl py-8 px-4"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-2xl text-blue-600 mb-2 block">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                type={verPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          <PendingSignInButton isPending={isPending} />
        </motion.div>
      </form>
    </div>
  );
}