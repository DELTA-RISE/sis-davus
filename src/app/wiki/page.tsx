import { getAllDocs } from "@/lib/docs";
import { redirect } from "next/navigation";

export default async function WikiIndex() {
    const docs = getAllDocs();

    if (docs.length > 0) {
        redirect(`/wiki/${docs[0].slug[0]}`);
    }

    return (
        <div className="flex items-center justify-center h-full text-neutral-500">
            Nenhuma documentação encontrada.
        </div>
    );
}
