import Image from "next/image";
import { Source_Sans_3 } from "next/font/google";
import { ThemeToggle } from "@/components/theme-toggle";
import { MixBuilder } from "@/components/builder/MixBuilder";

const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600", "700"] });

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full border-b">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <a href="https://moovimiento.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:cursor-pointer shrink-0" aria-label="Ir a moovimiento.com">
            {/* Logo - un solo contenedor para ambos temas */}
            <div className="relative h-8 w-8">
              <Image
                src="/moovimiento.png"
                alt="Moovimiento"
                fill
                className="block dark:hidden object-contain"
                priority
              />
              <Image
                src="/moovimiento-white.png"
                alt="Moovimiento"
                fill
                className="hidden dark:block object-contain"
                priority
              />
            </div>
            <span className={`${sourceSans.className} text-lg font-semibold leading-none`}>Moovimiento</span>
          </a>
          <nav className="flex items-center gap-4 justify-end">
            <a 
              href="https://www.moovimiento.com/#faq" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm hover:underline cursor-pointer"
            >
              Preguntas frecuentes
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">Mixs de ⚡<br />Frutos Secos a tu manera</h1>
            <p className="text-muted-foreground">Armá tu mix de 220g con ingredientes seleccionados.<br /><span className="hidden md:inline">Delivery gratuito a Ciudad Universitaria.</span></p>
          </div>
          <div className="flex justify-center">
            <a href="https://moovimiento.com" target="_blank" rel="noopener noreferrer" aria-label="Ir a moovimiento.com" className="group inline-block rounded-lg overflow-hidden shadow-sm">
              <Image
                src="/Capsule Corp.png"
                alt="Moovimiento - Hero"
                width={720}
                height={480}
                className="w-auto h-auto object-cover cursor-pointer transition-transform duration-300 ease-out group-hover:scale-105"
                priority
              />
            </a>
          </div>
        </section>
        <MixBuilder />
      </main>
      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted-foreground flex items-center justify-between">
          <span>
            © {new Date().getFullYear()}<br className="md:hidden" />
            <span className="hidden md:inline"> </span>Generado por {" "}
            <a
              href="https://catsulecorp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline text-sky-500 hover:text-sky-600 cursor-pointer"
            >
              Catsule Corp
            </a>
          </span>
          <span className="text-right">
            🇦🇷<br className="md:hidden" />
            <span className="hidden md:inline"> </span>Hecho en Argentina
          </span>
        </div>
      </footer>
    </div>
  );
}
