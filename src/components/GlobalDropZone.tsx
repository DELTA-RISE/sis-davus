"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
// import { useElectron } from "@/hooks/use-electron";
import { FileDropWizard } from "@/components/FileDropWizard";

export function GlobalDropZone() {
    const [isDragging, setIsDragging] = useState(false);
    const router = useRouter();
    // const { isElectron, getFilePath } = useElectron(); // Removed

    // Wizard State
    const [droppedFile, setDroppedFile] = useState<File | null>(null);
    const [wizardOpen, setWizardOpen] = useState(false);

    useEffect(() => {
        const processFileDrop = (file: File) => {
            const name = file.name;
            const extension = name.split(".").pop()?.toLowerCase();

            // Allowed Extensions
            const allowed = ["xml", "jpg", "jpeg", "png", "pdf", "docx", "doc", "xlsx", "xls"];

            if (!allowed.includes(extension || "")) {
                toast.warning("Tipo de arquivo não suportado.");
                return;
            }

            if (extension === "xml") {
                // XML NFe Flow - Redirect to import (Assuming we will create this page or it exists)
                // Ideally we should pass the file object or read content here.
                // For now, let's just warn as we can't easily pass file objects via URL
                toast.info("Nota Fiscal detectada. Utilize a página de importação.");
                router.push('/estoque/importar');
                return;
            }

            setDroppedFile(file);
            setWizardOpen(true);
        };

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isDragging) setIsDragging(true);
        };

        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            // Only hide if leaving the window
            if (e.clientX === 0 && e.clientY === 0) {
                setIsDragging(false);
            }
        };

        const handleDrop = async (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                // Web: We use the File object directly. Path is empty or fake.
                processFileDrop(file);
            }
        };

        window.addEventListener("dragover", handleDragOver);
        window.addEventListener("dragleave", handleDragLeave);
        window.addEventListener("drop", handleDrop);

        return () => {
            window.removeEventListener("dragover", handleDragOver);
            window.removeEventListener("dragleave", handleDragLeave);
            window.removeEventListener("drop", handleDrop);
        };
    }, [isDragging, router]);

    // Removed strict isElectron check return null

    return (
        <>
            {isDragging && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all animate-in fade-in cursor-copy">
                    <div className="bg-background p-10 rounded-xl border-2 border-dashed border-primary shadow-2xl flex flex-col items-center gap-4">
                        <div className="p-4 bg-primary/10 rounded-full">
                            <UploadCloud className="w-16 h-16 text-primary animate-bounce" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">Solte o arquivo aqui</h2>
                            <p className="text-muted-foreground">Detectar ações automáticas para o arquivo</p>
                        </div>
                    </div>
                </div>
            )}

            <FileDropWizard
                isOpen={wizardOpen}
                onClose={() => setWizardOpen(false)}
                file={droppedFile}
            />
        </>
    );
}
