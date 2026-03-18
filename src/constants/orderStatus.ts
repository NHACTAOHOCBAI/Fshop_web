import type { OrderStatus } from "@/types/order";

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
    { value: "pending", label: "Chờ xác nhận" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "processing", label: "Đang xử lý" },
    { value: "shipped", label: "Đang giao" },
    { value: "delivered", label: "Đã giao" },
    { value: "canceled", label: "Đã hủy" },
    { value: "return_requested", label: "Yêu cầu trả hàng" },
    { value: "returned", label: "Đã trả hàng" },
    { value: "refunded", label: "Đã hoàn tiền" },
];

export const ORDER_STATUS_LABEL = Object.fromEntries(ORDER_STATUS_OPTIONS.map((s) => [s.value, s.label])) as Record<OrderStatus, string>;

// Mirrors backend ALLOWED_TRANSITIONS for admin actions.
export const ADMIN_ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    pending: ["confirmed", "canceled"],
    confirmed: ["processing", "canceled"],
    processing: ["shipped", "canceled"],
    shipped: ["delivered"],
    delivered: ["return_requested"],
    return_requested: ["returned"],
    returned: ["refunded"],
    canceled: [],
    refunded: [],
};

export const getAdminAllowedNextStatuses = (current: OrderStatus): OrderStatus[] => {
    return ADMIN_ALLOWED_TRANSITIONS[current] ?? [];
};
