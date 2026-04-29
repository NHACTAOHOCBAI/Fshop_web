import { useMutation } from "@tanstack/react-query";
import { transcribeVoice } from "@/services/products";
import type { VoiceTranscriptionResponse } from "@/types/product";

type UseVoiceSearchOptions = {
    onSuccess?: (data: VoiceTranscriptionResponse) => void;
    onError?: (error: Error) => void;
};

export const useVoiceSearch = (options?: UseVoiceSearchOptions) => {
    return useMutation({
        mutationFn: async (file: File) => transcribeVoice(file),
        onSuccess: (data) => {
            options?.onSuccess?.(data);
        },
        onError: (error: unknown) => {
            const normalizedError = error instanceof Error ? error : new Error("Voice search failed");
            if (normalizedError.message.toLowerCase().includes("timeout")) {
                normalizedError.message = "Xử lý giọng nói hơi lâu. Vui lòng thử file ngắn hơn hoặc thử lại sau.";
            }
            options?.onError?.(normalizedError);
        },
    });
};
