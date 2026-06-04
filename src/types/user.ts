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
    isBlogActive: boolean;
    bio: string | null;
    coverImage: string | null;
    followersCount: number;
    followingCount: number;
    isFollowing?: boolean;
    createdAt: string;
    updatedAt: string;
};
