"use client";

import { dictionary, Language } from "@/lib/dictionary";

interface PricingProps {
    lang: Language;
}

export function Pricing({ lang }: PricingProps) {
    const t = dictionary[lang];

    const tiers = [
        {
            title: t.pricing_tier_1_title,
            price: t.pricing_tier_1_price,
            desc: t.pricing_tier_1_desc,
        },
        {
            title: t.pricing_tier_2_title,
            price: t.pricing_tier_2_price,
            desc: t.pricing_tier_2_desc,
            highlight: true, // Maybe distinct style
        },
        {
            title: t.pricing_tier_3_title,
            price: t.pricing_tier_3_price,
            desc: t.pricing_tier_3_desc,
        },
    ];

    const scrollToBuilder = () => {
        // Find the builder element and scroll to it
        const builder = document.getElementById('mix-builder');
        if (builder) {
            builder.scrollIntoView({ behavior: 'smooth' });
        } else {
            // Fallback if ID not found
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <section id="pricing" className="w-full py-16 md:py-24 bg-muted/30">
            <div className="mx-auto max-w-5xl px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">{t.pricing_title}</h2>
                    <p className="text-lg text-muted-foreground">{t.pricing_subtitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {tiers.map((tier, index) => (
                        <div
                            key={index}
                            className={`flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md ${tier.highlight ? 'border-primary/50 shadow-md relative' : ''}`}
                        >
                            {tier.highlight && (
                                <div className="absolute -top-4 left-0 right-0 mx-auto w-fit px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                                    Popular
                                </div>
                            )}
                            <div className="mb-4">
                                <h3 className="text-xl font-semibold">{tier.title}</h3>
                                <p className={`text-sm mt-2 min-h-[40px] ${tier.highlight ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 'text-muted-foreground'}`}>{tier.desc}</p>
                            </div>
                            <div className="mb-6">
                                <span className="text-3xl font-bold">{tier.price}</span>
                            </div>

                            <button
                                onClick={() => {
                                    const quantities = [1, 5, 15];
                                    const qty = quantities[index];
                                    // Dispatch custom event for MixBuilder
                                    if (typeof window !== 'undefined') {
                                        window.dispatchEvent(new CustomEvent('set-mix-quantity', { detail: { quantity: qty } }));
                                    }
                                    scrollToBuilder();
                                }}
                                className={`w-full py-2.5 rounded-lg font-medium transition-colors mb-6 cursor-pointer ${tier.highlight
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                    }`}
                            >
                                {t.pricing_buy_btn}
                            </button>

                            <div className="mt-auto pt-6 border-t text-sm space-y-2">
                                <p className="font-semibold text-muted-foreground/80">{t.pricing_includes}</p>
                                <ul className="space-y-1 text-muted-foreground">
                                    {t.pricing_ingredients_list.split(',').map((item, i) => (
                                        <li key={i} className="flex items-start">
                                            <span className="mr-2 text-green-500">✓</span>
                                            {item.trim()}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
