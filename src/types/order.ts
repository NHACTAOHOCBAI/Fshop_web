export type ShippingMethod = "standard" | "express";
export type DecimalValue = number | string;

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "awaiting_pickup"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "delivery_failed"
  | "canceled";

export type OrderItem = {
  id: number;
  quantity: number;
  price: DecimalValue;
  variant: {
    id: number;
    imageUrl?: string | null;
    color?: string | null;
    size?: string | null;
    product: {
      id: number;
      name: string;
      thumbnail?: string | null;
    };
  };
};

export type CreateOrderItemPayload = {
  variantId: number;
  quantity: number;
};

export type CreateOrderPayload = {
  addressId: number;
  couponId?: number;
  shippingMethod: ShippingMethod;
  paymentMethod?: "momo" | "cod";
  shippingRateId?: string;
  shippingCarrierName?: string;
  shippingServiceName?: string;
  shippingExpected?: string;
  shippingRateFee?: number;
  shippingTrackingUrl?: string;
  note?: string;
  items: CreateOrderItemPayload[];
};

export type Order = {
  id: number;
  status: OrderStatus;
  recipientName: string;
  recipientPhone?: string | null;
  detailAddress: string;
  province: string;
  district: string;
  commune: string;
  shippingMethod: ShippingMethod;
  shippingFee: DecimalValue;
  shippingRateId?: string | null;
  shippingCarrierName?: string | null;
  shippingServiceName?: string | null;
  shippingExpected?: string | null;
  shippingRateFee?: DecimalValue;
  shippingTrackingUrl?: string | null;
  totalAmount: DecimalValue;
  note?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type GetMyOrdersParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  status?: OrderStatus;
};

export type GetAllOrdersParams = GetMyOrdersParams;

export type UpdateOrderStatusPayload = {
  status: OrderStatus;
  reason?: string;
  trackingCode?: string;
  carrierName?: string;
  trackingUrl?: string;
  receivedBy?: string;
  currentLocation?: string;
  shipperName?: string;
  shipperPhone?: string;
};

export type OrderStatusUpdateResponse = {
  message: string;
  from: OrderStatus;
  to: OrderStatus;
};
