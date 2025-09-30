import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Source_Sans_3 } from "next/font/google";
import { ThemeToggle } from "@/components/theme-toggle";
import { MixBuilder } from "@/components/builder/MixBuilder";

const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600", "700"] });

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full border-b">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <a href="https://moovimiento.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:cursor-pointer shrink-0" aria-label="Ir a moovimiento.com">
            {/* Logo para tema claro */}
            <Image
              src="/moovimiento.png"
              alt="Moovimiento"
              width={128}
              height={32}
              className="block dark:hidden h-8 object-contain"
              style={{ width: 'auto', height: '2rem' }}
              priority
            />
            {/* Logo para tema oscuro */}
            <Image
              src="/moovimiento-white.png"
              alt="Moovimiento"
              width={128}
              height={32}
              className="hidden dark:block h-8 object-contain"
              style={{ width: 'auto', height: '2rem' }}
              priority
            />
            <span className={`${sourceSans.className} text-xl font-semibold leading-none`}>Moovimiento</span>
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
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">Mixs de ⚡<br />Frutos Secos, a tu manera</h1>
            <p className="text-muted-foreground">Armá tu mix de 220g con ingredientes seleccionados.<br />Delivery gratuito a Ciudad Universitaria.</p>
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
            © {new Date().getFullYear()} Generado por {" "}
            <a
              href="https://catsulecorp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline text-sky-500 hover:text-sky-600 cursor-pointer"
            >
              Catsule Corp
            </a>
          </span>
          <span>Hecho en Argentina 🇦🇷</span>
        </div>
      </footer>
    </div>
  );
}
