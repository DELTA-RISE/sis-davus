
import { supabase } from './supabase';

type StorageBucket = 'public-assets' | 'secure-docs';

/**
 * Uploads a file to a specific bucket.
 * @param bucket - The storage bucket to upload to.
 * @param path - The file path (e.g., 'folder/image.png').
 * @param file - The file body (File, Blob, ArrayBuffer, etc.).
 * @returns The data or error from Supabase.
 */
export const uploadFile = async (
    bucket: StorageBucket,
    path: string,
    file: File | Blob | ArrayBuffer
) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
    });

    if (error) {
        console.error(`Error uploading to ${bucket}/${path}:`, error);
        return { data: null, error };
    }

    return { data, error: null };
};

/**
 * Deletes a file from a specific bucket.
 * @param bucket - The storage bucket.
 * @param path - The file path to delete.
 */
export const deleteFile = async (bucket: StorageBucket, path: string) => {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
        console.error(`Error deleting from ${bucket}/${path}:`, error);
        return { success: false, error };
    }

    return { success: true, error: null };
};

/**
 * Gets a public URL for a file (only works for public buckets).
 * @param bucket - The storage bucket.
 * @param path - The file path.
 * @returns The public URL string.
 */
export const getPublicUrl = (bucket: StorageBucket, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
};

/**
 * Gets a signed URL for a file (for private buckets).
 * @param bucket - The storage bucket.
 * @param path - The file path.
 * @param expiresIn - Expiration time in seconds (default 60).
 * @returns The signed URL or null if error.
 */
export const getSignedUrl = async (bucket: StorageBucket, path: string, expiresIn = 60) => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);

    if (error) {
        console.error(`Error getting signed URL for ${bucket}/${path}:`, error);
        return null;
    }

    return data.signedUrl;
};

/**
 * Gets an optimized URL for an image using Supabase Image Transformations.
 * @param bucket - The storage bucket.
 * @param path - The file path.
 * @param options - Transformation options (width, height, quality, resize).
 * @returns The optimized public URL.
 */
export const getOptimizedImageUrl = (
    bucket: StorageBucket,
    path: string,
    options: { width?: number; height?: number; quality?: number; resize?: 'cover' | 'contain' | 'fill' } = {}
) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
        transform: {
            width: options.width,
            height: options.height,
            quality: options.quality || 80,
            resize: options.resize || 'cover',
        },
    });
    return data.publicUrl;
};
