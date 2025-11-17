'use client';

import { Input } from '@/components/ui/input';

type Props = {
  valor: string;
  campo: 'nombres' | 'email';
  onBuscar: (valor: string) => void;
  onCambiarCampo: (campo: 'nombres' | 'email') => void;
};

export default function SearchBar({ valor, campo, onBuscar, onCambiarCampo }: Props) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 w-full">
      <div className="flex gap-2 items-center w-full md:w-auto">
        <label htmlFor="campo" className="text-sm font-medium whitespace-nowrap">
          Buscar por:
        </label>
        <select
          id="campo"
          value={campo}
          onChange={(e) => onCambiarCampo(e.target.value as 'nombres' | 'email')}
          className="border rounded px-2 py-1"
        >
          <option value="email">Correo</option>
          <option value="nombres">Nombre Completo</option>
        </select>
      </div>
      <Input
        type="text"
        placeholder={`Buscar por ${campo === 'email' ? 'correo' : 'nombre'}...`}
        value={valor}
        onChange={(e) => onBuscar(e.target.value)}
        className="w-full md:w-64"
      />
    </div>
  );
}