import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
    ArrowLeft,
    BarChart2,
    Check,
    Loader2,
    MessageSquare,
    Play,
    Radio,
    Search,
    Square,
    Tv,
    Users,
    X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LivestreamPublisher } from "@/components/livestream/LivestreamPublisher";
import { useProducts } from "@/hooks/useProducts";
import {
    useEndLivestream,
    useLivestreamById,
    usePinLivestreamProductsBatch,
    useStartLivestream,
    useUnpinLivestreamProduct,
    useLivestreamComments,
    useLivestreamRealtime,
    useCreateLivestreamComment,
} from "@/hooks/useLivestreams";
import type { Product } from "@/types/product";
import { authStorage } from "@/lib/auth";

const statusStyles = {
    scheduled: "bg-amber-50 text-amber-700 border border-amber-200/60",
    live: "bg-red-50 text-red-700 border border-red-200/60 animate-pulse",
    ended: "bg-slate-100 text-slate-600 border border-slate-200/60",
};

const statusLabels = {
    scheduled: "Chưa diễn ra",
    live: "Đang phát",
    ended: "Đã kết thúc",
};

const formatCurrency = (value: number | string) =>
    Number(value || 0).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
    });

const getProductImage = (product?: Product | null) =>
    product?.images?.find((image) => image.imageUrl)?.imageUrl ??
    product?.variants?.find((variant) => variant.imageUrl)?.imageUrl;

