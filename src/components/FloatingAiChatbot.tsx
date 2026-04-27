import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, ChevronRight, ExternalLink, Loader2, Minus, Plus, Send, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    useAiChatMessages,
    useAiChatSessions,
    useCloseAiChatSession,
    useCreateAiChatSession,
    useSendAiChatMessage,
} from "@/hooks/useChatbot";
import { authStorage } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { AiChatMessage, AiChatProductSuggestion } from "@/types/chatbot";

const QUICK_PROMPTS = [
    "Gợi ý outfit đi chơi cuối tuần",
    "Áo khoác nào đang bán chạy?",
    "Tư vấn size quần jeans nữ",
];

const formatTime = (iso: string) => {
    const date = new Date(iso);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const formatProductPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const FloatingAiChatbot = () => {
    const isAuthenticated = Boolean(authStorage.getAccessToken());

    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState("");
    const [pendingMessage, setPendingMessage] = useState<string | null>(null);
    const messagesScrollRef = useRef<HTMLDivElement | null>(null);
    const shouldStickToBottomRef = useRef(true);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const sessionsQuery = useAiChatSessions(isAuthenticated && isOpen);
    const sessions = useMemo(() => sessionsQuery.data?.data ?? [], [sessionsQuery.data]);
    const activeSession = sessions[0] ?? null;
    const sessionId = activeSession?.id;

    const messagesQuery = useAiChatMessages(sessionId, Boolean(sessionId) && isOpen);
    const messages = useMemo(() => messagesQuery.data?.data ?? [], [messagesQuery.data]);

    const createSessionMutation = useCreateAiChatSession();
    const sendMessageMutation = useSendAiChatMessage();
    const closeSessionMutation = useCloseAiChatSession();

    const isSending = sendMessageMutation.isPending;
    const isLoading =
        sessionsQuery.isLoading || (Boolean(sessionId) && messagesQuery.isLoading);

    useEffect(() => {
        if (
            !isOpen ||
            !sessionsQuery.isSuccess ||
            sessions.length > 0 ||
            createSessionMutation.isPending ||
            createSessionMutation.isSuccess
        ) {
            return;
        }

        createSessionMutation.mutate(undefined);
    }, [
        isOpen,
        sessionsQuery.isSuccess,
        sessions.length,
        createSessionMutation.isPending,
        createSessionMutation.isSuccess,
        createSessionMutation,
    ]);

    useEffect(() => {
        if (!isOpen) return;
        const container = messagesScrollRef.current;
        if (!container || !shouldStickToBottomRef.current) return;
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }, [messages.length, isSending, pendingMessage, isOpen]);

    useEffect(() => {
        if (isOpen) {
            textareaRef.current?.focus();
        }
    }, [isOpen]);

    const handleSend = (text?: string) => {
        const content = (text ?? draft).trim();
        if (!content || isSending) return;

        if (!sessionId) {
            toast.error("Đang khởi tạo phiên chat, vui lòng thử lại.");
            return;
        }

        setPendingMessage(content);
        setDraft("");

        sendMessageMutation.mutate(
            { sessionId, message: content },
            {
                onSuccess: () => {
                    setPendingMessage(null);
                },
                onError: (error: Error) => {
                    setPendingMessage(null);
                    setDraft(content);
                    const status = (error as unknown as { status?: number }).status;
                    if (status === 503 || status === 504) {
                        toast.error("Trợ lý AI đang bận, vui lòng thử lại sau.");
                    } else {
                        toast.error(error.message || "Không thể gửi tin nhắn.");
                    }
                },
            }
        );
    };

    const handleNewSession = () => {
        setDraft("");
        setPendingMessage(null);
        shouldStickToBottomRef.current = true;

        if (sessionId) {
            closeSessionMutation.mutate(sessionId, {
                onSuccess: () => {
                    createSessionMutation.mutate(undefined);
                },
                onError: (error: Error) => {
                    toast.error(error.message || "Không thể đóng phiên chat.");
                },
            });
        } else {
            createSessionMutation.mutate(undefined);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
        event.preventDefault();
        handleSend();
    };

    const handleMessagesScroll = () => {
        const container = messagesScrollRef.current;
        if (!container) return;
        const distanceFromBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight;
        shouldStickToBottomRef.current = distanceFromBottom < 96;
    };

    const renderProductSuggestions = (products: AiChatProductSuggestion[]) => {
        if (products.length === 0) return null;

        return (
            <div className="mt-2 space-y-2">
                <p className="text-[11px] font-medium text-slate-400">Sản phẩm gợi ý:</p>
                {products.map((product) => {
                    const department = product.category_department ?? "men";
                    const targetPath = `/${department}/products/${product.id}`;

                    return (
                        <a
                            key={product.id}
                            href={targetPath}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5 transition-colors hover:border-primary/40 hover:bg-slate-50"
                        >
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-xs font-semibold text-slate-900">
                                    {product.name}
                                </p>
                                <p className="mt-0.5 text-[11px] font-semibold text-primary">
                                    {formatProductPrice(product.price)}
                                </p>
                            </div>
                            <ExternalLink className="size-3 shrink-0 text-slate-400" />
                        </a>
                    );
                })}
            </div>
        );
    };

    const renderMessage = (message: AiChatMessage) => {
        const isUser = message.role === "user";
        const products = message.products ?? [];

        return (
            <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                    className={cn(
                        "flex max-w-[85%] flex-col gap-1",
                        isUser ? "items-end" : "items-start"
                    )}
                >
                    <div
                        className={cn(
                            "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                            isUser
                                ? "bg-primary text-primary-foreground"
                                : "border border-slate-200 bg-slate-50 text-slate-700"
                        )}
                    >
                        <p className="whitespace-pre-wrap text-xs leading-relaxed">{message.content}</p>
                        <p
                            className={cn(
                                "mt-1 text-[10px]",
                                isUser ? "text-primary-foreground/70" : "text-slate-400"
                            )}
                        >
                            {formatTime(message.createdAt)}
                        </p>
                    </div>

                    {!isUser && products.length > 0
                        ? renderProductSuggestions(products)
                        : null}
                </div>
            </div>
        );
    };

    if (!isAuthenticated) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {/* Chat panel */}
            {isOpen && (
                <div className="flex h-[560px] w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
                        <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                                <Sparkles className="size-3.5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">Trợ lý AI mua sắm</p>
                                <p className="text-[11px] text-slate-400">FShop AI Assistant</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleNewSession}
                                disabled={
                                    createSessionMutation.isPending || closeSessionMutation.isPending
                                }
                                title="Cuộc trò chuyện mới"
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {createSessionMutation.isPending || closeSessionMutation.isPending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Plus className="size-4" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                                <Minus className="size-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        ref={messagesScrollRef}
                        onScroll={handleMessagesScroll}
                        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3"
                    >
                        {isLoading ? (
                            <div className="flex h-full items-center justify-center text-slate-500">
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                <span className="text-sm">Đang tải...</span>
                            </div>
                        ) : messages.length === 0 && !pendingMessage ? (
                            <div className="space-y-3">
                                <div className="flex flex-col items-center pt-4 text-center">
                                    <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10">
                                        <Bot className="size-6 text-primary" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        Xin chào! Tôi là trợ lý AI của FShop.
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Hỏi tôi về sản phẩm, size, hay gợi ý outfit nhé!
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {QUICK_PROMPTS.map((prompt) => (
                                        <button
                                            key={prompt}
                                            type="button"
                                            onClick={() => handleSend(prompt)}
                                            disabled={isSending || !sessionId}
                                            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs text-slate-700 transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <span>{prompt}</span>
                                            <ChevronRight className="size-3.5 shrink-0 text-slate-400" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map(renderMessage)}

                                {pendingMessage &&
                                !messages.some(
                                    (m) => m.role === "user" && m.content === pendingMessage
                                ) ? (
                                    <div className="flex justify-end">
                                        <div className="max-w-[85%] rounded-2xl bg-primary px-3 py-2 opacity-70">
                                            <p className="whitespace-pre-wrap text-xs leading-relaxed text-primary-foreground">
                                                {pendingMessage}
                                            </p>
                                        </div>
                                    </div>
                                ) : null}

                                {isSending ? (
                                    <div className="flex justify-start">
                                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                            <div className="flex items-center gap-1">
                                                <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                                                <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                                                <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>

                    {/* Composer */}
                    <div className="border-t border-slate-100 px-3 py-3">
                        <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-primary/40 focus-within:bg-white transition-colors">
                            <Textarea
                                ref={textareaRef}
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Nhập câu hỏi của bạn..."
                                className="min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
                                rows={1}
                                style={{ maxHeight: "80px" }}
                                disabled={isSending}
                            />
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => handleSend()}
                                disabled={!draft.trim() || isSending || !sessionId}
                                className="h-7 w-7 shrink-0 rounded-lg p-0"
                            >
                                {isSending ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                    <Send className="size-3.5" />
                                )}
                            </Button>
                        </div>
                        <p className="mt-1.5 text-center text-[10px] text-slate-400">
                            Enter để gửi · Shift+Enter xuống dòng
                        </p>
                    </div>
                </div>
            )}

            {/* FAB button */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={cn(
                    "flex size-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95",
                    isOpen
                        ? "bg-slate-700 text-white hover:bg-slate-800"
                        : "bg-primary text-white hover:bg-primary/90"
                )}
                aria-label={isOpen ? "Đóng trợ lý AI" : "Mở trợ lý AI"}
            >
                {isOpen ? (
                    <X className="size-5" />
                ) : (
                    <Sparkles className="size-5" />
                )}
            </button>
        </div>
    );
};

export default FloatingAiChatbot;
