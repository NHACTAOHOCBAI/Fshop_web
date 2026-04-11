import { useEffect, useMemo, useRef, useState } from "react";
import { AudioLines, CheckCheck, ChevronDown, FileVideo, Image as ImageIcon, Loader2, MessageCircle, Send, Store, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAiChatMessages, useAiChatSessions, useCreateAiChatSession, useSendAiChatMessage } from "@/hooks/useChatbot";
import { useProducts } from "@/hooks/useProducts";
import { authStorage } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { AiChatMessage } from "@/types/chatbot";
import type { Product } from "@/types/product";

const QUICK_PROMPTS = [
    "Gợi ý outfit đi chơi cuối tuần",
    "Áo khoác nào đang bán chạy?",
    "Tư vấn size quần jeans nữ",
];

const formatPrice = (value: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
};

const formatTime = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

type ChatComposerProduct = {
    id: number;
    name: string;
    price: number;
    imageUrl?: string | null;
    brandName?: string | null;
    categoryName?: string | null;
    department?: string | null;
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

const FloatingAiChatbot = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState("");
    const [pendingMessage, setPendingMessage] = useState<AiChatMessage | null>(null);
    const [imageItems, setImageItems] = useState<Array<{ file: File; previewUrl: string }>>([]);
    const [voiceFile, setVoiceFile] = useState<File | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<ChatComposerProduct[]>([]);
    const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
    const [productSearch, setProductSearch] = useState("");

    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const voiceInputRef = useRef<HTMLInputElement | null>(null);
    const videoInputRef = useRef<HTMLInputElement | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const imageItemsRef = useRef(imageItems);

    const isAuthenticated = Boolean(authStorage.getAccessToken());
    const productsQuery = useProducts({
        page: 1,
        limit: 12,
        search: productSearch.trim() || undefined,
        sortBy: "createdAt",
        sortOrder: "DESC",
    });
    const availableProducts = useMemo(() => productsQuery.data?.data ?? [], [productsQuery.data]);

    const sessionsQuery = useAiChatSessions(open && isAuthenticated);
    const createSessionMutation = useCreateAiChatSession();
    const sendMessageMutation = useSendAiChatMessage();

    const activeSession = useMemo(() => {
        const sessions = sessionsQuery.data?.data ?? [];
        return sessions[0];
    }, [sessionsQuery.data]);

    const messagesQuery = useAiChatMessages(activeSession?.id, open && Boolean(activeSession?.id));
    const messages = useMemo<AiChatMessage[]>(() => {
        const base = messagesQuery.data?.data ?? [];
        if (!pendingMessage) {
            return base;
        }

        const hasPersisted = base.some(
            (item) =>
                item.role === "user" &&
                item.content === pendingMessage.content &&
                Math.abs(new Date(item.createdAt).getTime() - new Date(pendingMessage.createdAt).getTime()) < 30_000,
        );

        return hasPersisted ? base : [...base, pendingMessage];
    }, [messagesQuery.data, pendingMessage]);

    useEffect(() => {
        if (!open || !isAuthenticated || !sessionsQuery.isSuccess || createSessionMutation.isPending || activeSession) {
            return;
        }

        const sessions = sessionsQuery.data?.data ?? [];
        if (sessions.length === 0) {
            createSessionMutation.mutate(
                {},
                {
                    onError: (error: Error) => {
                        toast.error(error.message || "Không thể khởi tạo phiên chat AI.");
                    },
                },
            );
        }
    }, [activeSession, createSessionMutation, isAuthenticated, open, sessionsQuery.data, sessionsQuery.isSuccess]);

    useEffect(() => {
        imageItemsRef.current = imageItems;
    }, [imageItems]);

    useEffect(() => {
        return () => {
            imageItemsRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
        };
    }, []);

    useEffect(() => {
        if (!open || !messagesContainerRef.current) {
            return;
        }

        messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [open, messages.length, sendMessageMutation.isPending]);

    const handleOpen = () => {
        if (!isAuthenticated) {
            toast.info("Vui lòng đăng nhập để dùng chatbot.");
            navigate("/login");
            return;
        }
        setOpen(true);
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

    const toggleProduct = (product: Product) => {
        const productItem = toComposerProduct(product);

        setSelectedProducts((prev) => {
            if (prev.some((item) => item.id === productItem.id)) {
                return prev.filter((item) => item.id !== productItem.id);
            }

            return [...prev, productItem];
        });
    };

    const clearComposer = () => {
        setDraft("");
        imageItemsRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
        setImageItems([]);
        setVoiceFile(null);
        setVideoFile(null);
        setSelectedProducts([]);
    };

    const handleSend = async () => {
        const normalized = draft.trim();
        if (!normalized || sendMessageMutation.isPending) {
            return;
        }

        const optimisticMessage: AiChatMessage = {
            id: -Date.now(),
            role: "user",
            content: normalized,
            products: null,
            latencyMs: null,
            createdAt: new Date().toISOString(),
        };

        setPendingMessage(optimisticMessage);
        setDraft("");

        let sessionId = activeSession?.id;

        try {
            if (!sessionId) {
                const created = await createSessionMutation.mutateAsync({});
                sessionId = created.data.id;
            }

            await sendMessageMutation.mutateAsync({
                sessionId,
                message: normalized,
                historyLimit: 12,
            });

            setPendingMessage(null);
            clearComposer();
        } catch (error: unknown) {
            setPendingMessage(null);
            setDraft(normalized);
            const message = error instanceof Error ? error.message : "Không thể nhận phản hồi từ AI. Vui lòng thử lại.";
            toast.error(message);
        }
    };

    const isLoading = sessionsQuery.isLoading || (Boolean(activeSession?.id) && messagesQuery.isLoading);
    const hasAttachments = imageItems.length > 0 || Boolean(voiceFile) || Boolean(videoFile) || selectedProducts.length > 0;
    const canSend = Boolean(draft.trim()) && !sendMessageMutation.isPending;

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

                {selectedProducts.map((product) => (
                    <div key={product.id} className="w-40 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        <div className="h-24 bg-slate-100">
                            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" /> : null}
                        </div>
                        <div className="space-y-1 p-2">
                            <p className="line-clamp-2 text-[11px] font-medium text-slate-700">{product.name}</p>
                            <p className="text-[11px] font-semibold text-primary">{formatPrice(Number(product.price))}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                className="fixed bottom-4 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_18px_40px_-16px_rgba(37,99,235,0.8)] transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
                aria-label="Mở chatbot"
            >
                <MessageCircle className="size-6" />
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="fixed bottom-20 right-4 top-auto left-auto z-50 flex h-[min(82vh,52rem)] w-[calc(100vw-2rem)] max-w-[28rem] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-[0_30px_80px_-24px_rgba(15,23,42,0.55)] sm:bottom-6 sm:right-6 sm:w-[28rem]"
                >
                    <DialogHeader className="border-b border-slate-100 px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
                                    <Store className="size-5" />
                                </div>
                                <div className="min-w-0">
                                    <DialogTitle className="truncate text-sm font-semibold text-slate-900">
                                        Chat với trợ lý AI
                                    </DialogTitle>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Hỗ trợ tìm sản phẩm, tư vấn size và mức giá.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    Online
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                                    aria-label="Đóng chatbot"
                                >
                                    <ChevronDown className="size-4" />
                                </button>
                            </div>
                        </div>
                    </DialogHeader>

                    <div ref={messagesContainerRef} className="flex-1 space-y-3 overflow-y-auto bg-white px-5 py-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                                <Loader2 className="size-4 animate-spin" />
                                Đang khởi tạo trợ lý AI...
                            </div>
                        ) : null}

                        {!isLoading && messages.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                                <p className="text-sm font-semibold text-slate-900">Bắt đầu cuộc trò chuyện</p>
                                <p className="mt-1 text-xs text-slate-500">Bạn có thể hỏi về sản phẩm, thương hiệu hoặc mức giá phù hợp.</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {QUICK_PROMPTS.map((prompt) => (
                                        <button
                                            key={prompt}
                                            type="button"
                                            onClick={() => setDraft(prompt)}
                                            className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary"
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {messages.map((message) => (
                            <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                                <div className="flex max-w-[88%] flex-col gap-2">
                                    <div className={cn("rounded-2xl px-3 py-2 text-sm leading-relaxed", message.role === "user" ? "bg-primary text-primary-foreground" : "border border-slate-200 bg-slate-50 text-slate-700")}> 
                                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                        <div className={cn("mt-1 flex items-center gap-1.5 text-[11px]", message.role === "user" ? "text-primary-foreground/80" : "text-slate-400")}>
                                            <span>{formatTime(message.createdAt)}</span>
                                            {message.role === "user" ? <CheckCheck className="size-3.5" /> : null}
                                        </div>

                                        {message.products && message.products.length > 0 ? (
                                            <div className="mt-2 space-y-2">
                                                {message.products.slice(0, 3).map((product) => (
                                                    <a
                                                        key={product.id}
                                                        href={`/${product.category_department ?? "men"}/products/${product.id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className={cn(
                                                            "block overflow-hidden rounded-xl border transition-colors",
                                                            message.role === "user"
                                                                ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
                                                                : "border-slate-200 bg-white text-slate-800 hover:border-primary/30",
                                                        )}
                                                    >
                                                        <div className="flex gap-3 p-3">
                                                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                                                {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /> : null}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="line-clamp-2 text-xs font-semibold">{product.name}</p>
                                                                <p className={cn("mt-1 text-[11px]", message.role === "user" ? "text-white/75" : "text-slate-500")}>
                                                                    {product.brand ?? "FShop"}
                                                                    {product.category ? ` · ${product.category}` : ""}
                                                                </p>
                                                                <p className={cn("mt-2 text-xs font-semibold", message.role === "user" ? "text-white" : "text-primary")}>{formatPrice(Number(product.price || 0))}</p>
                                                            </div>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {sendMessageMutation.isPending ? (
                            <div className="flex justify-start">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                    AI đang nhập...
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="border-t border-slate-100 px-5 py-4">
                        <div className="space-y-2">
                            {renderComposerAttachments()}

                            <Textarea
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                placeholder="Nhập nội dung cần hỗ trợ..."
                                className="min-h-24 resize-none"
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" && !event.shiftKey) {
                                        event.preventDefault();
                                        void handleSend();
                                    }
                                }}
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
                                    <ImageIcon className="size-3.5" />
                                    Ảnh
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => voiceInputRef.current?.click()}>
                                    <AudioLines className="size-3.5" />
                                    Audio
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => videoInputRef.current?.click()}>
                                    <FileVideo className="size-3.5" />
                                    Video
                                </Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => setIsProductPickerOpen(true)}>
                                    <Store className="size-3.5" />
                                    Sản phẩm{selectedProducts.length > 0 ? ` (${selectedProducts.length})` : ""}
                                </Button>

                                <div className="ml-auto flex items-center gap-2">
                                    {(draft.trim() || hasAttachments) ? (
                                        <Button type="button" variant="ghost" size="sm" onClick={clearComposer}>
                                            <Trash2 className="size-4" />
                                            Xoá
                                        </Button>
                                    ) : null}
                                    <Button type="button" size="sm" onClick={() => void handleSend()} disabled={!canSend}>
                                        {sendMessageMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                                        Gửi
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isProductPickerOpen} onOpenChange={setIsProductPickerOpen}>
                <DialogContent className="max-h-[86vh] w-[calc(100vw-1.5rem)] max-w-3xl overflow-y-auto sm:w-full">
                    <DialogHeader>
                        <DialogTitle>Chọn sản phẩm để gửi</DialogTitle>
                    </DialogHeader>

                    <Input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Tìm theo tên sản phẩm..." className="w-full" />

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
                                                <p className="mt-2 text-sm font-semibold text-primary">{formatPrice(Number(product.price))}</p>
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
        </>
    );
};

export default FloatingAiChatbot;