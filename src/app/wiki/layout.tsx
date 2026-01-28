import { getAllDocs } from "@/lib/docs";
import { WikiShell } from "@/components/WikiShell";

export default async function WikiLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const docs = getAllDocs();

    return (
        <WikiShell docs={docs}>
            {children}
        </WikiShell>
    );
}
