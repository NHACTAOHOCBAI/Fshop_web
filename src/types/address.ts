export type AddressType = "home" | "work" | "other";

export type Address = {
    id: number;
    recipientName: string;
    recipientPhone: string;
    detailAddress: string;
    province: string;
    district: string;
    commune: string;
    type: AddressType;
    isDefault: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type UpsertAddressPayload = {
    recipientName: string;
    recipientPhone: string;
    detailAddress: string;
    province: string;
    district: string;
    commune: string;
    type: AddressType;
    isDefault?: boolean;
};