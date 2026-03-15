export type CouponType = "fixed" | "percent" | "shipping";
export type CouponStatus = "active" | "expired" | "inactive";

export type Coupon = {
    id: number;
    code: string;
    name: string | null;
    description: string | null;
    type: CouponType;
    value: number;
    minOrderAmount: number;
    maxDiscountAmount: number;
    maxUses: number;
    perUserLimit: number;
    usedCount: number;
    applicableProduct: number | null;
    startDate: string;
    endDate: string;
    status: CouponStatus;
    isPublic: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type UpsertCouponPayload = {
    code: string;
    name?: string;
    description?: string;
    type: CouponType;
    value: number;
    minOrderAmount: number;
    maxDiscountAmount: number;
    maxUses: number;
    perUserLimit: number;
    applicableProduct?: number;
    startDate: string;
    endDate: string;
    status?: CouponStatus;
    isPublic?: boolean;
};
