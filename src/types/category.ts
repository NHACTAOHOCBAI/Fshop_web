export type DepartmentType = "men" | "women" | "kids";

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
};
