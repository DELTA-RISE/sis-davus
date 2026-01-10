import Link from "next/link";
import { getAllDocs } from "@/lib/docs";
import { Book, ChevronRight, Search, Menu } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { WikiSidebarNav } from "@/components/WikiSidebarNav";

export default async function WikiLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const docs = getAllDocs();

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-primary/30">
            {/* Sidebar - Glassmorphism */}
            <aside className="hidden lg:flex w-72 flex-col border-r border-white/10 bg-black/20 backdrop-blur-xl relative z-10">
                <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
                            <Book className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                            SisDavus Wiki
                        </span>
                    </Link>
                </div>

                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Buscar docs..."
                            className="w-full h-10 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 text-sm text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 px-4 pb-6 overflow-y-auto wiki-scrollbar">
                    <WikiSidebarNav docs={docs} />
                </div>

                <div className="p-4 border-t border-white/5">
                    <Button variant="ghost" className="w-full justify-start text-neutral-500 hover:text-white hover:bg-white/5" asChild>
                        <Link href="/login">Ir para o App</Link>
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-neutral-950 to-neutral-950">
                {/* Background Noise/Grid */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

                <div className="relative h-full overflow-y-auto wiki-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
}
