"use client";

import { dictionary, Language } from "@/lib/dictionary";
import Image from "next/image";

interface TrustProps {
    lang: Language;
}

export function Trust({ lang }: TrustProps) {
    const t = dictionary[lang];

    return (
        <section id="trust" className="w-full py-16 bg-primary/5 border-y">
            <div className="mx-auto max-w-4xl px-6 text-center">
                <div className="mb-8 flex justify-center">
                    {/* Using the same logo as header but larger or just text? User prompt says "Logo" then "Hacer pedido" then "Elegido por..." 
                         I'll use the moovimiento-emoji.png or just the icon. Let's use the icon for trust.
                     */}
                    <div className="relative h-16 w-16 md:h-20 md:w-20">
                        <Image
                            src="/moovimiento.png" // Using the light mode logo, assuming it works or styled accordingly. 
                            // Actually MainContent uses different logos for dark/light. I should do same or just use one that works.
                            alt="Moovimiento"
                            fill
                            className="object-contain block dark:hidden"
                        />
                        <Image
                            src="/moovimiento-white.png"
                            alt="Moovimiento"
                            fill
                            className="object-contain hidden dark:block"
                        />
                    </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    {t.trust_slogan}
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                    {t.trust_sub}
                </p>

                <div className="flex flex-col items-center gap-4">
                    {/* Button and footer text removed as requested */}
                </div>
            </div>
        </section>
    );
}
