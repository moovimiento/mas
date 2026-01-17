"use client";

import { dictionary, Language } from "@/lib/dictionary";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface FAQProps {
    lang: Language;
}

export function FAQ({ lang }: FAQProps) {
    const t = dictionary[lang];
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(t.faq_contact_email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const faqs = [
        { q: t.faq_q1, a: t.faq_a1 },
        { q: t.faq_q2, a: t.faq_a2 },
        { q: t.faq_q3, a: t.faq_a3 },
        { q: t.faq_q4, a: t.faq_a4 },
    ];

    return (
        <section id="faq" className="w-full py-16 md:py-24">
            <div className="mx-auto max-w-3xl px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">{t.faq_title_full}</h2>

                    <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors border-b border-muted-foreground/30 hover:border-foreground group cursor-pointer"
                    >
                        <span>{t.faq_contact_email}</span>
                        {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <Copy className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        )}
                    </button>
                </div>

                <div className="space-y-8">
                    {faqs.map((item, index) => (
                        <div key={index} className="border-b pb-6 last:border-0">
                            <h3 className="text-lg font-semibold mb-3">{item.q}</h3>
                            <p className="text-muted-foreground leading-relaxed">{item.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
