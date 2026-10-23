import HeaderAuth from "@/components/header-auth";
import BloqueCampana from "@/components/dashboard/BloqueCampana";
import LogoLink from "@/components/ui/LogoLink";

/** Nav: logo | campaña (lg+) | sesión */
export default function EncabezadoApp() {
  return (
    <nav className="w-full shrink-0">
      <div
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 py-2 pl-1 pr-3 sm:px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] lg:items-center lg:gap-4"
      >
        <div className="min-w-0 justify-self-start">
          <LogoLink />
        </div>

        <div className="hidden min-w-0 justify-self-center lg:block">
          <BloqueCampana variant="header" />
        </div>

        <div className="justify-self-end shrink-0">
          <HeaderAuth />
        </div>
      </div>
    </nav>
  );
}
