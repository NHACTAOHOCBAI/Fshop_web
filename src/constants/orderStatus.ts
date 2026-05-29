import type { OrderStatus } from "@/types/order";

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "processing", label: "Đang xử lý" },
  { value: "awaiting_pickup", label: "Chờ lấy hàng" },
  { value: "in_transit", label: "Đang vận chuyển" },
  { value: "out_for_delivery", label: "Đang giao" },
  { value: "delivered", label: "Đã giao" },
  { value: "delivery_failed", label: "Giao thất bại" },
  { value: "canceled", label: "Đã hủy" },
  { value: "refunded", label: "Đã hoàn tiền" },
];

export const ORDER_STATUS_LABEL = Object.fromEntries(
  ORDER_STATUS_OPTIONS.map((s) => [s.value, s.label]),
) as Record<OrderStatus, string>;

// Mirrors backend ALLOWED_TRANSITIONS for admin actions.
export const ADMIN_ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "canceled"],
  confirmed: ["processing", "awaiting_pickup", "canceled"],
  processing: ["awaiting_pickup", "in_transit", "canceled"],
  awaiting_pickup: ["in_transit", "delivery_failed", "canceled"],
  in_transit: ["out_for_delivery", "delivered", "delivery_failed", "canceled"],
  out_for_delivery: ["delivered", "delivery_failed"],
  delivery_failed: ["in_transit", "canceled", "refunded"],
  delivered: [],
  canceled: ["refunded"],
  refunded: [],
};

export const getAdminAllowedNextStatuses = (
  current: OrderStatus,
): OrderStatus[] => {
  return ADMIN_ALLOWED_TRANSITIONS[current] ?? [];
};
