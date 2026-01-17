import { Instagram } from "lucide-react";

export function FloatingInstagram() {
    return (
        <a
            href="https://www.instagram.com/moovimiento"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex fixed bottom-8 left-8 z-50 items-center justify-center p-3 rounded-full bg-gradient-to-tr from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
            aria-label="Instagram Moovimiento"
        >
            <Instagram className="w-6 h-6" />
        </a>
    );
}
