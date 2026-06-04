export type DepartmentType = "men" | "women" | "kids";

export type SlotType = {
    id: number;
    name: string;
    code: string;
    hint?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type Category = {
    id: number;
    name: string;
    slug: string;
    imageUrl: string | null;
    publicId: string | null;
    description: string | null;
    department: DepartmentType;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    slotType?: SlotType | null;
    slotTypeId?: number | null;
};
