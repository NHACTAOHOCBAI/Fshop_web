export type ShippingMethod = "standard" | "express";

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
    status: string;
    recipientName: string;
    recipientPhone: string;
    detailAddress: string;
    province: string;
    district: string;
    commune: string;
    shippingMethod: ShippingMethod;
    shippingFee: number;
    totalAmount: number;
    note?: string;
    createdAt: string;
    updatedAt: string;
};
