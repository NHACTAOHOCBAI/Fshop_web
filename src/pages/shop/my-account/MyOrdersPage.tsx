import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, MessageCircle, Package, Search, Store, Truck, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCancelOrder, useConfirmDelivery, useMyOrders } from "@/hooks/useOrders";
import { buildPaginationItems, cn, formatCurrency } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/order";

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
    pending: { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-600 border-amber-200" },
    confirmed: { label: "Đã xác nhận", className: "bg-blue-50 text-blue-600 border-blue-200" },
    processing: { label: "Đang xử lý", className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    shipped: { label: "Đang giao", className: "bg-indigo-50 text-indigo-600 border-indigo-200" },
    delivered: { label: "Đã giao", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    canceled: { label: "Đã huỷ", className: "bg-red-50 text-red-600 border-red-200" },
    return_requested: { label: "Yêu cầu trả hàng", className: "bg-orange-50 text-orange-700 border-orange-200" },
    returned: { label: "Đã trả hàng", className: "bg-slate-100 text-slate-700 border-slate-200" },
    refunded: { label: "Đã hoàn tiền", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const ORDER_TABS: { label: string; status?: OrderStatus }[] = [
    { label: "Tất cả" },
    { label: "Chờ xác nhận", status: "pending" },
    { label: "Chờ xử lý", status: "processing" },
    { label: "Đang giao", status: "shipped" },
    { label: "Đã giao", status: "delivered" },
    { label: "Đã huỷ", status: "canceled" },
    { label: "Hoàn tiền", status: "refunded" },
];

const SHIPPING_LABELS = {
    standard: "Vận chuyển tiêu chuẩn",
    express: "Vận chuyển hỏa tốc",
} as const;

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

const getStatusHeadline = (status: OrderStatus) => {
    switch (status) {
        case "pending":
            return "Shop đang chờ xác nhận đơn hàng của bạn";
        case "confirmed":
            return "Đơn hàng đã được xác nhận";
        case "processing":
            return "Shop đang chuẩn bị hàng";
        case "shipped":
            return "Đơn hàng đang được vận chuyển";
        case "delivered":
            return "Đơn hàng đã giao thành công";
        case "canceled":
            return "Đơn hàng đã được hủy";
        case "return_requested":
            return "Đơn hàng đang chờ xử lý hoàn trả";
        case "returned":
            return "Shop đã nhận lại hàng";
        case "refunded":
            return "Đơn hàng đã được hoàn tiền";
        default:
            return "Trạng thái đơn hàng";
    }
};

const MyOrdersPage = () => {
    const [activeTab, setActiveTab] = useState<string>("all");
    const [searchValue, setSearchValue] = useState("");
    const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 5;

    const activeStatus = useMemo(
        () => ORDER_TABS.find((tab) => (tab.status ?? "all") === activeTab)?.status,
        [activeTab]
    );

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearchValue(searchValue.trim());
        }, 400);

        return () => window.clearTimeout(timer);
    }, [searchValue]);

    useEffect(() => {
        setPage(1);
    }, [activeStatus, debouncedSearchValue]);

    const { data, isLoading, isFetching, isError, error } = useMyOrders({
        page,
        limit: pageSize,
        search: debouncedSearchValue || undefined,
        sortBy: "id",
        sortOrder: "DESC",
        status: activeStatus,
    });
    const { mutate: cancelOrder, isPending: isCanceling } = useCancelOrder();
    const { mutate: confirmDelivery, isPending: isConfirming } = useConfirmDelivery();
    const orders: Order[] = data?.data ?? [];
    const totalOrders = data?.meta?.pagination?.total ?? orders.length;
    const totalPages = Math.max(1, Math.ceil(totalOrders / pageSize));
    const paginationItems = useMemo(() => buildPaginationItems(page, totalPages), [page, totalPages]);

    const handleCancelOrder = (orderId: number) => {
        cancelOrder(
            { id: orderId },
            {
                onSuccess: () => {
                    toast.success(`Đã huỷ đơn #${orderId} thành công.`);
                },
                onError: (cancelError: Error) => {
                    toast.error(cancelError.message || "Không thể huỷ đơn hàng.");
                },
            }
        );
    };

    const handleConfirmDelivery = (orderId: number) => {
        confirmDelivery(orderId, {
            onSuccess: () => {
                toast.success(`Đã xác nhận nhận hàng cho đơn #${orderId}.`);
            },
            onError: (confirmError: Error) => {
                toast.error(confirmError.message || "Không thể xác nhận giao hàng.");
            },
        });
    };

    const handleChatWithShop = async (order: Order) => {
        const summary = `Đơn hàng #${order.id} - ${order.items
            .map((item) => item.variant?.product?.name ?? "Sản phẩm")
            .join(", ")}`;

        try {
            await navigator.clipboard.writeText(summary);
            toast.success(`Đã sao chép thông tin đơn #${order.id}. Có thể dùng để nhắn với shop.`);
            return;
        } catch {
            toast.message(`Nhắn tin với shop cho đơn #${order.id}`);
        }
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-xl font-bold text-slate-900">Đơn hàng của tôi</h1>
                <p className="mt-1 text-sm text-slate-500">Theo dõi trạng thái và thao tác nhanh với {totalOrders} đơn hàng.</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex overflow-x-auto border-b border-slate-200 text-sm">
                    {ORDER_TABS.map((tab) => {
                        const tabId = tab.status ?? "all";
                        const isActive = activeTab === tabId;

                        return (
                            <button
                                key={tab.label}
                                type="button"
                                onClick={() => setActiveTab(tabId)}
                                className={cn(
                                    "relative shrink-0 px-5 py-3 font-medium transition-colors",
                                    isActive
                                        ? "text-primary"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                )}
                            >
                                {tab.label}
                                {isActive ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" /> : null}
                            </button>
                        );
                    })}
                </div>

                <div className="bg-slate-50/80 p-4">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            placeholder="Tìm theo mã đơn, tên người nhận hoặc tên sản phẩm"
                            className="h-11 border-slate-200 bg-white pl-10"
                        />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                        Tìm kiếm sẽ gọi API sau khi bạn dừng nhập trong giây lát.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    <Loader2 className="mx-auto mb-2 size-5 animate-spin text-slate-400" />
                    Đang tải danh sách đơn hàng...
                </div>
            ) : isError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    Không thể tải đơn hàng: {error?.message || "Đã xảy ra lỗi"}
                </div>
            ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    Không tìm thấy đơn hàng phù hợp.
                </div>
            ) : null}

            {isFetching && !isLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="size-4 animate-spin" />
                    Đang cập nhật danh sách đơn hàng...
                </div>
            ) : null}

            <div className="space-y-4">
                {orders.map((order) => {
                    const statusCfg = STATUS_CONFIG[order.status];
                    const productCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                    const shippingLabel = SHIPPING_LABELS[order.shippingMethod];

                    return (
                        <article
                            key={`order-${order.id}`}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                        >
                            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-2">
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
                                            <Store className="size-4 text-primary" />
                                            FShop Official
                                        </span>
                                        <span className="rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-500">
                                            Đơn #{order.id}
                                        </span>
                                        <span className="text-xs text-slate-400">{formatDate(order.createdAt)}</span>
                                    </div>

                                    <p className="text-sm font-medium text-slate-800">{getStatusHeadline(order.status)}</p>

                                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                                            <Truck className="size-3.5" />
                                            {shippingLabel}
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                                            <Package className="size-3.5" />
                                            {productCount} sản phẩm
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 self-start sm:flex-col sm:items-end">
                                    <span
                                        className={cn(
                                            "rounded-full border px-2.5 py-1 text-xs font-semibold",
                                            statusCfg.className
                                        )}
                                    >
                                        {statusCfg.label}
                                    </span>
                                    <p className="text-sm text-slate-500">
                                        Thành tiền: <span className="text-lg font-bold text-primary">{formatCurrency(Number(order.totalAmount))}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 px-5 py-4">
                                {order.items.map((item) => {
                                    const imageUrl = item.variant?.imageUrl;
                                    const productName = item.variant?.product?.name || "Sản phẩm";

                                    return (
                                        <div
                                            key={`order-item-${item.id}`}
                                            className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
                                        >
                                            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-xs text-slate-400">
                                                {imageUrl ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={productName}
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    "No img"
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-slate-800 line-clamp-1">
                                                    {productName}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">Số lượng: x{item.quantity}</p>
                                                {order.note ? (
                                                    <p className="mt-1 line-clamp-1 text-xs text-slate-400">Ghi chú: {order.note}</p>
                                                ) : null}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-slate-700">
                                                    {formatCurrency(Number(item.price) * item.quantity)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-1 text-sm text-slate-500">
                                    <p>
                                        Giao đến: <span className="font-medium text-slate-700">{order.recipientName}</span>
                                    </p>
                                    <p className="line-clamp-1">
                                        {order.detailAddress}, {order.commune}, {order.district}, {order.province}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-9 gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
                                        onClick={() => handleChatWithShop(order)}
                                    >
                                        <MessageCircle className="size-4" />
                                        Nhắn tin với shop
                                    </Button>

                                    {(order.status === "pending" || order.status === "confirmed") && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="h-9 gap-1"
                                            disabled={isCanceling}
                                            onClick={() => handleCancelOrder(order.id)}
                                        >
                                            <XCircle className="size-4" />
                                            Huỷ đơn
                                        </Button>
                                    )}

                                    {order.status === "shipped" && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="h-9 gap-1"
                                            disabled={isConfirming}
                                            onClick={() => handleConfirmDelivery(order.id)}
                                        >
                                            <CheckCircle2 className="size-4" />
                                            Đã nhận hàng
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>

            {totalOrders > 0 ? (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm text-slate-500">
                        Trang <span className="font-semibold text-slate-900">{page}</span> / {totalPages} - {totalOrders} đơn hàng
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
                            disabled={page <= 1 || isFetching}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>

                        {paginationItems.map((item, index) => {
                            const previous = paginationItems[index - 1];
                            const shouldRenderEllipsis = previous !== undefined && item - previous > 1;

                            return (
                                <div key={item} className="flex items-center gap-2">
                                    {shouldRenderEllipsis ? <span className="px-1 text-slate-400">...</span> : null}
                                    <Button
                                        type="button"
                                        variant={item === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setPage(item)}
                                        disabled={isFetching}
                                        className={item === page ? "bg-primary text-white" : ""}
                                    >
                                        {item}
                                    </Button>
                                </div>
                            );
                        })}

                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                            disabled={page >= totalPages || isFetching}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default MyOrdersPage;
