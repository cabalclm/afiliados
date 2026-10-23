"use client";

import BloqueCampana from "./BloqueCampana";

export default function ConfiguracionSistema() {
  return (
    <div className="mb-2 w-full transition-all duration-300 lg:hidden">
      <div className="flex w-full justify-center pb-5">
        <BloqueCampana variant="page" />
      </div>
    </div>
  );
}
