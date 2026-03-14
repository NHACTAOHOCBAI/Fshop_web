import { Package, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "confirmed" | "shipping" | "delivered" | "cancelled";

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
    pending: { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-600 border-amber-200" },
    confirmed: { label: "Đã xác nhận", className: "bg-blue-50 text-blue-600 border-blue-200" },
    shipping: { label: "Đang giao", className: "bg-indigo-50 text-indigo-600 border-indigo-200" },
    delivered: { label: "Đã giao", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    cancelled: { label: "Đã huỷ", className: "bg-red-50 text-red-600 border-red-200" },
};

const mockOrders = [
    {
        id: "ORD-2024-001",
        date: "10/03/2024",
        status: "delivered" as OrderStatus,
        total: 890000,
        items: [
            { name: "Áo thun nam basic", variant: "Trắng / M", qty: 2, price: 299000, image: null },
            { name: "Quần jogger premium", variant: "Đen / L", qty: 1, price: 292000, image: null },
        ],
    },
    {
        id: "ORD-2024-002",
        date: "28/02/2024",
        status: "shipping" as OrderStatus,
        total: 540000,
        items: [
            { name: "Áo polo nữ tay ngắn", variant: "Hồng / S", qty: 1, price: 349000, image: null },
            { name: "Tất cotton 3 đôi", variant: "Trắng / Free size", qty: 1, price: 59000, image: null },
        ],
    },
    {
        id: "ORD-2024-003",
        date: "14/02/2024",
        status: "cancelled" as OrderStatus,
        total: 299000,
        items: [
            { name: "Áo hoodie oversize", variant: "Xanh navy / XL", qty: 1, price: 299000, image: null },
        ],
    },
    {
        id: "ORD-2024-004",
        date: "01/03/2024",
        status: "pending" as OrderStatus,
        total: 650000,
        items: [
            { name: "Váy maxi hoa nhí", variant: "Vàng / M", qty: 1, price: 450000, image: null },
            { name: "Túi tote canvas", variant: "Nâu / One size", qty: 1, price: 200000, image: null },
        ],
    },
];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const MyOrdersPage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-slate-900">Đơn hàng của tôi</h1>
                <p className="mt-1 text-sm text-slate-500">{mockOrders.length} đơn hàng</p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 text-sm">
                {(["Tất cả", "Chờ xác nhận", "Đang giao", "Đã giao", "Đã huỷ"] as const).map((tab, i) => (
                    <button
                        key={tab}
                        type="button"
                        className={cn(
                            "rounded-lg px-3 py-1.5 font-medium transition-colors",
                            i === 0
                                ? "bg-primary text-white"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {mockOrders.map((order) => {
                    const statusCfg = STATUS_CONFIG[order.status];
                    return (
                        <article
                            key={order.id}
                            className="rounded-2xl border border-slate-200 bg-white overflow-hidden"
                        >
                            {/* Order header */}
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                                <div className="flex items-center gap-3">
                                    <Package className="size-4 text-slate-400" />
                                    <span className="text-sm font-semibold text-slate-700">{order.id}</span>
                                    <span className="text-xs text-slate-400">{order.date}</span>
                                </div>
                                <span
                                    className={cn(
                                        "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                                        statusCfg.className
                                    )}
                                >
                                    {statusCfg.label}
                                </span>
                            </div>

                            {/* Items */}
                            <div className="divide-y divide-slate-50 px-5">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4 py-3">
                                        <div className="size-14 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                                            No img
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-800 line-clamp-1">
                                                {item.name}
                                            </p>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {item.variant} &middot; x{item.qty}
                                            </p>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {formatCurrency(item.price)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                                <p className="text-sm text-slate-500">
                                    Tổng cộng:{" "}
                                    <span className="font-bold text-primary">
                                        {formatCurrency(order.total)}
                                    </span>
                                </p>
                                <button
                                    type="button"
                                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                >
                                    Xem chi tiết <ChevronRight className="size-3.5" />
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
};

export default MyOrdersPage;
