'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle, Circle } from 'lucide-react';
import Image from 'next/image';

type Props = {
  password: string;
  confirmar: string;
  onPasswordChange: (val: string) => void;
  onConfirmarChange: (val: string) => void;
};

export default function PasswordSection({
  password,
  confirmar,
  onPasswordChange,
  onConfirmarChange,
}: Props) {
  const [mostrarPass, setMostrarPass] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);

  const contraseñasCoinciden = password.length > 0 && password === confirmar;

  const checkLength = password.length >= 8;
  const checkUpper = /[A-Z]/.test(password);
  const checkLower = /[a-z]/.test(password);
  const checkNumber = /\d/.test(password);
  const checkSymbol = /[^A-Za-z0-9]/.test(password);

  let statusMessage;
  if (contraseñasCoinciden) {
    statusMessage = (
      <div className="flex items-center gap-1.5 text-green-600 text-xs font-semibold">
        <CheckCircle2 size={14} />
        <span>Coinciden</span>
      </div>
    );
  } else if (confirmar.length > 0 && !contraseñasCoinciden) {
    statusMessage = (
      <div className="flex items-center gap-1.5 text-red-600 text-xs font-semibold">
        <XCircle size={14} />
        <span>No coinciden</span>
      </div>
    );
  } else {
    statusMessage = (
      <div className="flex items-center gap-1.5 text-orange-600 text-xs font-semibold">
        <AlertTriangle size={14} />
        <span>Confirmar Contraseña</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label htmlFor="password" className="sr-only">
          Contraseña
        </Label>
        <div className="relative">
          <Input
            type={mostrarPass ? 'text' : 'password'}
            name="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Ingresa una contraseña"
            required
            className="h-12 text-lg pr-10"
          />
          <button
            type="button"
            onClick={() => setMostrarPass(!mostrarPass)}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            {mostrarPass ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <Label htmlFor="confirmar" className="sr-only">
            Confirmar contraseña
          </Label>
          {statusMessage}
        </div>
        <div className="relative">
          <Input
            type={mostrarConfirm ? 'text' : 'password'}
            name="confirmar"
            value={confirmar}
            onChange={(e) => onConfirmarChange(e.target.value)}
            placeholder="Confirma tu contraseña"
            required
            className="h-12 text-lg pr-10"
          />
          <button
            type="button"
            onClick={() => setMostrarConfirm(!mostrarConfirm)}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            {mostrarConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <div className="flex items-start justify-between w-full mt-2">
        <div className="flex-shrink-0">
          <Image
            src="/gif/afiliados/gif0.gif"
            alt="Validación"
            width={125}
            height={125}
            unoptimized
            className="rounded-full"
          />
        </div>
        <ul className="text-xs space-y-1 mt-1 flex-1 font-semibold text-right">
          <li className={checkLength ? 'text-green-600' : 'text-red-600'}>
            <div className="flex justify-end items-center gap-2">
              <span>Al menos 8 caracteres</span>
              {checkLength ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            </div>
          </li>
          <li className={checkUpper ? 'text-green-600' : 'text-red-600'}>
            <div className="flex justify-end items-center gap-2">
              <span>Una letra mayúscula</span>
              {checkUpper ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            </div>
          </li>
          <li className={checkLower ? 'text-green-600' : 'text-red-600'}>
            <div className="flex justify-end items-center gap-2">
              <span>Una letra minúscula</span>
              {checkLower ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            </div>
          </li>
          <li className={checkNumber ? 'text-green-600' : 'text-red-600'}>
            <div className="flex justify-end items-center gap-2">
              <span>Un número</span>
              {checkNumber ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            </div>
          </li>
          <li className={checkSymbol ? 'text-green-600' : 'text-red-600'}>
            <div className="flex justify-end items-center gap-2">
              <span>Un símbolo (ej. !@#$%)</span>
              {checkSymbol ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}