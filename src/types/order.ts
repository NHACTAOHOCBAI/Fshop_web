export type ShippingMethod = "standard" | "express";
export type DecimalValue = number | string;

export type OrderStatus =
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "canceled"
    | "return_requested"
    | "returned"
    | "refunded";

export type OrderItem = {
    id: number;
    quantity: number;
    price: DecimalValue;
    variant: {
        id: number;
        imageUrl?: string | null;
        product: {
            id: number;
            name: string;
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
};

export type OrderStatusUpdateResponse = {
    message: string;
    from: OrderStatus;
    to: OrderStatus;
};
