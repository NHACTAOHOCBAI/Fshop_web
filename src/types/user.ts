export type RoleType = "admin" | "user";

export type User = {
    id: number;
    fullName: string | null;
    email: string;
    password?: string;
    avatar: string | null;
    publicId: string | null;
    role: RoleType;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
};
