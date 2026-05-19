import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORDER_STATUS_LABEL, ORDER_STATUS_OPTIONS, getAdminAllowedNextStatuses } from "@/constants/orderStatus";
import { useAllOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { formatCurrency } from "@/lib/utils";
import { AddressDisplay } from "@/components/address/AddressDisplay";
import type { OrderStatus } from "@/types/order";

const PAGE_SIZES = [2, 4, 10, 20, 25, 30, 40, 50];

const OrdersPage = () => {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

    const { data, isLoading, isFetching, isError, error } = useAllOrders({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        sortBy: "id",
        sortOrder: "DESC",
    });

    const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateOrderStatus();

    const orders = data?.data ?? [];
    const total = data?.meta?.pagination?.total ?? orders.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const handleUpdateStatus = (orderId: number, nextStatus: OrderStatus) => {
        updateStatus(
            { id: orderId, payload: { status: nextStatus } },
            {
                onSuccess: () => toast.success(`Đã cập nhật đơn #${orderId} -> ${ORDER_STATUS_LABEL[nextStatus]}`),
                onError: (updateError: Error) => toast.error(updateError.message || "Không thể cập nhật trạng thái."),
            }
        );
    };



    return (
        <div className="space-y-4  w-full">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Quản lý đơn hàng</h1>
                <p className="mt-1 text-sm text-slate-500">Theo dõi và cập nhật trạng thái đơn hàng từ API Orders.</p>
            </div>

            <div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Input
                        placeholder="Tìm theo ghi chú hoặc địa chỉ..."
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        className="w-full md:max-w-sm"
                    />

                    <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                            setStatusFilter(value as OrderStatus | "all");
                            setPage(1);
                        }}
                    >
                        <SelectTrigger className="w-full md:w-56">
                            <SelectValue placeholder="Lọc theo trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            {ORDER_STATUS_OPTIONS.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    <Loader2 className="mx-auto mb-2 size-5 animate-spin text-slate-400" />
                    Đang tải đơn hàng...
                </div>
            ) : isError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    Không thể tải danh sách đơn: {error?.message || "Đã xảy ra lỗi"}
                </div>
            ) : orders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    Không có đơn hàng phù hợp.
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((order) => (
                        <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-1 text-sm text-slate-600">
                                    <p>
                                        Đơn <span className="font-semibold text-slate-900">#{order.id}</span> - Người nhận: {order.recipientName}
                                    </p>
                                    <p>
                                        Địa chỉ: <AddressDisplay address={order} />
                                    </p>
                                    <p>
                                        Tổng tiền: <span className="font-semibold text-primary">{formatCurrency(Number(order.totalAmount))}</span>
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link to={`/admin/orders/${order.id}`}>Chi tiết</Link>
                                    </Button>

                                    <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                        {ORDER_STATUS_LABEL[order.status] || order.status}
                                    </span>

                                    <Select
                                        value={order.status}
                                        onValueChange={(value) => handleUpdateStatus(order.id, value as OrderStatus)}
                                        disabled={isUpdatingStatus || getAdminAllowedNextStatuses(order.status).length === 0}
                                    >
                                        <SelectTrigger className="w-full sm:w-48">
                                            <SelectValue placeholder="Cập nhật trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem key={`${order.id}-current-${order.status}`} value={order.status} disabled>
                                                {ORDER_STATUS_LABEL[order.status]} (hiện tại)
                                            </SelectItem>
                                            {getAdminAllowedNextStatuses(order.status).map((status) => (
                                                <SelectItem key={`${order.id}-${status}`} value={status}>
                                                    {ORDER_STATUS_LABEL[status]}
                                                </SelectItem>
                                            ))}
                                            {getAdminAllowedNextStatuses(order.status).length === 0 ? (
                                                <div className="px-2 py-1.5 text-xs text-slate-500">Không có trạng thái kế tiếp hợp lệ.</div>
                                            ) : null}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {total > 0 ? (
                <div className="flex flex-col items-start justify-between gap-3 px-2 sm:flex-row sm:items-center">
                    <div className="text-sm text-muted-foreground">
                        {orders.length} dòng
                    </div>
                    <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">Số dòng mỗi trang</p>
                            <Select
                                value={`${pageSize}`}
                                onValueChange={(value) => {
                                    setPageSize(Number(value));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-19">
                                    <SelectValue placeholder="Dòng" />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {PAGE_SIZES.map((size) => (
                                        <SelectItem key={size} value={`${size}`}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="min-w-28 text-sm font-medium">
                            Trang {page} / {totalPages}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => setPage(1)}
                                disabled={page <= 1 || isFetching}
                            >
                                <span className="sr-only">Về trang đầu</span>
                                <ChevronsLeft className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1 || isFetching}
                            >
                                <span className="sr-only">Về trang trước</span>
                                <ChevronLeft className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages || isFetching}
                            >
                                <span className="sr-only">Tới trang sau</span>
                                <ChevronRight className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => setPage(totalPages)}
                                disabled={page >= totalPages || isFetching}
                            >
                                <span className="sr-only">Tới trang cuối</span>
                                <ChevronsRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default OrdersPage;
