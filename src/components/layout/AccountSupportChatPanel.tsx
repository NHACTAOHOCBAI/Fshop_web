import { useEffect, useMemo, useRef, useState } from "react";
import { AudioLines, CheckCheck, FileVideo, Image as ImageIcon, Loader2, MessageCircle, Send, Store, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { useChatRealtime, useConversationMessages, useMarkConversationSeen, useSendChatMessage, useSupportConversation } from "@/hooks/useChats";
import { authStorage } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { ChatAttachment, ChatMessage, ChatProductAttachment } from "@/types/chat";
import type { Product } from "@/types/product";
import type { User } from "@/types/user";

type ChatComposerProduct = {
    id: number;
    name: string;
    price: number;
    imageUrl?: string | null;
    brandName?: string | null;
    categoryName?: string | null;
    department?: string | null;
};

type AccountSupportChatPanelProps = {
    prefillProduct?: ChatProductAttachment | null;
    onPrefillConsumed?: () => void;
};

const formatTime = (iso: string) => {
    const date = new Date(iso);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const getAttachmentLabel = (attachment: ChatAttachment) => {
    switch (attachment.type) {
        case "image":
            return "Ảnh";
        case "voice":
            return "Audio";
        case "video":
            return "Video";
        case "product":
            return "Sản phẩm";
        default:
            return "Tệp";
    }
};

const formatProductPrice = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
};

const toComposerProduct = (product: Product): ChatComposerProduct => ({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    imageUrl: product.images?.[0]?.imageUrl ?? null,
    brandName: product.brand?.name ?? null,
    categoryName: product.category?.name ?? null,
    department: product.category?.department ?? null,
});

const AccountSupportChatPanel = ({ prefillProduct, onPrefillConsumed }: AccountSupportChatPanelProps) => {
    const [draft, setDraft] = useState("");
    const [imageItems, setImageItems] = useState<Array<{ file: File; previewUrl: string }>>([]);
    const [voiceFile, setVoiceFile] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<ChatComposerProduct[]>([]);
    const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
    const [productSearch, setProductSearch] = useState("");

    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const voiceInputRef = useRef<HTMLInputElement | null>(null);
    const videoInputRef = useRef<HTMLInputElement | null>(null);
    const typingTimeoutRef = useRef<number | null>(null);
    const seenConversationIdRef = useRef<number | null>(null);
    const messagesScrollRef = useRef<HTMLDivElement | null>(null);
    const shouldStickToBottomRef = useRef(true);
    const imageItemsRef = useRef(imageItems);

    const productsQuery = useProducts({
        page: 1,
        limit: 12,
        search: productSearch.trim() || undefined,
        sortBy: "createdAt",
        sortOrder: "DESC",
    });
    const availableProducts = useMemo(() => productsQuery.data?.data ?? [], [productsQuery.data]);

    const cachedUser = authStorage.getUser<User>();
    const { data: meResponse } = useMe();
    const currentUser = meResponse?.data ?? cachedUser;

    const conversationQuery = useSupportConversation(true);
    const conversation = conversationQuery.data?.data;
    const conversationId = conversation?.id;

    const messagesQuery = useConversationMessages(conversationId, Boolean(conversationId));
    const messages = useMemo(() => messagesQuery.data?.data ?? [], [messagesQuery.data]);

    const sendMessageMutation = useSendChatMessage();
    const markSeenMutation = useMarkConversationSeen();

    const { isSupportTyping, emitTyping } = useChatRealtime({
        conversationId,
        enabled: Boolean(conversationId),
        currentUserId: currentUser?.id,
        onAdminMessageReceived: () => {
            if (conversationId) {
                markSeenMutation.mutate(conversationId);
            }
        },
    });

    const isLoading = conversationQuery.isLoading || messagesQuery.isLoading;
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
    const hasAttachments = imageItems.length > 0 || Boolean(voiceFile) || Boolean(videoFile) || selectedProducts.length > 0;
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

    useEffect(() => {
        if (!prefillProduct) {
            return;
        }

        setSelectedProducts((prev) => {
            if (prev.some((item) => item.id === prefillProduct.id)) {
                return prev;
            }

            return [...prev, prefillProduct];
        });

        onPrefillConsumed?.();
    }, [prefillProduct, onPrefillConsumed]);

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
        setSelectedProducts([]);
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
                productIds: selectedProducts.length > 0 ? selectedProducts.map((product) => product.id) : undefined,
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

    const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
            return;
        }

        event.preventDefault();
        handleSend();
    };

    const toggleProduct = (product: Product) => {
        const productItem = toComposerProduct(product);

        setSelectedProducts((prev) => {
            if (prev.some((item) => item.id === productItem.id)) {
                return prev.filter((item) => item.id !== productItem.id);
            }

            return [...prev, productItem];
        });
    };

    const renderAttachments = (attachments: ChatAttachment[]) => {
        return (
            <div className="mt-2 space-y-2">
                {attachments.map((attachment) => {
                    if (attachment.type === "product" && attachment.product) {
                        const targetPath = `/${attachment.product.department ?? "men"}/products/${attachment.product.id}`;

                        return (
                            <a
                                key={`product-${attachment.product.id}`}
                                href={targetPath}
                                target="_blank"
                                rel="noreferrer"
                                className="block overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-primary/30"
                            >
                                <div className="flex gap-3 p-3">
                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                        {attachment.product.imageUrl ? (
                                            <img src={attachment.product.imageUrl} alt={attachment.product.name} className="h-full w-full object-cover" />
                                        ) : null}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-2 text-sm font-semibold text-slate-900">{attachment.product.name}</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {attachment.product.brandName ?? "FShop"}
                                            {attachment.product.categoryName ? ` · ${attachment.product.categoryName}` : ""}
                                        </p>
                                        <p className="mt-2 text-sm font-semibold text-primary">{formatProductPrice(attachment.product.price)}</p>
                                    </div>
                                </div>
                            </a>
                        );
                    }

                    if (attachment.type === "image") {
                        return (
                            <a
                                key={attachment.publicId}
                                href={attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block overflow-hidden rounded-xl border border-white/10"
                            >
                                <img
                                    src={attachment.url}
                                    alt={attachment.fileName ?? "Ảnh đính kèm"}
                                    className="max-h-56 w-full object-cover"
                                />
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
                            <button
                                type="button"
                                onClick={() => removeImageItem(index)}
                                className="shrink-0 text-white/80 transition-colors hover:text-white"
                            >
                                <X className="size-3.5" />
                            </button>
                        </div>
                    </div>
                ))}

                {voiceFile ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                        <AudioLines className="size-3.5 text-primary" />
                        <span className="max-w-40 truncate">{voiceFile.name}</span>
                        <button
                            type="button"
                            onClick={() => setVoiceFile(null)}
                            className="text-slate-400 transition-colors hover:text-slate-700"
                        >
                            <X className="size-3.5" />
                        </button>
                    </span>
                ) : null}

                {videoFile ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                        <FileVideo className="size-3.5 text-primary" />
                        <span className="max-w-40 truncate">{videoFile.name}</span>
                        <button
                            type="button"
                            onClick={() => setVideoFile(null)}
                            className="text-slate-400 transition-colors hover:text-slate-700"
                        >
                            <X className="size-3.5" />
                        </button>
                    </span>
                ) : null}

                {selectedProducts.map((product) => (
                    <div key={product.id} className="w-40 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        <div className="h-24 bg-slate-100">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                            ) : null}
                        </div>
                        <div className="space-y-1 p-2">
                            <p className="line-clamp-2 text-[11px] font-medium text-slate-700">{product.name}</p>
                            <p className="text-[11px] font-semibold text-primary">{formatProductPrice(Number(product.price))}</p>
                        </div>
                    </div>
                ))}
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
        <section className="flex max-h-[calc(100vh-6.5rem)] min-h-[72vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-slate-900">
                        <Store className="size-4 text-primary" />
                        <h2 className="text-lg font-semibold">Chat với cửa hàng</h2>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                        Hỗ trợ đơn hàng, vận chuyển, đổi trả và các vấn đề liên quan đến tài khoản mua sắm.
                    </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                    <p>{conversation?.status === "HANDLING" ? "Shop đang phản hồi" : "Đang chờ shop hỗ trợ"}</p>
                    {conversation?.lastMessageAt ? <p className="mt-1">Cập nhật lúc {formatTime(conversation.lastMessageAt)}</p> : null}
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                <div ref={messagesScrollRef} onScroll={handleMessagesScroll} className="flex-1 min-h-0 space-y-3 overflow-y-auto px-5 py-4">
                    {conversationQuery.isError || messagesQuery.isError ? (
                        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            <p className="font-medium">Không tải được cuộc trò chuyện.</p>
                            <p className="mt-1 text-rose-600">
                                {(conversationQuery.error as Error | undefined)?.message || (messagesQuery.error as Error | undefined)?.message || "Vui lòng thử lại sau."}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                onClick={() => {
                                    conversationQuery.refetch();
                                    if (conversationId) {
                                        messagesQuery.refetch();
                                    }
                                }}
                            >
                                Thử lại
                            </Button>
                        </div>
                    ) : null}

                    {isLoading ? (
                        <div className="flex h-full items-center justify-center py-20 text-slate-500">
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Đang tải cuộc trò chuyện...
                        </div>
                    ) : messages.length > 0 ? (
                        messages.map((message: ChatMessage) => {
                            const isUser = currentUser?.id ? message.sender.id === currentUser.id : message.senderRole === "user";
                            const hasTextContent = Boolean(message.content?.trim());
                            const hasAttachmentsContent = Boolean(message.attachments && message.attachments.length > 0);

                            return (
                                <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                                    <div className="flex max-w-[88%] flex-col gap-2">
                                        {hasAttachmentsContent ? (
                                            <div className="max-w-full">
                                                {message.attachments ? renderAttachments(message.attachments) : null}
                                                {!hasTextContent ? (
                                                    <div className="mt-1 flex items-center gap-1.5 px-1 text-[11px] text-slate-400">
                                                        <span>{formatTime(message.createdAt)}</span>
                                                        {isUser && message.isSeen ? <CheckCheck className="size-3.5" /> : null}
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}

                                        {hasTextContent ? (
                                            <div
                                                className={cn(
                                                    "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                                                    isUser ? "bg-primary text-primary-foreground" : "border border-slate-200 bg-slate-50 text-slate-700"
                                                )}
                                            >
                                                <p className="whitespace-pre-wrap">{message.content}</p>
                                                <div className={cn("mt-1 flex items-center gap-1.5 text-[11px]", isUser ? "text-primary-foreground/80" : "text-slate-400")}>
                                                    <span>{formatTime(message.createdAt)}</span>
                                                    {isUser && message.isSeen ? <CheckCheck className="size-3.5" /> : null}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                            <p className="font-medium text-slate-700">Chưa có tin nhắn nào</p>
                            <p className="mt-1">Gửi lời nhắn đầu tiên hoặc đính kèm ảnh, video, audio để shop phản hồi nhanh hơn.</p>
                        </div>
                    )}

                    {isSupportTyping ? (
                        <div className="flex justify-start">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                Shop đang nhập...
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="border-t border-slate-100 px-5 py-4">
                    <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                        <MessageCircle className="size-3.5" />
                        Tin nhắn sẽ được gửi đến cửa hàng.
                    </div>

                    {renderComposerAttachments()}

                    <div className="space-y-2">
                        <Textarea
                            value={draft}
                            onChange={(event) => syncTyping(event.target.value)}
                            onKeyDown={handleComposerKeyDown}
                            placeholder="Nhập nội dung cần hỗ trợ..."
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

                                        <Button type="button" variant="outline" size="sm" onClick={() => setIsProductPickerOpen(true)}>
                                            <Store className="size-4" />
                                            Sản phẩm{selectedProducts.length > 0 ? ` (${selectedProducts.length})` : ""}
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

                        <p className="text-xs text-slate-500">Chat này hỗ trợ gửi ảnh, video và audio trực tiếp lên server.</p>
                    </div>
                </div>
            </div>

            <Dialog open={isProductPickerOpen} onOpenChange={setIsProductPickerOpen}>
                <DialogContent className="max-h-[86vh] max-w-3xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Chọn sản phẩm để gửi</DialogTitle>
                        <DialogDescription>Tìm và chọn một hoặc nhiều sản phẩm để đính kèm vào tin nhắn.</DialogDescription>
                    </DialogHeader>

                    <Input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Tìm theo tên sản phẩm..." />

                    <div className="grid max-h-[54vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                        {productsQuery.isLoading ? (
                            <div className="col-span-full flex items-center justify-center py-10 text-sm text-slate-500">
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Đang tải sản phẩm...
                            </div>
                        ) : availableProducts.length > 0 ? (
                            availableProducts.map((product) => {
                                const selected = selectedProducts.some((item) => item.id === product.id);

                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => toggleProduct(product)}
                                        className={cn(
                                            "overflow-hidden rounded-2xl border text-left transition-colors",
                                            selected ? "border-primary bg-primary/5" : "border-slate-200 bg-white hover:border-primary/30 hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex gap-3 p-3">
                                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                                {product.images?.[0]?.imageUrl ? (
                                                    <img src={product.images[0].imageUrl} alt={product.name} className="h-full w-full object-cover" />
                                                ) : null}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="line-clamp-2 text-sm font-semibold text-slate-900">{product.name}</p>
                                                <p className="mt-1 text-xs text-slate-500">{product.brand?.name ?? "FShop"}</p>
                                                <p className="mt-2 text-sm font-semibold text-primary">{formatProductPrice(Number(product.price))}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                                Không tìm thấy sản phẩm phù hợp.
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <p className="text-xs text-slate-500">Đã chọn {selectedProducts.length} sản phẩm.</p>
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsProductPickerOpen(false)}>
                                Đóng
                            </Button>
                            <Button type="button" onClick={() => setIsProductPickerOpen(false)}>
                                Xong
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
};

export default AccountSupportChatPanel;
