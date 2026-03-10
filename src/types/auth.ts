import type { RoleType, User } from "@/types/user";

export type LoginPayload = {
    email: string;
    password: string;
};

export type RegisterPayload = {
    fullName: string;
    email: string;
    password: string;
    role?: RoleType;
    avatar?: File;
};

export type LoginResponse = {
    accessToken: string;
    user: Omit<User, "password" | "publicId">;
};

export type RefreshTokenResponse = {
    accessToken: string;
};
