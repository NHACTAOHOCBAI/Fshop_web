import { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  CheckCheck,
  Image as ImageIcon,
  Loader2,
  Plus,
  Send,
  Store,
  Trash2,
} from "lucide-react";
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
import {
  useAiChatMessages,
  useAiChatSessions,
  useCloseAiChatSession,
  useCreateAiChatSession,
  useImageSearchInChatSession,
  useSendAiChatMessage,
  useVoiceSearchInChatSession,
} from "@/hooks/useChatbot";
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
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
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
  const [pendingMessage, setPendingMessage] = useState<AiChatMessage | null>(
    null,
  );
  const [selectedProducts, setSelectedProducts] = useState<
    ChatComposerProduct[]
  >([]);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const voiceInputRef = useRef<HTMLInputElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const isAuthenticated = Boolean(authStorage.getAccessToken());
  const productsQuery = useProducts({
    page: 1,
    limit: 12,
    search: productSearch.trim() || undefined,
    sortBy: "createdAt",
    sortOrder: "DESC",
  });
  const availableProducts = useMemo(
    () => productsQuery.data?.data ?? [],
    [productsQuery.data],
  );

  const sessionsQuery = useAiChatSessions(open && isAuthenticated);
  const createSessionMutation = useCreateAiChatSession();
  const closeSessionMutation = useCloseAiChatSession();
  const sendMessageMutation = useSendAiChatMessage();
  const imageSearchMutation = useImageSearchInChatSession();
  const voiceSearchMutation = useVoiceSearchInChatSession();

  const isSending =
    sendMessageMutation.isPending ||
    imageSearchMutation.isPending ||
    voiceSearchMutation.isPending;

  const hasImage = Boolean(imageFile);
  const hasVoice = Boolean(voiceFile);
  const hasProduct = selectedProducts.length > 0;
  const hasText = draft.trim().length > 0;

  const isTypeDisabled = (type: "image" | "voice" | "product" | "text") => {
    if (isSending) return true;
    if (hasImage && type !== "image") return true;
    if (hasVoice && type !== "voice") return true;
    if (hasProduct && type !== "product") return true;
    if (hasText && type !== "text") return true;
    return false;
  };

  const activeSession = useMemo(() => {
    const sessions = sessionsQuery.data?.data ?? [];
    return sessions[0];
  }, [sessionsQuery.data]);

  const messagesQuery = useAiChatMessages(
    activeSession?.id,
    open && Boolean(activeSession?.id),
  );
  const messages = useMemo<AiChatMessage[]>(() => {
    const base = messagesQuery.data?.data ?? [];
    if (!pendingMessage) {
      return base;
    }

    const hasPersisted = base.some(
      (item) =>
        item.role === "user" &&
        item.content === pendingMessage.content &&
        Math.abs(
          new Date(item.createdAt).getTime() -
            new Date(pendingMessage.createdAt).getTime(),
        ) < 30_000,
    );

    return hasPersisted ? base : [...base, pendingMessage];
  }, [messagesQuery.data, pendingMessage]);

  useEffect(() => {
    if (
      !open ||
      !isAuthenticated ||
      !sessionsQuery.isSuccess ||
      createSessionMutation.isPending ||
      activeSession
    ) {
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
  }, [
    activeSession,
    createSessionMutation,
    isAuthenticated,
    open,
    sessionsQuery.data,
    sessionsQuery.isSuccess,
  ]);

  useEffect(() => {
    if (!open || !messagesContainerRef.current) {
      return;
    }

    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [open, messages.length, sendMessageMutation.isPending]);

  const handleNewSession = async () => {
    if (createSessionMutation.isPending || closeSessionMutation.isPending)
      return;
    setDraft("");
    setPendingMessage(null);
    if (activeSession?.id) {
      try {
        await closeSessionMutation.mutateAsync(activeSession.id);
      } catch {
        // ignore close errors, still create new session
      }
    }
    createSessionMutation.mutate(
      {},
      {
        onError: (error: Error) =>
          toast.error(error.message || "Không thể tạo cuộc trò chuyện mới."),
      },
    );
  };



  const handleOpen = () => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để dùng chatbot.");
      navigate("/login");
      return;
    }
    setOpen(true);
  };

  const handleImageFileSelect = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setImageFile(file);
  };

  const handleVoiceFileSelect = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setVoiceFile(file);
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
    setImageFile(null);
    setVoiceFile(null);
    setSelectedProducts([]);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (voiceInputRef.current) voiceInputRef.current.value = "";
  };

  const handleSend = async () => {
    const normalized = draft.trim();
    if (isSending) return;
    if (!normalized && !imageFile && !voiceFile) return;

    let sessionId = activeSession?.id;

    try {
      if (!sessionId) {
        const created = await createSessionMutation.mutateAsync({});
        sessionId = created.data.id;
      }

      if (imageFile) {
        const imageUri = URL.createObjectURL(imageFile);
        const optimisticMessage: AiChatMessage = {
          id: -Date.now(),
          role: "user",
          content: "[Tìm kiếm sản phẩm bằng hình ảnh]",
          products: null,
          metadata: {
            mediaType: "image",
            imageUri,
            fileName: imageFile.name,
          },
          latencyMs: null,
          createdAt: new Date().toISOString(),
        };

        setPendingMessage(optimisticMessage);
        await imageSearchMutation.mutateAsync({ sessionId, file: imageFile, clientImageUri: imageUri });
        setPendingMessage(null);
        setImageFile(null);
        if (imageInputRef.current) imageInputRef.current.value = "";
      } else if (voiceFile) {
        await voiceSearchMutation.mutateAsync({ sessionId, file: voiceFile });
        setVoiceFile(null);
        if (voiceInputRef.current) voiceInputRef.current.value = "";
      } else if (normalized) {
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

        await sendMessageMutation.mutateAsync({
          sessionId,
          message: normalized,
          historyLimit: 12,
        });

        setPendingMessage(null);
      }
      clearComposer();
    } catch (error: unknown) {
      setPendingMessage(null);
      if (normalized) {
        setDraft(normalized);
      }
      const message =
        error instanceof Error
          ? error.message
          : "Không thể nhận phản hồi từ AI. Vui lòng thử lại.";
      toast.error(message);
    }
  };

  const isLoading =
    sessionsQuery.isLoading ||
    (Boolean(activeSession?.id) && messagesQuery.isLoading);
  const isMediaSearching =
    imageSearchMutation.isPending || voiceSearchMutation.isPending;
  const canSend =
    (Boolean(draft.trim()) || Boolean(imageFile) || Boolean(voiceFile)) &&
    !isSending;

  const renderComposerAttachments = () => {
    if (imageFile) {
      const imageUrl = URL.createObjectURL(imageFile);
      return (
        <div className="mb-3 flex flex-wrap gap-2">
          <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <img
              src={imageUrl}
              alt="preview"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              disabled={isSending}
              onClick={() => {
                setImageFile(null);
                if (imageInputRef.current) imageInputRef.current.value = "";
              }}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/60 text-white transition-colors hover:bg-slate-900 disabled:opacity-50"
            >
              ×
            </button>
          </div>
        </div>
      );
    }

    if (voiceFile) {
      return (
        <div className="mb-3 flex flex-wrap gap-2">
          <div className="relative flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 pr-8">
            <AudioLines className="size-4 text-primary animate-pulse" />
            <span className="text-xs text-slate-600 truncate max-w-[150px]">
              {voiceFile.name}
            </span>
            <button
              type="button"
              disabled={isSending}
              onClick={() => {
                setVoiceFile(null);
                if (voiceInputRef.current) voiceInputRef.current.value = "";
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/60 text-white transition-colors hover:bg-slate-900 disabled:opacity-50"
            >
              ×
            </button>
          </div>
        </div>
      );
    }

    if (selectedProducts.length === 0) return null;

    return (
      <div className="mb-3 flex flex-wrap gap-2">
        {selectedProducts.map((product) => (
          <div
            key={product.id}
            className="relative w-40 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
          >
            <button
              type="button"
              disabled={isSending}
              onClick={() => {
                setSelectedProducts((prev) =>
                  prev.filter((p) => p.id !== product.id),
                );
              }}
              className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/60 text-white transition-colors hover:bg-slate-900 disabled:opacity-50"
            >
              ×
            </button>
            <div className="h-24 bg-slate-100">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="space-y-1 p-2">
              <p className="line-clamp-2 text-[11px] font-medium text-slate-700">
                {product.name}
              </p>
              <p className="text-[11px] font-semibold text-primary">
                {formatPrice(Number(product.price))}
              </p>
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
        className="fixed bottom-4 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-white border border-slate-200 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.2)] transition-transform hover:scale-105 sm:bottom-6 sm:right-6 overflow-hidden"
        aria-label="Mở chatbot"
      >
        <img
          src="/chatbot_2.png"
          alt="Finn Chatbot"
          className="h-[80%] w-[80%] object-contain"
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen} modal={false}>
        <DialogContent
          showCloseButton={false}
          showOverlay={false}
          className="fixed bottom-20 right-4 top-auto left-auto z-50 flex h-[min(82vh,52rem)] w-[calc(100vw-2rem)] max-w-[28rem] translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-[0_30px_80px_-24px_rgba(15,23,42,0.55)] sm:bottom-6 sm:right-6 sm:w-[28rem]"
        >
          <DialogHeader className="relative border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-1">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full  overflow-hidden">
                  <img
                    src="/chatbot_2.png"
                    alt="Finn"
                    className="h-[80%] w-[80%] object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="truncate text-sm font-semibold text-[#40BFFF]">
                    Finn
                  </DialogTitle>
                  <p className="mt-0.5 text-[10px] text-slate-500 truncate">
                    Có Finn, mua sắm đỉnh
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleNewSession}
                  disabled={
                    createSessionMutation.isPending ||
                    closeSessionMutation.isPending
                  }
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Cuộc trò chuyện mới"
                  title="Cuộc trò chuyện mới"
                >
                  {createSessionMutation.isPending ||
                  closeSessionMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                </button>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Online
                </span>
              </div>
            </div>
          </DialogHeader>

          <div
            ref={messagesContainerRef}
            className="flex-1 space-y-3 overflow-y-auto bg-white px-5 py-4"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                Đang khởi tạo trợ lý AI...
              </div>
            ) : null}

            {!isLoading && messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                <p className="text-sm font-semibold text-slate-900">
                  Bắt đầu cuộc trò chuyện
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Bạn có thể hỏi về sản phẩm, thương hiệu hoặc mức giá phù hợp.
                </p>
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

            {messages.map((message) => {
              const imageUri = message.metadata?.imageUri;
              const isImageSearchPlaceholder =
                message.role === "user" &&
                message.content.trim() === "[Tìm kiếm sản phẩm bằng hình ảnh]";
              const hasTextContent = Boolean(message.content.trim()) && !isImageSearchPlaceholder;

              return (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "flex max-w-[88%] flex-col gap-2",
                    message.role === "user" ? "items-end" : "items-start",
                  )}
                >
                  {message.role === "user" && imageUri ? (
                    <div className="w-fit overflow-hidden rounded-2xl bg-primary p-1">
                      <img
                        src={imageUri}
                        alt="Ảnh đã gửi"
                        className="h-44 w-44 rounded-xl object-cover"
                      />
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-primary-foreground/80">
                        <span>{formatTime(message.createdAt)}</span>
                        <CheckCheck className="size-3.5" />
                      </div>
                    </div>
                  ) : null}

                  {hasTextContent ? (
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm leading-relaxed w-fit",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "border border-slate-200 bg-slate-50 text-slate-700",
                      )}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    <div
                      className={cn(
                        "mt-1 flex items-center gap-1.5 text-[11px]",
                        message.role === "user"
                          ? "text-primary-foreground/80"
                          : "text-slate-400",
                      )}
                    >
                      <span>{formatTime(message.createdAt)}</span>
                      {message.role === "user" ? (
                        <CheckCheck className="size-3.5" />
                      ) : null}
                    </div>
                    </div>
                  ) : null}

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
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-xs font-semibold">
                                  {product.name}
                                </p>
                                <p
                                  className={cn(
                                    "mt-1 text-[11px]",
                                    message.role === "user"
                                      ? "text-white/75"
                                      : "text-slate-500",
                                  )}
                                >
                                  {product.brand ?? "FShop"}
                                  {product.category
                                    ? ` · ${product.category}`
                                    : ""}
                                </p>
                                <p
                                  className={cn(
                                    "mt-2 text-xs font-semibold",
                                    message.role === "user"
                                      ? "text-white"
                                      : "text-primary",
                                  )}
                                >
                                  {formatPrice(Number(product.price || 0))}
                                </p>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : null}
                </div>
              </div>
              );
            })}

            {isMediaSearching ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  <Loader2 className="size-3.5 animate-spin" />
                  {imageSearchMutation.isPending
                    ? "Đang tìm kiếm bằng hình ảnh..."
                    : "Đang xử lý giọng nói..."}
                </div>
              </div>
            ) : null}

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
                className="min-h-10 resize-none"
                disabled={isTypeDisabled("text")}
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
                  className="hidden"
                  onChange={(event) => {
                    handleImageFileSelect(event.target.files);
                    event.currentTarget.value = "";
                  }}
                />
                <input
                  ref={voiceInputRef}
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/webm,audio/mp4,audio/ogg"
                  className="hidden"
                  onChange={(event) => {
                    handleVoiceFileSelect(event.target.files);
                    event.currentTarget.value = "";
                  }}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isTypeDisabled("image")}
                >
                  {imageSearchMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="size-3.5" />
                  )}
                  Ảnh
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => voiceInputRef.current?.click()}
                  disabled={isTypeDisabled("voice")}
                >
                  {voiceSearchMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <AudioLines className="size-3.5" />
                  )}
                  Audio
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProductPickerOpen(true)}
                  disabled={isTypeDisabled("product")}
                >
                  <Store className="size-3.5" />
                  Sản phẩm
                  {selectedProducts.length > 0
                    ? ` (${selectedProducts.length})`
                    : ""}
                </Button>

                <div className="ml-auto flex items-center gap-2">
                  {draft.trim() ||
                  selectedProducts.length > 0 ||
                  imageFile ||
                  voiceFile ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearComposer}
                      disabled={isSending}
                    >
                      <Trash2 className="size-4" />
                      Xoá
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleSend()}
                    disabled={!canSend}
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
        </DialogContent>
      </Dialog>

      <Dialog open={isProductPickerOpen} onOpenChange={setIsProductPickerOpen}>
        <DialogContent className="max-h-[86vh] w-[calc(100vw-1.5rem)] max-w-3xl overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle>Chọn sản phẩm để gửi</DialogTitle>
          </DialogHeader>

          <Input
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
            placeholder="Tìm theo tên sản phẩm..."
            className="w-full"
          />

          <div className="grid max-h-[54vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            {productsQuery.isLoading ? (
              <div className="col-span-full flex items-center justify-center py-10 text-sm text-slate-500">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Đang tải sản phẩm...
              </div>
            ) : availableProducts.length > 0 ? (
              availableProducts.map((product) => {
                const selected = selectedProducts.some(
                  (item) => item.id === product.id,
                );

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product)}
                    className={cn(
                      "overflow-hidden rounded-2xl border text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 bg-white hover:border-primary/30 hover:bg-slate-50",
                    )}
                  >
                    <div className="flex gap-3 p-3">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {product.images?.[0]?.imageUrl ? (
                          <img
                            src={product.images[0].imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                          {product.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {product.brand?.name ?? "FShop"}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-primary">
                          {formatPrice(Number(product.price))}
                        </p>
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
            <p className="text-xs text-slate-500">
              Đã chọn {selectedProducts.length} sản phẩm.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsProductPickerOpen(false)}
              >
                Đóng
              </Button>
              <Button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
              >
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
