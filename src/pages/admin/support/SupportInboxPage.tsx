import { useEffect, useMemo, useRef, useState } from "react";
import { AudioLines, CheckCheck, FileVideo, Image as ImageIcon, Loader2, MessageCircle, Send, Store, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/useAuth";
import { useAdminChatRealtime, useAdminConversations, useChatRealtime, useConversationMessages, useMarkConversationSeen, useSendChatMessage } from "@/hooks/useChats";
import { authStorage } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { ChatAttachment, ChatConversation, ChatMessage } from "@/types/chat";
import type { User } from "@/types/user";

const formatTime = (iso: string) => {
    const date = new Date(iso);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const getConversationLabel = (conversation: ChatConversation) => {
    return conversation.customer.fullName?.trim() || conversation.customer.email || `Khách #${conversation.customer.id}`;
};

const getAttachmentLabel = (attachment: ChatAttachment) => {
    switch (attachment.type) {
        case "image":
            return "Ảnh";
        case "voice":
            return "Audio";
        case "video":
            return "Video";
        default:
            return "Tệp";
    }
};

const SupportInboxPage = () => {
    const [search, setSearch] = useState("");
    const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
    const [draft, setDraft] = useState("");
    const [imageItems, setImageItems] = useState<Array<{ file: File; previewUrl: string }>>([]);
    const [voiceFile, setVoiceFile] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);

    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const voiceInputRef = useRef<HTMLInputElement | null>(null);
    const videoInputRef = useRef<HTMLInputElement | null>(null);
    const typingTimeoutRef = useRef<number | null>(null);
    const seenConversationIdRef = useRef<number | null>(null);
    const messagesScrollRef = useRef<HTMLDivElement | null>(null);
    const shouldStickToBottomRef = useRef(true);
    const imageItemsRef = useRef(imageItems);

    const cachedUser = authStorage.getUser<User>();
    const { data: meResponse } = useMe();
    const currentUser = meResponse?.data ?? cachedUser;

    const conversationsQuery = useAdminConversations(true);
    const conversations = useMemo(() => conversationsQuery.data?.data ?? [], [conversationsQuery.data]);

    useAdminChatRealtime(true);

    const filteredConversations = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) {
            return conversations;
        }

        return conversations.filter((conversation) => {
            const customerName = getConversationLabel(conversation).toLowerCase();
            const customerEmail = conversation.customer.email?.toLowerCase() ?? "";
            const assignedName = conversation.assignedAdmin?.fullName?.toLowerCase() ?? "";
            return customerName.includes(keyword) || customerEmail.includes(keyword) || assignedName.includes(keyword);
        });
    }, [conversations, search]);

    const activeConversationId = selectedConversationId ?? conversations[0]?.id ?? null;

    const selectedConversation = useMemo(() => {
        return conversations.find((conversation) => conversation.id === activeConversationId) ?? null;
    }, [activeConversationId, conversations]);

    const conversationId = selectedConversation?.id;

    const messagesQuery = useConversationMessages(conversationId ?? undefined, Boolean(conversationId));
    const messages = useMemo(() => messagesQuery.data?.data ?? [], [messagesQuery.data]);

    const sendMessageMutation = useSendChatMessage();
    const markSeenMutation = useMarkConversationSeen();

    const { isSupportTyping, emitTyping } = useChatRealtime({
        conversationId: conversationId ?? undefined,
        enabled: Boolean(conversationId),
        currentUserId: currentUser?.id,
    });

    const isLoading = conversationsQuery.isLoading || messagesQuery.isLoading;
    useEffect(() => {
        imageItemsRef.current = imageItems;
    }, [imageItems]);

    useEffect(() => {
        return () => {
            imageItemsRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
        };
    }, []);

    const imageFiles = useMemo(() => imageItems.map((item) => item.file), [imageItems]);

    const isSending = sendMessageMutation.isPending;
    const hasAttachments = imageItems.length > 0 || Boolean(voiceFile) || Boolean(videoFile);
    const canSend = Boolean(conversationId) && (draft.trim().length > 0 || hasAttachments) && !isSending;

    useEffect(() => {
        if (!conversationId || seenConversationIdRef.current === conversationId) {
            return;
        }

        seenConversationIdRef.current = conversationId;
        markSeenMutation.mutate(conversationId);
    }, [conversationId, markSeenMutation]);

    useEffect(() => {
        shouldStickToBottomRef.current = true;
    }, [conversationId]);

    useEffect(() => {
        const container = messagesScrollRef.current;
        if (!container || !shouldStickToBottomRef.current) {
            return;
        }

        container.scrollTo({ top: container.scrollHeight, behavior: "auto" });
    }, [conversationId, messages.length, isSupportTyping]);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                window.clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    const syncTyping = (value: string) => {
        setDraft(value);
        emitTyping(Boolean(value.trim()));

        if (typingTimeoutRef.current) {
            window.clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = window.setTimeout(() => {
            emitTyping(false);
        }, 1200);
    };

    const appendImages = (files: FileList | null) => {
        if (!files || files.length === 0) {
            return;
        }

        const incoming = Array.from(files).map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file),
        }));

        setImageItems((prev) => {
            const next = [...prev, ...incoming];
            const kept = next.slice(0, 5);
            const dropped = next.slice(5);

            if (dropped.length > 0) {
                toast.warning("Chỉ được gửi tối đa 5 ảnh mỗi lần.");
                dropped.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
            }

            return kept;
        });
    };

    const removeImageItem = (index: number) => {
        setImageItems((prev) => {
            const target = prev[index];
            if (target) {
                URL.revokeObjectURL(target.previewUrl);
            }

            return prev.filter((_, currentIndex) => currentIndex !== index);
        });
    };

    const clearComposer = () => {
        setDraft("");
        imageItemsRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
        setImageItems([]);
        setVoiceFile(null);
        setVideoFile(null);
        emitTyping(false);
    };

    const handleSend = () => {
        if (!conversationId || (!draft.trim() && !hasAttachments)) {
            return;
        }

        sendMessageMutation.mutate(
            {
                conversationId,
                content: draft.trim() || undefined,
                images: imageFiles.length > 0 ? imageFiles : undefined,
                voice: voiceFile,
                video: videoFile,
            },
            {
                onSuccess: () => {
                    clearComposer();
                },
                onError: (error: Error) => {
                    toast.error(error.message || "Không thể gửi tin nhắn.");
                },
            }
        );
    };

    const renderAttachments = (attachments: ChatAttachment[]) => {
        return (
            <div className="mt-2 space-y-2">
                {attachments.map((attachment) => {
                    if (attachment.type === "image") {
                        return (
                            <a key={attachment.publicId} href={attachment.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-white/10">
                                <img src={attachment.url} alt={attachment.fileName ?? "Ảnh đính kèm"} className="max-h-56 w-full object-cover" />
                            </a>
                        );
                    }

                    if (attachment.type === "voice") {
                        return (
                            <div key={attachment.publicId} className="rounded-xl border border-slate-200 bg-white p-3">
                                <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                                    <AudioLines className="size-3.5" />
                                    <span>{attachment.fileName ?? "Tệp âm thanh"}</span>
                                    <span>•</span>
                                    <span>{getAttachmentLabel(attachment)}</span>
                                </div>
                                <audio controls className="w-full">
                                    <source src={attachment.url} />
                                </audio>
                            </div>
                        );
                    }

                    return (
                        <div key={attachment.publicId} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <video controls className="max-h-72 w-full bg-black">
                                <source src={attachment.url} />
                            </video>
                            <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-500">
                                <span>{attachment.fileName ?? "Video đính kèm"}</span>
                                <span>{getAttachmentLabel(attachment)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderComposerAttachments = () => {
        if (!hasAttachments) {
            return null;
        }

        return (
            <div className="mb-3 flex flex-wrap gap-2">
                {imageItems.map(({ file, previewUrl }, index) => (
                    <div key={`${file.name}-${index}`} className="relative w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        <img src={previewUrl} alt={file.name} className="h-24 w-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/55 px-2 py-1 text-[11px] text-white backdrop-blur-sm">
                            <span className="min-w-0 truncate">{file.name}</span>
                            <button type="button" onClick={() => removeImageItem(index)} className="shrink-0 text-white/80 transition-colors hover:text-white">
                                <X className="size-3.5" />
                            </button>
                        </div>
                    </div>
                ))}

                {voiceFile ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                        <AudioLines className="size-3.5 text-primary" />
                        <span className="max-w-40 truncate">{voiceFile.name}</span>
                        <button type="button" onClick={() => setVoiceFile(null)} className="text-slate-400 transition-colors hover:text-slate-700">
                            <X className="size-3.5" />
                        </button>
                    </span>
                ) : null}

                {videoFile ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                        <FileVideo className="size-3.5 text-primary" />
                        <span className="max-w-40 truncate">{videoFile.name}</span>
                        <button type="button" onClick={() => setVideoFile(null)} className="text-slate-400 transition-colors hover:text-slate-700">
                            <X className="size-3.5" />
                        </button>
                    </span>
                ) : null}
            </div>
        );
    };

    const handleMessagesScroll = () => {
        const container = messagesScrollRef.current;
        if (!container) {
            return;
        }

        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        shouldStickToBottomRef.current = distanceFromBottom < 96;
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] min-h-180 w-full gap-4">
            <aside className="flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 p-4">
                    <div className="flex items-center gap-2 text-slate-900">
                        <Store className="size-4 text-primary" />
                        <h1 className="text-lg font-semibold">Hộp thư hỗ trợ</h1>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Quản lý các cuộc trò chuyện từ khách hàng.</p>
                    <div className="mt-3">
                        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm khách hàng..." />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {conversationsQuery.isLoading ? (
                        <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Đang tải cuộc trò chuyện...
                        </div>
                    ) : filteredConversations.length > 0 ? (
                        filteredConversations.map((conversation) => {
                            const active = conversation.id === activeConversationId;

                            return (
                                <button
                                    key={conversation.id}
                                    type="button"
                                    onClick={() => setSelectedConversationId(conversation.id)}
                                    className={cn(
                                        "mb-2 w-full rounded-2xl border px-3 py-3 text-left transition-colors",
                                        active ? "border-primary/30 bg-primary/5" : "border-slate-200 bg-white hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">{getConversationLabel(conversation)}</p>
                                            <p className="mt-1 truncate text-xs text-slate-500">{conversation.customer.email ?? conversation.customer.fullName ?? `Khách #${conversation.customer.id}`}</p>
                                        </div>
                                        <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium", conversation.status === "HANDLING" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}>{conversation.status === "HANDLING" ? "Đang xử lý" : "Mới"}</span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                                        <span>{conversation.assignedAdmin?.fullName ? `Phụ trách: ${conversation.assignedAdmin.fullName}` : "Chưa được gán"}</span>
                                        <span>{formatTime(conversation.lastMessageAt)}</span>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                            Không có cuộc trò chuyện phù hợp.
                        </div>
                    )}
                </div>
            </aside>

            <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {selectedConversation ? (
                    <>
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 text-slate-900">
                                    <MessageCircle className="size-4 text-primary" />
                                    <h2 className="truncate text-lg font-semibold">{getConversationLabel(selectedConversation)}</h2>
                                </div>
                                <p className="mt-1 text-sm text-slate-500">{selectedConversation.customer.email ?? selectedConversation.customer.fullName ?? `Khách #${selectedConversation.customer.id}`}</p>
                            </div>
                            <div className="text-right text-xs text-slate-500">
                                <p>{selectedConversation.status === "HANDLING" ? "Đang được xử lý" : "Chờ hỗ trợ"}</p>
                                <p className="mt-1">Cập nhật lúc {formatTime(selectedConversation.lastMessageAt)}</p>
                            </div>
                        </div>

                        <div className="flex min-h-0 flex-1 flex-col">
                            <div ref={messagesScrollRef} onScroll={handleMessagesScroll} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                                {messagesQuery.isError ? (
                                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                        Không tải được tin nhắn. {(messagesQuery.error as Error | undefined)?.message || "Vui lòng thử lại sau."}
                                    </div>
                                ) : null}

                                {isLoading ? (
                                    <div className="flex h-full items-center justify-center py-20 text-slate-500">
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Đang tải tin nhắn...
                                    </div>
                                ) : messages.length > 0 ? (
                                    messages.map((message: ChatMessage) => {
                                        const isAdminMessage = currentUser?.id ? message.sender.id === currentUser.id : message.senderRole === "admin";

                                        return (
                                            <div key={message.id} className={`flex ${isAdminMessage ? "justify-end" : "justify-start"}`}>
                                                <div className={cn("max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm", isAdminMessage ? "bg-primary text-primary-foreground" : "border border-slate-200 bg-slate-50 text-slate-700")}>
                                                    {message.content ? <p className="whitespace-pre-wrap">{message.content}</p> : null}
                                                    {message.attachments && message.attachments.length > 0 ? renderAttachments(message.attachments) : null}
                                                    <div className={cn("mt-1 flex items-center gap-1.5 text-[11px]", isAdminMessage ? "text-primary-foreground/80" : "text-slate-400")}>
                                                        <span>{formatTime(message.createdAt)}</span>
                                                        {isAdminMessage && message.isSeen ? <CheckCheck className="size-3.5" /> : null}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                        Chưa có tin nhắn nào trong cuộc trò chuyện này.
                                    </div>
                                )}

                                {isSupportTyping ? (
                                    <div className="flex justify-start">
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">Khách đang nhập...</div>
                                    </div>
                                ) : null}
                            </div>

                            <div className="border-t border-slate-100 px-5 py-4">
                                <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                                    <MessageCircle className="size-3.5" />
                                    Tin nhắn sẽ được gửi đến khách hàng.
                                </div>

                                {renderComposerAttachments()}

                                <div className="space-y-2">
                                    <Textarea
                                        value={draft}
                                        onChange={(event) => syncTyping(event.target.value)}
                                        placeholder="Nhập phản hồi cho khách..."
                                        className="min-h-24 resize-none"
                                    />

                                    <div className="flex flex-wrap items-center gap-2">
                                        <input
                                            ref={imageInputRef}
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                            multiple
                                            className="hidden"
                                            onChange={(event) => {
                                                appendImages(event.target.files);
                                                event.currentTarget.value = "";
                                            }}
                                        />
                                        <input
                                            ref={voiceInputRef}
                                            type="file"
                                            accept="audio/mpeg,audio/wav,audio/webm,audio/mp4,audio/ogg"
                                            className="hidden"
                                            onChange={(event) => {
                                                setVoiceFile(event.target.files?.[0] ?? null);
                                                event.currentTarget.value = "";
                                            }}
                                        />
                                        <input
                                            ref={videoInputRef}
                                            type="file"
                                            accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                                            className="hidden"
                                            onChange={(event) => {
                                                setVideoFile(event.target.files?.[0] ?? null);
                                                event.currentTarget.value = "";
                                            }}
                                        />

                                        <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
                                            <ImageIcon className="size-4" />
                                            Ảnh
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" onClick={() => voiceInputRef.current?.click()}>
                                            <AudioLines className="size-4" />
                                            Audio
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" onClick={() => videoInputRef.current?.click()}>
                                            <FileVideo className="size-4" />
                                            Video
                                        </Button>

                                        <div className="ml-auto flex items-center gap-2">
                                            {(draft.trim() || hasAttachments) ? (
                                                <Button type="button" variant="ghost" size="sm" onClick={clearComposer}>
                                                    <Trash2 className="size-4" />
                                                    Xoá
                                                </Button>
                                            ) : null}
                                            <Button type="button" size="sm" onClick={handleSend} disabled={!canSend}>
                                                {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                                                Gửi
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex h-full items-center justify-center px-6 py-16 text-center text-slate-500">
                        <div>
                            <MessageCircle className="mx-auto mb-3 size-10 text-slate-300" />
                            <p className="text-lg font-semibold text-slate-800">Chọn một cuộc trò chuyện</p>
                            <p className="mt-1 text-sm text-slate-500">Danh sách bên trái sẽ hiển thị khách hàng đang cần hỗ trợ.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SupportInboxPage;
