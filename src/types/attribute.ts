export type SizeType = {
    id: number;
    name: string;
    description?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type Size = {
    id: number;
    name: string;
    sizeTypeId: number;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    sizeType?: SizeType;
};

export type Color = {
    id: number;
    name: string;
    hexCode?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};
