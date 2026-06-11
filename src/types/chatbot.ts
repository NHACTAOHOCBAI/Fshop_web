export type AiChatRole = "user" | "assistant";

export type AiChatProductSuggestion = {
    id: number;
    name: string;
    price: number;
    image_url?: string;
    category?: string;
    brand?: string;
    category_department?: string;
    colors?: string[];
    sizes?: string[];
    averageRating?: number;
    reviewCount?: number;
    soldQuantity?: number;
};

export type AiChatMessage = {
    id: number;
    role: AiChatRole;
    content: string;
    products: AiChatProductSuggestion[] | null;
    metadata?: {
        imageUri?: string;
        mediaType?: "image" | "audio";
        fileName?: string;
    } | null;
    latencyMs: number | null;
    createdAt: string;
};

export type AiChatSession = {
    id: number;
    title: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastMessageAt: string;
};

export type CreateAiChatSessionPayload = {
    title?: string;
};

export type SendAiChatMessagePayload = {
    message: string;
    historyLimit?: number;
    productIds?: number[];
};

export type SendAiChatMessageResponse = {
    sessionId: number;
    userMessage: AiChatMessage;
    assistantMessage: AiChatMessage;
    products: AiChatProductSuggestion[];
};
