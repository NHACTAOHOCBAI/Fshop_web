import { useMutation } from "@tanstack/react-query";
import { searchByVoice } from "@/services/products";
import type { VoiceSearchResponse } from "@/types/product";

type UseVoiceSearchOptions = {
    onSuccess?: (data: VoiceSearchResponse) => void;
    onError?: (error: Error) => void;
};

export const useVoiceSearch = (options?: UseVoiceSearchOptions) => {
    return useMutation({
        mutationFn: async (file: File) => searchByVoice(file),
        onSuccess: (data) => {
            options?.onSuccess?.(data);
        },
        onError: (error: unknown) => {
            const normalizedError = error instanceof Error ? error : new Error("Voice search failed");
            options?.onError?.(normalizedError);
        },
    });
};
