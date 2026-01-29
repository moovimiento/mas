"use client";

import Image from "next/image";
import { Source_Sans_3 } from "next/font/google";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { MixBuilder } from "@/components/builder/MixBuilder";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { Trust } from "@/components/Trust";
import { dictionary, Language } from "@/lib/dictionary";

const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600", "700"] });

export function MainContent({ lang }: { lang: Language }) {
    const t = dictionary[lang];

    return (
        <div className="min-h-screen flex flex-col">
            <header className="w-full border-b">
                <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
                    <a
                        href="#trust"
                        onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('trust')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex items-center gap-2 hover:cursor-pointer shrink-0"
                        aria-label="Ir a sección de confianza"
                    >
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
                    <nav className="flex items-center gap-5 justify-end">
                        <a
                            href="#faq"
                            onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-sm hover:underline cursor-pointer"
                        >
                            <span className="hidden sm:inline">{t.faq}</span>
                            <span className="sm:hidden">FAQs</span>
                        </a>
                        <div className="flex items-center gap-2">
                            <div className="hidden sm:block">
                                <LanguageToggle currentLang={lang} />
                            </div>
                            <ThemeToggle />
                        </div>
                    </nav>
                </div>
            </header>
            <main className="flex-1">
                <section className="mx-auto max-w-5xl px-6 py-8 md:py-16 grid md:grid-cols-2 gap-10 items-center">
                    <div className="space-y-4 text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-bold leading-tight whitespace-pre-line">{t.hero_title}</h1>
                        <div className="space-y-2">
                            <p className="text-muted-foreground">{t.hero_subtitle.split('\n')[0]}</p>
                            {t.hero_subtitle.includes('\n') && (
                                <p className="text-primary font-bold text-lg animate-in fade-in slide-in-from-left-4 duration-700">
                                    {t.hero_subtitle.split('\n')[1]}
                                </p>
                            )}
                            <p className="text-muted-foreground text-sm">
                                <span className="hidden lg:inline">{t.delivery_free} <a href="https://www.google.com/maps/place/Pabell%C3%B3n+Argentina+%7C+U.N.C./@-31.4377036,-64.1924841,16z/data=!4m15!1m8!3m7!1s0x9432a2f390acbf49:0x76ac4d048e43a498!2sCdad.+Universitaria,+X5000+C%C3%B3rdoba!3b1!8m2!3d-31.4391398!4d-64.1861887!16s%2Fg%2F11rf7v8hwm!3m5!1s0x9432a2f3f4c88b1f:0x52fd4a14aa234bf!8m2!3d-31.4385451!4d-64.1888835!16s%2Fg%2F1q5bm3s9g" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-foreground transition-colors cursor-pointer">{t.location}</a></span>
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-center order-first md:order-none -mb-20 -mt-8 md:my-0">
                        <a href="https://instagram.com/moovimiento" target="_blank" rel="noopener noreferrer" aria-label="Ir a Instagram de Moovimiento" className="group relative inline-block">
                            {/* Even Larger and More Diffused White Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-white/30 dark:bg-white/10 rounded-full blur-[140px] group-hover:bg-white/50 transition-colors duration-500" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-white/40 dark:bg-white/20 rounded-full blur-[100px]" />
                            <Image
                                src="/moovimiento-emoji.png"
                                alt="Moovimiento - Hero"
                                width={720}
                                height={480}
                                className="relative w-auto h-auto object-cover cursor-pointer transition-transform duration-300 ease-out group-hover:scale-105"
                                style={{ clipPath: 'inset(0 0 10% 0)' }}
                                priority
                            />
                        </a>
                    </div>
                </section>
                <div id="mix-builder" className="scroll-mt-24">
                    <MixBuilder lang={lang} />
                </div>
                <FAQ lang={lang} />
                <Trust lang={lang} />
                <Pricing lang={lang} />
            </main>
            <footer className="border-t">
                <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted-foreground flex flex-col gap-y-0.5 sm:gap-y-2">
                    {/* Fila 1: Copyright (izq) y Bandera (der) en Mobile / Contenido principal en Desktop */}
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center text-sm">
                            <span>© {new Date().getFullYear()}</span>
                            <span className="hidden sm:inline mx-1">|</span>
                            <span className="hidden sm:inline">Mens sana in corpore sano</span>
                        </div>

                        {/* Bandera en Mobile */}
                        <span className="sm:hidden text-sm">🇦🇷</span>

                        {/* Made in Desktop (Single line) */}
                        <div className="hidden sm:block text-sm">
                            <a
                                href={lang === 'en' ? "https://gonzalogramagia.com/en" : "https://gonzalogramagia.com/"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-foreground cursor-pointer transition-colors whitespace-nowrap"
                            >
                                {t.made_in} 🇦🇷
                            </a>
                        </div>
                    </div>

                    {/* Fila 2: Slogan (izq) y Texto Made in (der) - Solo Mobile */}
                    <div className="flex sm:hidden items-center justify-between w-full text-sm">
                        <span>Mens sana in corpore sano</span>
                        <a
                            href={lang === 'en' ? "https://gonzalogramagia.com/en" : "https://gonzalogramagia.com/"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground cursor-pointer transition-colors whitespace-nowrap"
                        >
                            {t.made_in}
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
