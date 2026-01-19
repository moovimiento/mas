"use client";

import { useRouter } from "next/navigation";
import { Language } from "@/lib/dictionary";

interface LanguageToggleProps {
    currentLang: Language;
}

export function LanguageToggle({ currentLang }: LanguageToggleProps) {
    const router = useRouter();

    return (
        <div className="flex items-center bg-muted/50 border rounded-md p-0.5 h-9">
            <button
                onClick={() => currentLang !== "es" && router.push("/")}
                aria-label="Cambiar a Español"
                className={`flex items-center justify-center px-2.5 h-full rounded-sm text-[10px] font-bold transition-all duration-200 ${currentLang === "es"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground cursor-pointer"
                    }`}
            >
                ES
            </button>
            <button
                onClick={() => currentLang !== "en" && router.push("/en")}
                aria-label="Switch to English"
                className={`flex items-center justify-center px-2.5 h-full rounded-sm text-[10px] font-bold transition-all duration-200 ${currentLang === "en"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground cursor-pointer"
                    }`}
            >
                EN
            </button>
        </div>
    );
}
