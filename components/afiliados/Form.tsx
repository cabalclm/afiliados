'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { afiliadoSchema, type Afiliado as AfiliadoType, type Lider } from './esquemas';
import Image from 'next/image';
import { toast } from 'react-toastify';

type AfiliadoFormData = z.infer<typeof afiliadoSchema>;
type Lugar = { id: number; nombre: string; };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  afiliadoAEditar?: AfiliadoType | null;
  liderPredefinidoId?: string | null;
  lugares: Lugar[];
  lideres: Lider[];
}

export default function Form({ isOpen, onClose, onSave, afiliadoAEditar, liderPredefinidoId, lugares, lideres }: Props) {
  const isEditMode = !!afiliadoAEditar;

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, reset, watch, setValue } = useForm<AfiliadoFormData>({
    resolver: zodResolver(afiliadoSchema),
    defaultValues: {
      sexo: 'M',
      lugar_id: 0,
    },
  });

  const sexoActual = watch('sexo');

  const [liderSearch, setLiderSearch] = useState('');
  const [liderSuggestions, setLiderSuggestions] = useState<Lider[]>([]);
  const [showLiderSuggestions, setShowLiderSuggestions] = useState(false);
  const liderInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (afiliadoAEditar) {
        const nacimientoFormatted = afiliadoAEditar.nacimiento 
          ? new Date(afiliadoAEditar.nacimiento).toISOString().split('T')[0] 
          : '';
        reset({
          ...afiliadoAEditar,
          nacimiento: nacimientoFormatted,
          lugar_id: afiliadoAEditar.lugar_id,
        } as AfiliadoFormData);

        if (afiliadoAEditar.lider_id) {
          const currentLider = lideres.find(l => l.id === afiliadoAEditar.lider_id);
          setLiderSearch(currentLider ? `${currentLider.nombres} ${currentLider.apellidos}` : '');
        } else {
          setLiderSearch('');
        }
        setShowLiderSuggestions(false);
      } else {
        reset({
          nombres: '',
          apellidos: '',
          telefono: '',
          dpi: '',
          lider_id: liderPredefinidoId || null,
          nacimiento: '',
          sexo: 'M',
          lugar_id: 0,
        });
        setLiderSearch('');
        setShowLiderSuggestions(false);
      }
    }
  }, [isOpen, afiliadoAEditar, liderPredefinidoId, reset, lideres]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (liderInputRef.current && !liderInputRef.current.contains(event.target as Node)) {
        setShowLiderSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLiderSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value;
    setLiderSearch(searchTerm);
    
    if (searchTerm.trim() === '') {
      setLiderSuggestions([]);
      setShowLiderSuggestions(false);
      setValue('lider_id', null);
    } else {
      const filtered = lideres.filter(lider =>
        `${lider.nombres} ${lider.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setLiderSuggestions(filtered);
      setShowLiderSuggestions(true);
    }
  };

  const handleLiderSuggestionClick = (lider: Lider) => {
    setLiderSearch(`${lider.nombres} ${lider.apellidos}`);
    setValue('lider_id', lider.id, { shouldValidate: true });
    setShowLiderSuggestions(false);
  };

  const onSubmit = async (formData: AfiliadoFormData) => {
    const supabase = createClient();
    
    if (formData.dpi) {
        let query = supabase.from('afiliados').select('id').eq('dpi', formData.dpi);
        if (isEditMode) query = query.neq('id', afiliadoAEditar!.id);
        const { data: dpiExists } = await query;
        if (dpiExists && dpiExists.length > 0) {
            setError('dpi', { type: 'manual', message: 'Este DPI ya está registrado.' });
            return;
        }
    }

    let result;
    if (isEditMode) {
      result = await supabase.from('afiliados').update(formData).eq('id', afiliadoAEditar!.id);
    } else {
      result = await supabase.from('afiliados').insert(formData);
    }

    if (result.error) {
      toast.error(`Error inesperado: ${result.error.message}`);
    } else {
      toast.success(`Afiliado ${isEditMode ? 'actualizado' : 'creado'} correctamente.`);
      onSave();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <motion.div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{isEditMode ? 'Editar Afiliado' : 'Nuevo Afiliado'}</h2>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <div className="flex justify-center my-4">
          <Image src="/gif/afiliados/gif0.gif" alt="Animación de afiliado" width={120} height={120} unoptimized />
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
              <div>
                  <Input {...register("nombres")} placeholder="Nombres" className={errors.nombres ? 'border-red-500' : ''} />
                  {errors.nombres && <p className="text-sm text-red-500 mt-1">{errors.nombres.message}</p>}
              </div>
              <div>
                  <Input {...register("apellidos")} placeholder="Apellidos" className={errors.apellidos ? 'border-red-500' : ''} />
                  {errors.apellidos && <p className="text-sm text-red-500 mt-1">{errors.apellidos.message}</p>}
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                  <Input {...register("telefono")} placeholder="Teléfono (8 dígitos)" className={errors.telefono ? 'border-red-500' : ''} />
                  {errors.telefono && <p className="text-sm text-red-500 mt-1">{errors.telefono.message}</p>}
              </div>
              <div>
                  <Input {...register("dpi")} placeholder="DPI (13 dígitos)" className={errors.dpi ? 'border-red-500' : ''} />
                  {errors.dpi && <p className="text-sm text-red-500 mt-1">{errors.dpi.message}</p>}
              </div>
          </div>
          
          <div>
            <select 
                {...register("lugar_id", { valueAsNumber: true })} 
                className={`w-full h-10 px-3 py-2 border rounded-md shadow-sm ${errors.lugar_id ? 'border-red-500' : 'border-gray-300'}`}
                defaultValue={afiliadoAEditar?.lugar_id || 0}
            >
              <option value={0}>Seleccione un lugar/dirección...</option>
              {lugares.map(lugar => (<option key={lugar.id} value={lugar.id}>{lugar.nombre}</option>))}
            </select>
            {errors.lugar_id && <p className="text-sm text-red-500 mt-1">{errors.lugar_id.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Fecha de Nacimiento</label>
                  <Input type="date" {...register("nacimiento")} className={errors.nacimiento ? 'border-red-500' : ''} />
                  {errors.nacimiento && <p className="text-sm text-red-500 mt-1">{errors.nacimiento.message}</p>}
              </div>
              <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Sexo</label>
                  <div className="flex rounded-md border p-1 bg-gray-100">
                      <button type="button" onClick={() => setValue('sexo', 'M', { shouldValidate: true })} className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${sexoActual === 'M' ? 'bg-blue-500 text-white shadow' : 'text-gray-600'}`}>Masculino</button>
                      <button type="button" onClick={() => setValue('sexo', 'F', { shouldValidate: true })} className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${sexoActual === 'F' ? 'bg-pink-500 text-white shadow' : 'text-gray-600'}`}>Femenino</button>
                  </div>
                  {errors.sexo && <p className="text-sm text-red-500 mt-1">{errors.sexo.message}</p>}
              </div>
          </div>

          {(liderPredefinidoId && !isEditMode) ? (
              <input type="hidden" {...register("lider_id")} value={liderPredefinidoId} />
          ) : (
             <div className="relative" ref={liderInputRef}>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Líder de Célula</label>
                <Input
                  type="text"
                  value={liderSearch}
                  onChange={handleLiderSearchChange}
                  onFocus={() => {
                     if (liderSearch.trim() !== '') {
                        const filtered = lideres.filter(lider =>
                            `${lider.nombres} ${lider.apellidos}`.toLowerCase().includes(liderSearch.toLowerCase())
                        );
                        setLiderSuggestions(filtered);
                     }
                     setShowLiderSuggestions(true);
                  }}
                  placeholder="Buscar líder por nombre..."
                  className={errors.lider_id ? 'border-red-500' : ''}
                  autoComplete="off"
                />
                <input type="hidden" {...register("lider_id")} />
                
                {showLiderSuggestions && liderSuggestions.length > 0 && (
                    <motion.ul
                        className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                    >
                        {liderSuggestions.map(lider => (
                            <li
                                key={lider.id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleLiderSuggestionClick(lider)}
                            >
                                {lider.nombres} {lider.apellidos}
                            </li>
                        ))}
                    </motion.ul>
                )}
                {errors.lider_id && <p className="text-sm text-red-500 mt-1">{errors.lider_id.message}</p>}
            </div>
          )}


          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}