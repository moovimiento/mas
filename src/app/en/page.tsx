import { MainContent } from "@/components/MainContent";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Trail Mixes ⚡ | Moovimiento",
    description: "Build your 220g trail mix with selected ingredients. Free delivery at Ciudad Universitaria.",
    openGraph: {
        title: "Trail Mixes ⚡ | Moovimiento",
        description: "Build your 220g trail mix with selected ingredients. Free delivery at Ciudad Universitaria.",
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        title: "Trail Mixes ⚡ | Moovimiento",
        description: "Build your 220g trail mix with selected ingredients. Free delivery at Ciudad Universitaria.",
    },
};

export default function HomeEn() {
    return <MainContent lang="en" />;
}
