import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import OrderStatusTimeline from "@/components/orders/OrderStatusTimeline";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORDER_STATUS_LABEL, getAdminAllowedNextStatuses } from "@/constants/orderStatus";
import { useOrderById, useUpdateOrderStatus } from "@/hooks/useOrders";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { AddressDisplay } from "@/components/address/AddressDisplay";
import type { OrderStatus } from "@/types/order";

const OrderDetailAdminPage = () => {
    const params = useParams<{ orderId?: string }>();
    const orderId = Number(params.orderId);
    const { data, isLoading, isError, error } = useOrderById(orderId, Number.isFinite(orderId));
    const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateOrderStatus();

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                <Loader2 className="mx-auto mb-2 size-5 animate-spin text-slate-400" />
                Đang tải chi tiết đơn hàng...
            </div>
        );
    }

    if (isError || !data?.data) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                Không thể tải chi tiết đơn hàng: {error?.message || "Đã xảy ra lỗi"}
            </div>
        );
    }

    const order = data.data;
    const subtotal = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const allowedNextStatuses = getAdminAllowedNextStatuses(order.status);

    const handleUpdateStatus = (nextStatus: OrderStatus) => {
        updateStatus(
            { id: order.id, payload: { status: nextStatus } },
            {
                onSuccess: () => toast.success(`Đã cập nhật đơn #${order.id} -> ${ORDER_STATUS_LABEL[nextStatus]}`),
                onError: (updateError: Error) => toast.error(updateError.message || "Không thể cập nhật trạng thái."),
            }
        );
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="ghost" size="sm" asChild>
                    <Link to="/admin/orders" className="gap-1.5">
                        <ArrowLeft className="size-4" />
                        Quay lại danh sách đơn
                    </Link>
                </Button>
                <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500">Đơn #{order.id}</span>
            </div>

            <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <OrderStatusTimeline currentStatus={order.status} />
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-sm text-slate-600">Cập nhật trạng thái:</span>
                    <Select
                        value={order.status}
                        onValueChange={(value) => handleUpdateStatus(value as OrderStatus)}
                        disabled={isUpdatingStatus || allowedNextStatuses.length === 0}
                    >
                        <SelectTrigger className="w-full sm:w-56">
                            <SelectValue placeholder="Cập nhật trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem key={`current-${order.status}`} value={order.status} disabled>
                                {ORDER_STATUS_LABEL[order.status]} (hiện tại)
                            </SelectItem>
                            {allowedNextStatuses.map((status) => (
                                <SelectItem key={status} value={status}>
                                    {ORDER_STATUS_LABEL[status]}
                                </SelectItem>
                            ))}
                            {allowedNextStatuses.length === 0 ? (
                                <div className="px-2 py-1.5 text-xs text-slate-500">Không có trạng thái kế tiếp hợp lệ.</div>
                            ) : null}
                        </SelectContent>
                    </Select>
                </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                <h1 className="text-lg font-bold text-slate-900">Thông tin đơn hàng</h1>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <p>Người nhận: <span className="font-medium text-slate-800">{order.recipientName}</span></p>
                    <p>SĐT: <span className="font-medium text-slate-800">{order.recipientPhone || "-"}</span></p>
                    <p>Ngày tạo: <span className="font-medium text-slate-800">{formatDateTime(order.createdAt)}</span></p>
                    <p>Cập nhật: <span className="font-medium text-slate-800">{formatDateTime(order.updatedAt)}</span></p>
                    <p>Vận chuyển: <span className="font-medium text-slate-800">{order.shippingMethod}</span></p>
                    <p>Số lượng SP: <span className="font-medium text-slate-800">{totalItems}</span></p>
                    {order.note ? <p className="sm:col-span-2">Ghi chú: <span className="font-medium text-slate-800">{order.note}</span></p> : null}
                    <p className="sm:col-span-2">
                        Địa chỉ: <AddressDisplay address={order} className="font-medium text-slate-800" />
                    </p>
                </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900">Sản phẩm trong đơn</h3>
                <div className="mt-3 space-y-2">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                            <div className="size-14 overflow-hidden rounded-md bg-slate-100">
                                {item.variant?.imageUrl ? (
                                    <img src={item.variant.imageUrl} alt={item.variant.product?.name} className="h-full w-full object-cover" />
                                ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="line-clamp-1 text-sm font-medium text-slate-800">{item.variant?.product?.name || "Sản phẩm"}</p>
                                <p className="text-xs text-slate-500">x{item.quantity}</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-800">{formatCurrency(Number(item.price) * item.quantity)}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-3 border-t border-slate-100 pt-3 text-right text-sm">
                    <p className="text-slate-500">Tạm tính: {formatCurrency(subtotal)}</p>
                    <p className="text-slate-500">Phí ship: {formatCurrency(Number(order.shippingFee))}</p>
                    <p className="text-base font-bold text-primary">Tổng tiền: {formatCurrency(Number(order.totalAmount))}</p>
                </div>
            </article>
        </div>
    );
};

export default OrderDetailAdminPage;
