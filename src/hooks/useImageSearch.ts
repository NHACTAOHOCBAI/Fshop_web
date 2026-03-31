import { useMutation } from "@tanstack/react-query";
import { searchByImage } from "@/services/products";
import type { ImageSearchResult } from "@/types/product";

interface UseImageSearchOptions {
    onSuccess?: (data: ImageSearchResult[]) => void;
    onError?: (error: Error) => void;
}

export const useImageSearch = (options?: UseImageSearchOptions) => {
    return useMutation({
        mutationFn: async (file: File) => searchByImage(file, 12),
        onSuccess: (data) => {
            options?.onSuccess?.(data);
        },
        onError: (error: unknown) => {
            const errorMessage = error instanceof Error ? error : new Error("Image search failed");
            options?.onError?.(errorMessage);
        },
    });
};
