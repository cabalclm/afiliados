'use client';

import { Dialog, Transition, TransitionChild, DialogPanel } from '@headlessui/react';
import { Fragment } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import type { Afiliado } from './esquemas';

interface Props {
  afiliados: Afiliado[];
  onClose?: () => void;
}

type RangoClave = 'jovenes' | 'adultos' | 'adultosMayores';

const calcularEdad = (fechaNacimiento: string | Date) => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
};

const CustomXAxisTick = ({ x, y, payload }: any) => {
  if (!payload || !payload.value) return null;
  const label = payload.value;
  const parts = label.match(/(.*)(\(.*\))/);

  const textColor = "#333";
  const fontWeight = "bold";

  if (!parts || parts.length < 3) {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={15} textAnchor="middle" fill={textColor} fontSize={12} fontWeight={fontWeight}>
          {label}
        </text>
      </g>
    );
  }

  const line1 = parts[1].trim();
  const line2 = parts[2].trim();

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={15} textAnchor="middle" fill={textColor} fontSize={12} fontWeight={fontWeight}>
        <tspan x={0} dy="0em">{line1}</tspan>
        <tspan x={0} dy="1.2em">{line2}</tspan>
      </text>
    </g>
  );
};

const EstadisticasCore = ({ afiliados, onClose, isModal = false }: Props & { isModal?: boolean }) => {
  const conteoPorRango: Record<RangoClave, { hombres: number; mujeres: number; total: number }> = {
    jovenes: { hombres: 0, mujeres: 0, total: 0 },
    adultos: { hombres: 0, mujeres: 0, total: 0 },
    adultosMayores: { hombres: 0, mujeres: 0, total: 0 },
  };

  afiliados.forEach(afiliado => {
    const edad = calcularEdad(afiliado.nacimiento);
    let rango: RangoClave | null = null;
    if (edad >= 18 && edad <= 30) rango = 'jovenes';
    else if (edad > 30 && edad <= 60) rango = 'adultos';
    else if (edad > 60) rango = 'adultosMayores';

    if (rango) {
      conteoPorRango[rango].total++;
      if (afiliado.sexo === 'M') conteoPorRango[rango].hombres++;
      else if (afiliado.sexo === 'F') conteoPorRango[rango].mujeres++;
    }
  });

  const totalGeneral = afiliados.length;
  const totalHombres = Object.values(conteoPorRango).reduce((acc, curr) => acc + curr.hombres, 0);
  const totalMujeres = Object.values(conteoPorRango).reduce((acc, curr) => acc + curr.mujeres, 0);

  const datosGrafica = (Object.keys(conteoPorRango) as RangoClave[]).map(clave => {
    const { hombres, mujeres, total } = conteoPorRango[clave];
    const porcentaje = totalGeneral ? ((total / totalGeneral) * 100).toFixed(1) : '0.0';
    let nombreRango = '';
    if (clave === 'jovenes') nombreRango = 'Jóvenes (18-30)';
    if (clave === 'adultos') nombreRango = 'Adultos (31-60)';
    if (clave === 'adultosMayores') nombreRango = 'Adultos Mayores (61+)';

    return { etiqueta: `${nombreRango} (${porcentaje}%)`, hombres, mujeres, total };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const nombreRango = label.split('(')[0].trim();
      return (
        <div className="bg-white border rounded px-3 py-2 shadow-lg text-sm">
          <p className="font-semibold mb-1">{nombreRango}</p>
          {payload.map((entry: any) => {
            let name = '';
            if (entry.name === 'Hombres') name = 'Hombres';
            else if (entry.name === 'Mujeres') name = 'Mujeres';
            else if (entry.name === 'Total') name = 'Total';
            return (
                <p key={`item-${entry.dataKey}`} style={{ color: entry.color }}>{`${name}`}: <strong>{entry.value}</strong></p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`w-full ${isModal ? '' : 'p-4 border rounded-lg bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
            <h4 className={'font-semibold text-gray-800 text-xl'}>

                {isModal ? 'Estadísticas de Afiliados' : 'Resumen de Célula'}
                <span className={`font-bold ${isModal ? 'text-base' : 'text-sm'}`}>
                    {' '}({totalGeneral} Personas |{' '}
                    <span style={{ color: '#06c' }}>Hombres: {totalHombres}</span> |{' '}
                    <span style={{ color: '#f87171' }}>Mujeres: {totalMujeres}</span>)
                </span>
            </h4>
            {isModal && onClose && <Button onClick={onClose} variant="ghost">Cerrar</Button>}
        </div>
        
        <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGrafica} margin={{ top: 30, right: 30, left: 0, bottom: 40 }}>
                <XAxis dataKey="etiqueta" tick={<CustomXAxisTick />} interval={0} height={70} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '25px' }} />
                <Bar dataKey="hombres" name="Hombres" fill="#06c" barSize={30} radius={[10, 10, 0, 0]}>
                  <LabelList dataKey="hombres" position="top" offset={5} fontSize={12} />
                </Bar>
                <Bar dataKey="mujeres" name="Mujeres" fill="#f87171" barSize={30} radius={[10, 10, 0, 0]}>
                  <LabelList dataKey="mujeres" position="top" offset={5} fontSize={12} />
                </Bar>
                <Bar dataKey="total" name="Total" fill="#34d399" barSize={30} radius={[10, 10, 0, 0]}>
                  <LabelList dataKey="total" position="top" offset={5} fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};


export default function Estadisticas(props: Props) { 
    if (props.onClose) {
        return (
            <Dialog open={true} onClose={props.onClose} as={Fragment}>
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                >
                    <DialogPanel className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-lg">
                        <EstadisticasCore 
                            afiliados={props.afiliados} 
                            onClose={props.onClose} 
                            isModal={true} 
                        />
                    </DialogPanel>
                </TransitionChild>
              </div>
            </Dialog>
        );
    }
    
    return <EstadisticasCore afiliados={props.afiliados} />;
}