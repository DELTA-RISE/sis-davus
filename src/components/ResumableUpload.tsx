"use client";

import React, { useState, useRef, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, X, CheckCircle, FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResumableUploadProps {
    bucketName: 'public-assets' | 'secure-docs';
    folderPath?: string;
    onUploadComplete?: (url: string) => void;
    allowedTypes?: string[];
    maxSizeMB?: number;
}

export function ResumableUpload({
    bucketName,
    folderPath = '',
    onUploadComplete,
    allowedTypes = ['image/*', 'application/pdf'],
    maxSizeMB = 50
}: ResumableUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];

            // Basic validation
            if (maxSizeMB && selectedFile.size > maxSizeMB * 1024 * 1024) {
                toast.error(`Arquivo muito grande. Máximo permitido: ${maxSizeMB}MB`);
                return;
            }

            setFile(selectedFile);
            setProgress(0);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        try {
            setUploading(true);

            // Simulate progress start
            setProgress(10);

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

            const { error } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (error) throw error;

            // Simulate progress end
            setProgress(100);

            // For public buckets, we can get public URL. For private ones, we'd need a signed URL.
            // Assuming public-assets is public, secure-docs is private.
            // But `getPublicUrl` returns a URL regardless, it just might not be accessible if private without signing.
            // If we need signed URL for private docs:
            let finalUrl = '';
            if (bucketName === 'public-assets') {
                const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filePath);
                finalUrl = publicUrl;
            } else {
                // For private docs, return the path or signed url? 
                // Usually we store the path in DB and generate signed URL on demand.
                // Let's return the path for now for secure docs.
                finalUrl = filePath;
            }

            toast.success('Upload concluído com sucesso!');

            if (onUploadComplete) {
                onUploadComplete(finalUrl);
            }

            // Keep file shown as successes? Or clear? 
            // Let's keep it shown as success state.
        } catch (err: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const error = err as any;
            console.error('Upload failed:', error);
            toast.error(`Erro no upload: ${error.message}`);
            setUploading(false);
            setProgress(0);
        } finally {
            // Stop loading spinner if we want, but if success we keep 100%
            if (progress !== 100) {
                setUploading(false);
            }
        }
    };

    const handleCancel = () => {
        setFile(null);
        setProgress(0);
        setUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full max-w-md p-4 border border-dashed rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
            {!file ? (
                <div
                    className="flex flex-col items-center justify-center cursor-pointer py-8"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">Clique para selecionar</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">
                        Máximo: {maxSizeMB}MB
                    </p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept={allowedTypes?.join(',')}
                        onChange={handleFileSelect}
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-background/50 p-2 rounded-md">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                            <FileIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        {!uploading && progress !== 100 && (
                            <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8">
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {uploading && (
                        <div className="space-y-1">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-right text-muted-foreground">{progress.toFixed(0)}%</p>
                        </div>
                    )}

                    {!uploading && progress !== 100 && (
                        <Button onClick={handleUpload} className="w-full" disabled={uploading}>
                            Enviar Arquivo
                        </Button>
                    )}

                    {progress === 100 && (
                        <div className="flex flex-col items-center justify-center text-green-500 gap-2 py-2 animate-in fade-in">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                <span className="text-sm font-medium">Enviado com sucesso!</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleCancel} className="w-full mt-2">
                                Enviar outro arquivo
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
