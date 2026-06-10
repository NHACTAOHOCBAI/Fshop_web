import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Loader2, SendHorizontal, ShoppingCart, Users, Video } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    useCreateLivestreamComment,
    useLivestreamById,
    useLivestreamComments,
    useLivestreamRealtime,
} from "@/hooks/useLivestreams";
import { useAddToCart } from "@/hooks/useCart";
import { LivestreamViewer } from "@/components/livestream/LivestreamViewer";
import { authStorage } from "@/lib/auth";
import { useLivestreamContext } from "@/context/LivestreamContext";

const formatCommentTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--:--";

    const now = new Date();
    const isSameDay =
        now.getFullYear() === date.getFullYear() &&
        now.getMonth() === date.getMonth() &&
        now.getDate() === date.getDate();

    if (isSameDay) {
        return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    }

    return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};

const LivestreamDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const livestreamId = Number(id);
    const isValidId = Number.isInteger(livestreamId) && livestreamId > 0;
    const hasToken = Boolean(authStorage.getAccessToken());

    const [message, setMessage] = useState("");
    const [viewerCount, setViewerCount] = useState<number | null>(null);
    const [pendingCartVariantId, setPendingCartVariantId] = useState<number | null>(null);
    const chatScrollRef = useRef<HTMLDivElement | null>(null);
    const livestreamQuery = useLivestreamById(isValidId ? livestreamId : null, isValidId);
    const commentsQuery = useLivestreamComments(isValidId ? livestreamId : null, {
        page: 1,
        limit: 50,
        sortBy: "createdAt",
        sortOrder: "ASC",
    }, isValidId);

    const createCommentMutation = useCreateLivestreamComment();
    const { mutate: addToCart } = useAddToCart();

    const { setActiveLivestream, setShowFloating } = useLivestreamContext();
    const livestream = livestreamQuery.data?.data;
    const livestreamRef = useRef(livestream);

    useEffect(() => {
        livestreamRef.current = livestream;
        if (livestream && livestream.status === "live") {
            setActiveLivestream({
                id: livestream.id,
                agoraChannel: livestream.agoraChannel,
                title: livestream.title,
                coverImageUrl: livestream.coverImageUrl,
            });
            setShowFloating(false);
        }
    }, [livestream, setActiveLivestream, setShowFloating]);

    useEffect(() => {
        return () => {
            const currentLive = livestreamRef.current;
            if (currentLive && currentLive.status === "live") {
                setShowFloating(true);
            } else {
                setActiveLivestream(null);
                setShowFloating(false);
            }
        };
    }, [setActiveLivestream, setShowFloating]);

    useLivestreamRealtime({
        livestreamId: isValidId ? livestreamId : undefined,
        enabled: isValidId && hasToken,
        onViewerCountUpdated: (count) => setViewerCount(count),
    });

    const comments = commentsQuery.data?.data ?? [];
    const resolvedViewerCount = viewerCount ?? livestream?.viewerCount ?? 0;

    useEffect(() => {
        const element = chatScrollRef.current;
        if (!element) return;

        element.scrollTop = element.scrollHeight;
    }, [comments.length]);

    const sortedPinnedProducts = useMemo(
        () =>
            (livestream?.pinnedProducts ?? [])
                .slice()
                .sort((a, b) => a.position - b.position),
        [livestream?.pinnedProducts],
    );

    if (!isValidId) {
        return (
            <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center">
                <p className="text-slate-600">Livestream không hợp lệ.</p>
                <Button className="mt-4" onClick={() => navigate("/livestreams")}>Quay lại danh sách</Button>
            </div>
        );
    }

    const handleAddToCart = (variantId?: number) => {
        if (!hasToken) {
            toast.info("Vui lòng đăng nhập để thêm vào giỏ hàng");
            navigate("/login");
            return;
        }
        if (!variantId) {
            toast.error("Sản phẩm hiện tại không có sẵn hoặc hết hàng");
            return;
        }

        setPendingCartVariantId(variantId);
        addToCart(
            { variantId, quantity: 1, livestreamId },
            {
                onSuccess: () => {
                    toast.success("Đã thêm sản phẩm vào giỏ hàng!");
                },
                onError: (error: any) => {
                    toast.error(error.message || "Không thể thêm vào giỏ hàng");
                },
                onSettled: () => {
                    setPendingCartVariantId(null);
                },
            }
        );
    };

    const handleSubmitComment = (event: FormEvent) => {
        event.preventDefault();
        const content = message.trim();
        if (!content) return;

        createCommentMutation.mutate(
            {
                id: livestreamId,
                payload: { content },
            },
            {
                onSuccess: () => setMessage(""),
                onError: (error: any) => toast.error(error.message),
            },
        );
    };

    return (
        <div className="space-y-6 w-full">
            {livestreamQuery.isLoading ? (
                <div className="flex h-60 items-center justify-center rounded-2xl border border-slate-100 bg-white">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="size-6 animate-spin text-primary" />
                        <span className="text-xs text-slate-400">Đang tải chi tiết livestream...</span>
                    </div>
                </div>
            ) : !livestream ? (
                <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-400 text-sm">
                    Livestream không tồn tại hoặc đã bị ẩn.
                </div>
            ) : (
                <>
                    <section className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
                        {/* Left Column: Player & Pinned Products */}
                        <div className="space-y-5">
                            {/* Video Screen Wrapper */}
                            <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-black aspect-video w-full">
                                {livestream.status === "live" ? (
                                    <LivestreamViewer
                                        livestreamId={livestreamId}
                                        agoraChannel={livestream.agoraChannel}
                                        coverImageUrl={livestream.coverImageUrl}
                                    />
                                ) : (
                                    <div className="h-full w-full bg-linear-to-br from-slate-900 via-slate-800 to-slate-700 relative">
                                        {livestream.coverImageUrl ? (
                                            <img src={livestream.coverImageUrl} alt={livestream.title} className="h-full w-full object-cover opacity-80" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-slate-300">
                                                <Video className="size-12 opacity-50" />
                                            </div>
                                        )}
                                    </div>
                                )}
                                {livestream.status === "live" && (
                                    <>
                                        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold tracking-wider text-white animate-pulse">
                                            <span className="size-1.5 rounded-full bg-white" />
                                            TRỰC TIẾP
                                        </div>
                                        <div className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                                            <Users className="size-3" />
                                            {resolvedViewerCount} đang xem
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Header Info */}
                            <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-3">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Chi tiết livestream</span>
                                    <h1 className="text-xl font-bold text-slate-900 mt-1">{livestream.title}</h1>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">{livestream.description || "Phiên livestream trình diễn xu hướng thời trang mới cùng nhiều mã giảm giá và quà tặng hấp dẫn."}</p>

                                {!hasToken && (
                                    <div className="pt-2">
                                        <Button asChild className="text-xs h-8 font-semibold rounded-xl px-4">
                                            <Link to="/login">Đăng nhập để tham gia chat</Link>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Pinned Products Grid */}
                            <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4">
                                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 border-b border-slate-50 pb-3">
                                    Sản phẩm trong Livestream ({sortedPinnedProducts.length})
                                </h3>
                                {sortedPinnedProducts.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-6">Host chưa ghim sản phẩm nào.</p>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {sortedPinnedProducts.map((item) => {
                                            if (!item.product) return null;
                                            const firstVariant = item.product.variants?.find((v) => v.isActive) ?? item.product.variants?.[0];
                                            const canAddToCart = Boolean(firstVariant);
                                            const isAddingThisProduct = pendingCartVariantId === firstVariant?.id;
                                            const productImage = item.product.images?.find((img) => img.imageUrl)?.imageUrl ?? item.product.variants?.find((v) => v.imageUrl)?.imageUrl;

                                            return (
                                                <div key={item.id} className="group flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-3 hover:border-primary/30 transition-colors">
                                                    <div className="flex gap-3">
                                                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-50 border border-slate-100">
                                                            {productImage ? (
                                                                <img
                                                                    src={productImage}
                                                                    alt={item.product.name}
                                                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">Không ảnh</div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1 space-y-1">
                                                            <h4 className="line-clamp-2 text-xs font-bold text-slate-700 leading-normal group-hover:text-primary transition-colors">
                                                                {item.product.name}
                                                            </h4>
                                                            <p className="text-xs font-bold text-primary">
                                                                {Number(item.product.price).toLocaleString("vi-VN")}đ
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 flex gap-2">
                                                        <Button asChild size="sm" variant="outline" className="flex-1 h-8 text-[11px] rounded-lg">
                                                            <Link to={`/men/products/${item.productId}?livestreamId=${livestreamId}`}>Xem chi tiết</Link>
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            className="flex-1 h-8 text-[11px] rounded-lg gap-1"
                                                            disabled={isAddingThisProduct || !canAddToCart}
                                                            onClick={() => handleAddToCart(firstVariant?.id)}
                                                        >
                                                            {isAddingThisProduct ? (
                                                                <Loader2 className="size-3 animate-spin" />
                                                            ) : (
                                                                <ShoppingCart className="size-3" />
                                                            )}
                                                            {canAddToCart ? "Thêm vào giỏ" : "Hết hàng"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Live Chat Panel */}
                        <aside className="rounded-2xl border border-slate-100 bg-white p-5 flex flex-col h-[500px] lg:h-auto lg:min-h-[500px]">
                            <div className="border-b border-slate-50 pb-3 mb-3 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                        Trò chuyện trực tiếp
                                    </h3>
                                    <p className="text-[10px] text-slate-400">Kết nối thời gian thực với cộng đồng mua sắm</p>
                                </div>
                                {livestream.status === "live" && (
                                    <div className="flex items-center gap-1 bg-red-50 border border-red-100 rounded-full px-2 py-0.5 text-[9px] text-red-600 font-bold">
                                        <Users className="size-2.5" />
                                        <span>{resolvedViewerCount} xem</span>
                                    </div>
                                )}
                            </div>

                            {/* Comments Container */}
                            <div ref={chatScrollRef} className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-slate-50/50 border border-slate-100 p-3.5 max-h-[350px] lg:max-h-[450px]">
                                {commentsQuery.isLoading ? (
                                    <div className="flex h-full items-center justify-center">
                                        <Loader2 className="size-5 animate-spin text-slate-400" />
                                    </div>
                                ) : comments.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-8">Chưa có bình luận nào trong buổi live.</p>
                                ) : (
                                    comments.map((comment) => {
                                        const isAdmin = comment.user?.role === "admin";
                                        return (
                                            <div 
                                                key={comment.id} 
                                                className={`rounded-xl p-2.5 space-y-1 text-xs border ${
                                                    isAdmin 
                                                        ? "bg-primary/5 border-primary/10" 
                                                        : "bg-white border-slate-100 shadow-xs"
                                                }`}
                                            >
                                                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                                                    <span className={isAdmin ? "text-primary font-bold" : "text-slate-700"}>
                                                        {comment.user?.fullName || `Khách #${comment.userId}`}
                                                    </span>
                                                    {isAdmin && <span className="bg-primary/10 text-primary px-1 rounded text-[8px] font-bold">Host</span>}
                                                    <span className="text-[8px] text-slate-400 font-sans font-normal">
                                                        {formatCommentTime(comment.createdAt)}
                                                    </span>
                                                </p>
                                                <p className="text-slate-600 leading-normal font-medium">{comment.content}</p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Chat Form */}
                            <form onSubmit={handleSubmitComment} className="mt-3 flex gap-2">
                                <Input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={hasToken ? "Gửi lời bình luận đến host..." : "Đăng nhập để chat"}
                                    disabled={!hasToken || createCommentMutation.isPending}
                                    className="h-9 text-xs rounded-xl border-slate-100"
                                />
                                <Button type="submit" size="sm" className="h-9 px-3.5 rounded-xl" disabled={!hasToken || message.trim().length === 0 || createCommentMutation.isPending}>
                                    {createCommentMutation.isPending ? (
                                        <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                        <SendHorizontal className="size-3.5" />
                                    )}
                                </Button>
                            </form>
                        </aside>
                    </section>
                </>
            )}
        </div>
    );
};

export default LivestreamDetailPage;
