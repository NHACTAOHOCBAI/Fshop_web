export type ChatRole = "user" | "admin";
export type ChatAttachmentType = "image" | "voice" | "video" | "product" | "order";

export type ChatProductAttachment = {
    id: number;
    name: string;
    price: number;
    imageUrl?: string | null;
    brandName?: string | null;
    categoryName?: string | null;
    department?: string | null;
};

export type ChatOrderAttachment = {
    id: number;
    totalAmount: number;
    status: string;
    createdAt: string;
    itemsCount: number;
    imageUrl?: string | null;
};

export type ChatAttachment = {
    type: ChatAttachmentType;
    url?: string;
    publicId?: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
    dimensions?: {
        width: number;
        height: number;
    };
    format?: string;
    product?: ChatProductAttachment;
    order?: ChatOrderAttachment;
};

export type ChatParticipant = {
    id: number;
    fullName: string | null;
    email?: string;
    avatar: string | null;
    role: ChatRole;
};

export type ChatConversation = {
    id: number;
    customer: ChatParticipant;
    assignedAdmin?: ChatParticipant | null;
    status: "OPEN" | "HANDLING";
    createdAt: string;
    lastMessageAt: string;
};

export type ChatMessage = {
    id: number;
    conversationId: number;
    sender: ChatParticipant;
    senderRole: ChatRole;
    content: string | null;
    attachments: ChatAttachment[] | null;
    isDelivered?: boolean;
    isSeen: boolean;
    createdAt: string;
};

export type SendChatMessagePayload = {
    conversationId: number;
    content?: string;
    images?: File[];
    voice?: File | null;
    video?: File | null;
    productIds?: number[];
    orderIds?: number[];
};
