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
        <section className="mx-auto max-w-5xl px-6 py-8 md:py-16 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">Mixs de ⚡<br />Frutos Secos a tu manera</h1>
            <p className="text-muted-foreground">Armá tu mix de 220g con ingredientes seleccionados<br /><span className="hidden lg:inline">Delivery gratuito en <a href="https://www.google.com/maps/place/Pabell%C3%B3n+Argentina+%7C+U.N.C./@-31.4377036,-64.1924841,16z/data=!4m15!1m8!3m7!1s0x9432a2f390acbf49:0x76ac4d048e43a498!2sCdad.+Universitaria,+X5000+C%C3%B3rdoba!3b1!8m2!3d-31.4391398!4d-64.1861887!16s%2Fg%2F11rf7v8hwm!3m5!1s0x9432a2f3f4c88b1f:0x52fd4a14aa234bf!8m2!3d-31.4385451!4d-64.1888835!16s%2Fg%2F1q5bm3s9g" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-foreground transition-colors">Ciudad Universitaria</a></span></p>
          </div>
          <div className="flex justify-center order-first md:order-none -mb-20 -mt-8 md:my-0">
            <a href="https://moovimiento.com" target="_blank" rel="noopener noreferrer" aria-label="Ir a moovimiento.com" className="group inline-block">
              <Image
                src="/moovimiento-emoji.png"
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
            © {new Date().getFullYear()} | Mens sana in corpore sano
          </span>
          <span className="text-right">
            <a
              href="https://gonzalogramagia.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground cursor-pointer transition-colors"
            >
              🇦🇷<br className="md:hidden" />
              <span className="hidden md:inline"> </span>Hecho en Argentina
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
