"use client";

import { MorphIcon } from "morphicons/react";
import { useState, type ReactNode } from "react";

/** Lucide (paquete `lucide`) exporta árbol SVG completo; morphicons quiere el IconNode hijo. */
export function lucideNode(icon: unknown) {
  if (Array.isArray(icon) && icon[0] === "svg" && Array.isArray(icon[2])) {
    return icon[2];
  }
  if (Array.isArray(icon) && icon.length > 0 && Array.isArray(icon[0])) {
    return icon;
  }
  return [];
}

type IconProps = {
  idle: unknown;
  hover: unknown;
  size?: number;
  className?: string;
  strokeWidth?: number;
  active?: boolean;
};

/** Ícono que morph-ea. Si no pasas `active`, reacciona a su propio hover. */
export default function HoverMorphIcon({
  idle,
  hover,
  size = 20,
  className,
  strokeWidth = 2,
  active,
}: IconProps) {
  const [local, setLocal] = useState(false);
  const on = active ?? local;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className ?? ""}`}
      onMouseEnter={() => {
        if (active === undefined) setLocal(true);
      }}
      onMouseLeave={() => {
        if (active === undefined) setLocal(false);
      }}
    >
      <MorphIcon
        icon={lucideNode(on ? hover : idle) as never}
        size={size}
        strokeWidth={strokeWidth}
        spring="snappy"
        className="block"
      />
    </span>
  );
}

type RowProps = {
  idle: unknown;
  hover: unknown;
  size?: number;
  className?: string;
  iconClassName?: string;
  children: ReactNode;
};

/** Contenedor: al pasar el mouse por el bloque, morph del ícono. */
export function MorphHoverRow({
  idle,
  hover,
  size = 20,
  className,
  iconClassName,
  children,
}: RowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <span
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <HoverMorphIcon
        idle={idle}
        hover={hover}
        size={size}
        active={hovered}
        className={iconClassName}
      />
      {children}
    </span>
  );
}
