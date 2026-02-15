
"use client";

import { useState, useRef } from "react";
import { X, Upload } from "lucide-react";
import { uploadFile, getPublicUrl } from "@/lib/storage";
import { toast } from "sonner";

import Image from "next/image";

interface ImageUploadProps {
    bucket: "public-assets" | "secure-docs";
    folder: string;
    defaultImage?: string;
    onImageChange: (url: string) => void;
    className?: string;
}

export function ImageUpload({
    bucket,
    folder,
    defaultImage,
    onImageChange,
    className,
}: ImageUploadProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(defaultImage || null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate type
        if (!file.type.startsWith("image/")) {
            toast.error("Por favor, selecione um arquivo de imagem.");
            return;
        }

        // Validate size (e.g. 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("A imagem deve ter no máximo 5MB.");
            return;
        }

        try {
            setIsUploading(true);
            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            const { error } = await uploadFile(bucket, filePath, file);

            if (error) throw error;

            const publicUrl = getPublicUrl(bucket, filePath);
            setImageUrl(publicUrl);
            onImageChange(publicUrl);
            toast.success("Imagem enviada com sucesso!");
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Erro ao enviar imagem.");
        } finally {
            setIsUploading(false);
            // Reset input so same file can be selected again if needed (though mostly for UX)
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setImageUrl(null);
        onImageChange("");
    };

    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            <div
                className={`relative flex items-center justify-center w-40 h-40 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors ${imageUrl ? 'border-primary' : 'border-muted-foreground/25'
                    }`}
                onClick={() => !isUploading && fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-muted-foreground">Enviando...</span>
                    </div>
                ) : imageUrl ? (
                    <>
                        <div className="relative w-full h-full overflow-hidden rounded-lg">
                            <Image
                                src={imageUrl}
                                alt="Preview"
                                fill
                                className="object-cover"
                                unoptimized // Since usually from external Supabase URL
                            />
                        </div>
                        <button
                            onClick={handleRemove}
                            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow-sm hover:bg-destructive/90 transition-colors"
                            type="button"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="p-3 bg-muted rounded-full">
                            <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium">Carregar foto</span>
                    </div>
                )}
            </div>
        </div>
    );
}
