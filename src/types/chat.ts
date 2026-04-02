export type ChatRole = "user" | "admin";
export type ChatAttachmentType = "image" | "voice" | "video";

export type ChatAttachment = {
    type: ChatAttachmentType;
    url: string;
    publicId: string;
    fileName?: string;
    fileSize?: number;
    duration?: number;
    dimensions?: {
        width: number;
        height: number;
    };
    format?: string;
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
};
