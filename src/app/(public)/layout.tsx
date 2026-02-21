import { LandingHeader } from "@/components/landing/LandingHeader";
import { MegaFooter } from "@/components/landing/MegaFooter";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/30 flex flex-col">
            <LandingHeader />
            <main className="flex-1 mt-20">{children}</main>
            <MegaFooter />
        </div>
    );
}
