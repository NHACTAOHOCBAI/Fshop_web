import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, ChevronRight, ExternalLink, Loader2, Plus, Send, Sparkles, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { AiChatMessage, AiChatProductSuggestion } from "@/types/chatbot";

const QUICK_PROMPTS = [
    "Gợi ý outfit đi chơi cuối tuần",
    "Áo khoác nào đang bán chạy?",
    "Tư vấn size quần jeans nữ",
    "Có sản phẩm nào đang sale không?",
];

const formatTime = (iso: string) => {
    const date = new Date(iso);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const formatProductPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const AccountAiChatbotPanel = () => {
    const [draft, setDraft] = useState("");
    const [pendingMessage, setPendingMessage] = useState<string | null>(null);
    const messagesScrollRef = useRef<HTMLDivElement | null>(null);
    const shouldStickToBottomRef = useRef(true);

    const sessionsQuery = useAiChatSessions();
    const sessions = useMemo(() => sessionsQuery.data?.data ?? [], [sessionsQuery.data]);
    const activeSession = sessions[0] ?? null;
    const sessionId = activeSession?.id;

    const messagesQuery = useAiChatMessages(sessionId, Boolean(sessionId));
    const messages = useMemo(() => messagesQuery.data?.data ?? [], [messagesQuery.data]);

    const createSessionMutation = useCreateAiChatSession();
    const sendMessageMutation = useSendAiChatMessage();
    const closeSessionMutation = useCloseAiChatSession();

    const isSending = sendMessageMutation.isPending;
    const isLoading =
        sessionsQuery.isLoading || (Boolean(sessionId) && messagesQuery.isLoading);

    useEffect(() => {
        if (
            sessionsQuery.isSuccess &&
            sessions.length === 0 &&
            !createSessionMutation.isPending &&
            !createSessionMutation.isSuccess
        ) {
            createSessionMutation.mutate(undefined);
        }
    }, [
        sessionsQuery.isSuccess,
        sessions.length,
        createSessionMutation.isPending,
        createSessionMutation.isSuccess,
        createSessionMutation,
    ]);

    useEffect(() => {
        const container = messagesScrollRef.current;
        if (!container || !shouldStickToBottomRef.current) return;
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }, [messages.length, isSending, pendingMessage]);

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
            { sessionId, payload: { message: content } },
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
            <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-slate-500">Sản phẩm gợi ý:</p>
                {products.map((product) => {
                    const department = product.category_department ?? "men";
                    const targetPath = `/${department}/products/${product.id}`;

                    return (
                        <a
                            key={product.id}
                            href={targetPath}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-primary/40 hover:bg-slate-50"
                        >
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                                    {product.name}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {product.brand ?? "FShop"}
                                    {product.category ? ` · ${product.category}` : ""}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-primary">
                                    {formatProductPrice(product.price)}
                                </p>
                            </div>
                            <ExternalLink className="size-3.5 shrink-0 text-slate-400" />
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
                        "flex max-w-[88%] flex-col gap-1",
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
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p
                            className={cn(
                                "mt-1 text-[11px]",
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

    const renderEmptyState = () => (
        <div className="space-y-4">
            <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Bot className="size-7 text-primary" />
                </div>
                <p className="text-base font-semibold text-slate-800">
                    Xin chào! Tôi là trợ lý AI của FShop.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                    Hãy hỏi tôi về sản phẩm, tư vấn size, hay gợi ý outfit nhé!
                </p>
            </div>
            <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">Gợi ý câu hỏi:</p>
                {QUICK_PROMPTS.map((prompt) => (
                    <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSend(prompt)}
                        disabled={isSending || !sessionId}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span>{prompt}</span>
                        <ChevronRight className="size-4 shrink-0 text-slate-400" />
                    </button>
                ))}
            </div>
        </div>
    );

    const renderTypingIndicator = () => (
        <div className="flex justify-start">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                </div>
            </div>
        </div>
    );

    return (
        <section className="flex max-h-[calc(100vh-6.5rem)] min-h-[72vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                        <Sparkles className="size-4 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Trợ lý AI mua sắm</h2>
                        <p className="text-xs text-slate-500">
                            Tư vấn thời trang, gợi ý sản phẩm phù hợp với bạn.
                        </p>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleNewSession}
                    disabled={
                        createSessionMutation.isPending || closeSessionMutation.isPending
                    }
                >
                    {createSessionMutation.isPending || closeSessionMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Plus className="size-4" />
                    )}
                    Cuộc trò chuyện mới
                </Button>
            </div>

            {/* Messages area */}
            <div className="flex min-h-0 flex-1 flex-col">
                <div
                    ref={messagesScrollRef}
                    onScroll={handleMessagesScroll}
                    className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4"
                >
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center py-20 text-slate-500">
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Đang tải...
                        </div>
                    ) : messages.length === 0 && !pendingMessage ? (
                        renderEmptyState()
                    ) : (
                        <>
                            {messages.map(renderMessage)}

                            {pendingMessage &&
                            !messages.some(
                                (m) => m.role === "user" && m.content === pendingMessage
                            ) ? (
                                <div className="flex justify-end">
                                    <div className="max-w-[88%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground opacity-70">
                                        <p className="whitespace-pre-wrap">{pendingMessage}</p>
                                    </div>
                                </div>
                            ) : null}

                            {isSending ? renderTypingIndicator() : null}
                        </>
                    )}
                </div>

                {/* Composer */}
                <div className="border-t border-slate-100 px-5 py-4">
                    <div className="space-y-2">
                        <Textarea
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhập câu hỏi về sản phẩm, size, outfit..."
                            className="min-h-20 resize-none"
                            disabled={isSending}
                        />
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-500">
                                Nhấn{" "}
                                <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[10px] font-medium">
                                    Enter
                                </kbd>{" "}
                                để gửi,{" "}
                                <kbd className="rounded border border-slate-200 bg-slate-100 px-1 py-0.5 text-[10px] font-medium">
                                    Shift+Enter
                                </kbd>{" "}
                                xuống dòng.
                            </p>
                            <div className="flex items-center gap-2">
                                {draft.trim() ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDraft("")}
                                        disabled={isSending}
                                    >
                                        <X className="size-4" />
                                        Xoá
                                    </Button>
                                ) : null}
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleSend()}
                                    disabled={!draft.trim() || isSending || !sessionId}
                                >
                                    {isSending ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Send className="size-4" />
                                    )}
                                    Gửi
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AccountAiChatbotPanel;
