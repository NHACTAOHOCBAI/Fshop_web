import type { RoleType, User } from "@/types/user";

export type LoginPayload = {
    email: string;
    password: string;
};

export type GoogleLoginPayload = {
    idToken: string;
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

export type UpdateProfilePayload = {
    fullName?: string;
    avatar?: File;
};

export type ChangePasswordPayload = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
};

export type LinkGooglePayload = {
    idToken: string;
};

export type LinkGoogleResponse = {
    message: string;
    user: Omit<User, "password" | "publicId">;
};

export type ForgotPasswordRequestPayload = {
    email: string;
};

export type ForgotPasswordVerifyPayload = {
    email: string;
    code: string;
};

export type ForgotPasswordResetPayload = {
    email: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
};