const ProductPinPicker = ({
    products,
    selectedProducts,
    search,
    isLoading,
    disabledProductIds,
    onSearchChange,
    onToggleSelect,
    onRemove,
}: {
    products: Product[];
    selectedProducts: Product[];
    search: string;
    isLoading: boolean;
    disabledProductIds: Set<number>;
    onSearchChange: (value: string) => void;
    onToggleSelect: (product: Product) => void;
    onRemove: (productId: number) => void;
}) => {
    return (
        <div className="space-y-2">
            <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Tìm sản phẩm theo tên..."
                    className="pl-8 h-9 text-xs"
                />
            </div>

            {selectedProducts.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-slate-100 bg-slate-50 max-h-24 overflow-y-auto">
                    {selectedProducts.map((product) => (
                        <div key={product.id} className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 text-[11px] text-emerald-800 font-medium max-w-full">
                            <span className="truncate max-w-[150px]">{product.name}</span>
                            <button type="button" onClick={() => onRemove(product.id)} className="text-emerald-600 hover:text-emerald-800 rounded-full hover:bg-emerald-100 p-0.5 transition-colors">
                                <X className="size-3" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : null}

            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-100 bg-white p-1">
                {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400">
                        <Loader2 className="size-3.5 animate-spin" />
                        Đang tìm...
                    </div>
                ) : products.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-400">Không tìm thấy sản phẩm.</p>
                ) : (
                    products.map((product) => {
                        const imageUrl = getProductImage(product);
                        const isSelected = selectedProducts.some((p) => p.id === product.id);
                        const isPinned = disabledProductIds.has(product.id);

                        return (
                            <button
                                key={product.id}
                                type="button"
                                disabled={isPinned}
                                onClick={() => onToggleSelect(product)}
                                className="flex w-full items-center gap-2 rounded-md p-1.5 text-left text-xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {imageUrl ? (
                                    <img src={imageUrl} alt={product.name} className="size-8 rounded object-cover" />
                                ) : (
                                    <div className="flex size-8 items-center justify-center rounded bg-slate-100 text-[10px] text-slate-400 font-sans">N/A</div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-slate-800">{product.name}</p>
                                    <p className="text-slate-400 font-mono text-[10px]">#{product.id} - {formatCurrency(product.price)}</p>
                                </div>
                                {isPinned ? (
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500 font-medium">Đã ghim</span>
                                ) : (
                                    <div className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${isSelected ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white"}`}>
                                        {isSelected && <Check className="size-3 stroke-[3]" />}
                                    </div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default function LivestreamSessionPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const livestreamId = Number(id);
    const isValidId = Number.isInteger(livestreamId) && livestreamId > 0;
    const hasToken = Boolean(authStorage.getAccessToken());

    const [adminMessage, setAdminMessage] = useState("");
    const [viewerCount, setViewerCount] = useState<number | null>(null);
    const [pinProductSearch, setPinProductSearch] = useState("");
    const [selectedPinProducts, setSelectedPinProducts] = useState<Product[]>([]);

    const chatScrollRef = useRef<HTMLDivElement | null>(null);

    const livestreamQuery = useLivestreamById(isValidId ? livestreamId : null, isValidId);
    const livestream = livestreamQuery.data?.data;

    const commentsQuery = useLivestreamComments(
        isValidId ? livestreamId : null,
        {
            page: 1,
            limit: 100,
            sortBy: "createdAt",
            sortOrder: "ASC",
        },
        isValidId
    );
    const comments = commentsQuery.data?.data ?? [];

    const productsQuery = useProducts({
        page: 1,
        limit: 10,
        search: pinProductSearch.trim() || undefined,
        sortBy: "createdAt",
        sortOrder: "DESC",
    });

    const startMutation = useStartLivestream();
    const endMutation = useEndLivestream();
    const pinBatchMutation = usePinLivestreamProductsBatch();
    const unpinMutation = useUnpinLivestreamProduct();
    const createCommentMutation = useCreateLivestreamComment();

    useLivestreamRealtime({
        livestreamId: isValidId ? livestreamId : undefined,
        enabled: isValidId && hasToken,
        onViewerCountUpdated: (count) => setViewerCount(count),
    });

    const productOptions = productsQuery.data?.data ?? [];
    const pinnedProductIds = useMemo(
        () => new Set((livestream?.pinnedProducts ?? []).map((product) => product.productId)),
        [livestream?.pinnedProducts]
    );

    const resolvedViewerCount = viewerCount ?? livestream?.viewerCount ?? 0;

    useEffect(() => {
        const element = chatScrollRef.current;
        if (element) {
            element.scrollTop = element.scrollHeight;
        }
    }, [comments.length]);

    if (!isValidId) {
        return (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <p className="text-slate-600">Phiên livestream không hợp lệ.</p>
                <Button className="mt-4" onClick={() => navigate("/admin/livestreams")}>
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    const handleGoLive = () => {
        startMutation.mutate(livestreamId, {
            onSuccess: () => {
                toast.success("Livestream đã bắt đầu");
                void livestreamQuery.refetch();
            },
            onError: (error) => toast.error(error.message),
        });
    };

    const handleEnd = () => {
        endMutation.mutate(livestreamId, {
            onSuccess: () => {
                toast.success("Livestream đã kết thúc");
                void livestreamQuery.refetch();
            },
            onError: (error) => toast.error(error.message),
        });
    };

    const handlePinProduct = () => {
        const productIds = selectedPinProducts.map((p) => p.id);

        if (productIds.length === 0) {
            toast.error("Vui lòng chọn ít nhất một sản phẩm");
            return;
        }

        pinBatchMutation.mutate(
            {
                id: livestreamId,
                payload: { productIds },
            },
            {
                onSuccess: () => {
                    toast.success("Đã ghim các sản phẩm thành công");
                    setSelectedPinProducts([]);
                    setPinProductSearch("");
                    void livestreamQuery.refetch();
                },
                onError: (error) => toast.error(error.message),
            }
        );
    };

    const handleToggleSelectProduct = (product: Product) => {
        setSelectedPinProducts((prev) => {
            const exists = prev.some((p) => p.id === product.id);
            if (exists) {
                return prev.filter((p) => p.id !== product.id);
            } else {
                return [...prev, product];
            }
        });
    };

    const handleRemoveSelectedProduct = (productId: number) => {
        setSelectedPinProducts((prev) => prev.filter((p) => p.id !== productId));
    };

    const handleUnpinProduct = (productId: number) => {
        unpinMutation.mutate(
            { id: livestreamId, productId },
            {
                onSuccess: () => {
                    toast.success("Đã bỏ ghim sản phẩm");
                    void livestreamQuery.refetch();
                },
                onError: (error) => toast.error(error.message),
            }
        );
    };

    const handleSendAdminMessage = (e: React.FormEvent) => {
        e.preventDefault();
        const content = adminMessage.trim();
        if (!content) return;

        createCommentMutation.mutate(
            {
                id: livestreamId,
                payload: { content },
            },
            {
                onSuccess: () => setAdminMessage(""),
                onError: (error) => toast.error(error.message),
            }
        );
    };

    return (
        <div className="space-y-6 w-full">
            {/* Header & Back Action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon-sm" className="h-8 w-8" onClick={() => navigate("/admin/livestreams")}>
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold flex items-center gap-2">
                            {livestream?.title || "Đang tải chi tiết..."}
                            {livestream && (
                                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusStyles[livestream.status]}`}>
                                    {statusLabels[livestream.status]}
                                </span>
                            )}
                        </h1>
                        <p className="text-xs text-slate-500">Mã kênh phát sóng: {livestream?.agoraChannel || "N/A"}</p>
                    </div>
                </div>

                {/* Broadcast State Controller */}
                {livestream && (
                    <div className="flex items-center gap-2">
                        {livestream.status === "ended" ? (
                            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate(`/admin/livestreams/${livestream.id}/summary`)}>
                                <BarChart2 className="size-3.5 mr-1" />
                                Tổng kết phiên live
                            </Button>
                        ) : livestream.status !== "live" ? (
                            <Button size="sm" className="h-8 text-xs bg-red-600 hover:bg-red-700" onClick={handleGoLive}>
                                <Play className="size-3.5 mr-1 fill-current" />
                                Go Live (Bắt đầu)
                            </Button>
                        ) : (
                            <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={handleEnd}>
                                <Square className="size-3.5 mr-1" />
                                End Live (Kết thúc)
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Split Layout: Stream & Products vs Live Chat */}
            <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
                {/* Left Side: Video Stream & Product pinning */}
                <div className="space-y-6">
                    {/* Live Video Frame */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <h3 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
                            <Radio className="size-4 text-red-500 animate-pulse" /> Màn hình phát sóng
                        </h3>
                        {livestreamQuery.isLoading ? (
                            <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-slate-900 text-slate-400">
                                <Loader2 className="size-6 animate-spin" />
                            </div>
                        ) : livestream?.status === "live" ? (
                            <LivestreamPublisher
                                livestreamId={livestreamId}
                                agoraChannel={livestream.agoraChannel}
                            />
                        ) : (
                            <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl bg-slate-900 text-slate-400 p-4 text-center">
                                <Tv className="size-10 mb-2 opacity-50" />
                                <p className="text-sm font-medium">Buổi livestream chưa bắt đầu hoặc đã kết thúc.</p>
                                <p className="text-xs text-slate-500 mt-1">Vui lòng bấm nút "Go Live" để khởi chạy camera phát sóng.</p>
                            </div>
                        )}
                    </div>

                    {/* Product Pinning Module */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 grid gap-6 md:grid-cols-2">
                        {/* Pin selector form */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Ghim sản phẩm mới</h4>
                            <ProductPinPicker
                                products={productOptions}
                                selectedProducts={selectedPinProducts}
                                search={pinProductSearch}
                                isLoading={productsQuery.isLoading}
                                disabledProductIds={pinnedProductIds}
                                onSearchChange={setPinProductSearch}
                                onToggleSelect={handleToggleSelectProduct}
                                onRemove={handleRemoveSelectedProduct}
                            />
                            <div className="flex justify-end pt-2">
                                <Button size="sm" className="h-8 text-xs px-4 w-full" onClick={handlePinProduct} disabled={pinBatchMutation.isPending || selectedPinProducts.length === 0}>
                                    {pinBatchMutation.isPending ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
                                    Ghim sản phẩm ({selectedPinProducts.length})
                                </Button>
                            </div>
                        </div>

                        {/* List of currently pinned products */}
                        <div className="space-y-4 border-t pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-6">
                            <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Sản phẩm đang hiển thị ({livestream?.pinnedProducts.length ?? 0})</h4>
                            {livestreamQuery.isLoading ? (
                                <div className="flex py-6 justify-center">
                                    <Loader2 className="size-4 animate-spin text-slate-400" />
                                </div>
                            ) : !livestream || livestream.pinnedProducts.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-8">Chưa ghim sản phẩm nào lên màn hình.</p>
                            ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {livestream.pinnedProducts
                                        .slice()
                                        .sort((a, b) => a.position - b.position)
                                        .map((product) => {
                                            const pinnedProductImage = getProductImage(product.product);
                                            return (
                                                <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-2.5 hover:bg-slate-50 transition-colors">
                                                    <div className="flex min-w-0 items-center gap-2">
                                                        {pinnedProductImage ? (
                                                            <img src={pinnedProductImage} alt={product.product?.name ?? `Product #${product.productId}`} className="size-10 rounded object-cover shrink-0" />
                                                        ) : (
                                                            <div className="flex size-10 shrink-0 items-center justify-center rounded bg-slate-100 text-[9px] text-slate-400">Không ảnh</div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="truncate text-xs font-semibold text-slate-700">{product.product?.name ?? `Product #${product.productId}`}</p>
                                                            <p className="text-[10px] text-slate-400">Vị trí ghim: {product.position}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleUnpinProduct(product.productId)}
                                                    >
                                                        <X className="size-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Realtime Chat Container */}
                <aside className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col h-[500px] lg:h-auto lg:min-h-[500px]">
                    <div className="border-b pb-4 mb-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                                <MessageSquare className="size-4 text-primary" /> Live Chat bình luận
                            </h3>
                            <p className="text-[11px] text-muted-foreground">Đồng bộ bình luận trực tiếp từ khách hàng</p>
                        </div>
                        {livestream?.status === "live" && (
                            <div className="flex items-center gap-1 bg-red-50 border border-red-100 rounded-full px-2 py-0.5 text-[10px] text-red-600 font-semibold">
                                <Users className="size-3" />
                                <span>{resolvedViewerCount} xem</span>
                            </div>
                        )}
                    </div>

                    {/* Chat view box */}
                    <div ref={chatScrollRef} className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-50 bg-slate-50 p-3.5 max-h-[350px] lg:max-h-[450px]">
                        {commentsQuery.isLoading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="size-5 animate-spin text-slate-400" />
                            </div>
                        ) : comments.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-10">Chưa có bình luận nào trong phiên livestream này.</p>
                        ) : (
                            comments.map((comment) => {
                                const isAdmin = comment.user?.role === "admin";
                                return (
                                    <div key={comment.id} className="rounded-lg bg-white border border-slate-100 p-2.5 space-y-0.5">
                                        <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                                            <span className={isAdmin ? "text-primary font-semibold" : "text-slate-800"}>
                                                {comment.user?.fullName || `Khách #${comment.userId}`}
                                            </span>
                                            {isAdmin && <span className="bg-primary/10 text-primary px-1 rounded text-[8px]">Admin</span>}
                                            <span className="text-[8px] text-slate-400 font-sans font-normal">
                                                {new Date(comment.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </p>
                                        <p className="text-xs text-slate-700 leading-relaxed">{comment.content}</p>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Admin chat response box */}
                    <form onSubmit={handleSendAdminMessage} className="mt-4 flex gap-2">
                        <Input
                            value={adminMessage}
                            onChange={(e) => setAdminMessage(e.target.value)}
                            placeholder={livestream?.status === "live" ? "Trả lời bình luận với tư cách Admin..." : "Phải bắt đầu phát sóng mới có thể chat"}
                            disabled={livestream?.status !== "live" || createCommentMutation.isPending}
                            className="h-9 text-xs"
                        />
                        <Button type="submit" size="sm" className="h-9 text-xs px-4" disabled={livestream?.status !== "live" || adminMessage.trim().length === 0 || createCommentMutation.isPending}>
                            {createCommentMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : "Gửi"}
                        </Button>
                    </form>
                </aside>
            </div>

            {/* Post session summary details */}
        </div>
    );
}
