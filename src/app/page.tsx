import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Source_Sans_3 } from "next/font/google";

const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600", "700"] });

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full border-b">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" aria-label="Ir al inicio">
            {/* Logo para tema claro */}
            <Image
              src="/moovimiento.png"
              alt="Moovimiento"
              width={128}
              height={32}
              className="block dark:hidden h-8 w-auto"
              priority
            />
            {/* Logo para tema oscuro */}
            <Image
              src="/moovimiento-white.png"
              alt="Moovimiento"
              width={128}
              height={32}
              className="hidden dark:block h-8 w-auto"
              priority
            />
            <span className={`${sourceSans.className} text-xl font-semibold leading-none`}>Moovimiento</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/builder"><Button size="sm">Armá tu mix</Button></Link>
            <Link href="/account"><Button variant="outline" size="sm">Mi cuenta</Button></Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">Mixs de frutos secos, a tu manera</h1>
            <p className="text-muted-foreground">Armá tu mix de 220g con ingredientes seleccionados. Delivery en Ciudad Universitaria y alrededores.</p>
            <div className="flex gap-3">
              <Link href="/builder"><Button size="lg">Empezar ahora</Button></Link>
              <Link href="/ofertas"><Button variant="outline" size="lg">Promos</Button></Link>
            </div>
          </div>
          <div className="flex justify-center">
            <Image
              src="/Capsule Corp.png"
              alt="Moovimiento - Hero"
              width={520}
              height={360}
              className="rounded-lg shadow-sm w-auto h-auto object-cover"
              priority
            />
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted-foreground flex items-center justify-between">
          <span>
            © {new Date().getFullYear()} Desarrollado por {" "}
            <a
              href="https://catsulecorp.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline text-sky-500 hover:text-sky-600"
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
