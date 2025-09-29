import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full border-b">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-yellow-400" />
            <span className="text-xl font-semibold">Moovimiento</span>
          </div>
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
            <Image src="/next.svg" alt="Moovimiento" width={240} height={80} className="dark:invert" />
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted-foreground flex items-center justify-between">
          <span>© {new Date().getFullYear()} Moovimiento</span>
          <span>Hecho en Argentina 🇦🇷</span>
        </div>
      </footer>
    </div>
  );
}
