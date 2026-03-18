import { ArrowLeft, Loader2, Package } from "lucide-react";
import { Link, useParams } from "react-router";

import OrderStatusTimeline from "@/components/orders/OrderStatusTimeline";
import { Button } from "@/components/ui/button";
import { useMyOrderById } from "@/hooks/useOrders";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const OrderDetailPage = () => {
    const params = useParams<{ orderId?: string }>();
    const orderId = Number(params.orderId);
    const { data, isLoading, isError, error } = useMyOrderById(orderId, Number.isFinite(orderId));

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

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" asChild>
                    <Link to="/my-account/orders" className="gap-1.5">
                        <ArrowLeft className="size-4" />
                        Quay lại đơn hàng
                    </Link>
                </Button>
                <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500">Đơn #{order.id}</span>
            </div>

            <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <OrderStatusTimeline currentStatus={order.status} />
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <h1 className="text-lg font-bold text-slate-900">Chi tiết đơn hàng</h1>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <p>Người nhận: <span className="font-medium text-slate-800">{order.recipientName}</span></p>
                    <p>SĐT: <span className="font-medium text-slate-800">{order.recipientPhone || "-"}</span></p>
                    <p>Trạng thái: <span className="font-medium text-slate-800">{order.status}</span></p>
                    <p>Vận chuyển: <span className="font-medium text-slate-800">{order.shippingMethod}</span></p>
                    <p>Ngày tạo: <span className="font-medium text-slate-800">{formatDateTime(order.createdAt)}</span></p>
                    <p>Cập nhật: <span className="font-medium text-slate-800">{formatDateTime(order.updatedAt)}</span></p>
                    <p>Số lượng SP: <span className="font-medium text-slate-800">{totalItems}</span></p>
                    {order.note ? <p className="sm:col-span-2">Ghi chú: <span className="font-medium text-slate-800">{order.note}</span></p> : null}
                    <p className="sm:col-span-2">
                        Địa chỉ: <span className="font-medium text-slate-800">{order.detailAddress}, {order.commune}, {order.district}, {order.province}</span>
                    </p>
                </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                    <Package className="size-4" />
                    Sản phẩm trong đơn
                </h2>

                <div className="mt-4 space-y-3">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <div className="size-16 overflow-hidden rounded-lg bg-slate-100">
                                {item.variant?.imageUrl ? (
                                    <img src={item.variant.imageUrl} alt={item.variant.product?.name} className="h-full w-full object-cover" />
                                ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="line-clamp-1 text-sm font-medium text-slate-800">{item.variant?.product?.name || "Sản phẩm"}</p>
                                <p className="mt-1 text-xs text-slate-500">Số lượng: x{item.quantity}</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-800">{formatCurrency(Number(item.price) * item.quantity)}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4 text-right">
                    <p className="text-sm text-slate-500">Tạm tính: {formatCurrency(subtotal)}</p>
                    <p className="text-sm text-slate-500">Phí vận chuyển: {formatCurrency(Number(order.shippingFee))}</p>
                    <p className="text-lg font-bold text-primary">Tổng tiền: {formatCurrency(Number(order.totalAmount))}</p>
                </div>
            </article>
        </div>
    );
};

export default OrderDetailPage;
