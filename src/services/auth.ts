import axiosInstance from "@/lib/axios";
import type {
    ChangePasswordPayload,
    ForgotPasswordRequestPayload,
    ForgotPasswordResetPayload,
    ForgotPasswordVerifyPayload,
    GoogleLoginPayload,
    LinkGooglePayload,
    LinkGoogleResponse,
    LoginPayload,
    LoginResponse,
    RefreshTokenResponse,
    RegisterPayload,
    UpdateProfilePayload,
} from "@/types/auth";
import type { ApiResponse } from "@/types/response";
import type { User } from "@/types/user";

export const login = async (payload: LoginPayload) => {
    const { data } = await axiosInstance.post("/auth/login", payload);
    return data.data as LoginResponse;
};

export const loginWithGoogle = async (payload: GoogleLoginPayload) => {
    const { data } = await axiosInstance.post("/auth/google/login", payload);
    return data.data as LoginResponse;
};

export const linkGoogleAccount = async (payload: LinkGooglePayload) => {
    const { data } = await axiosInstance.post<ApiResponse<LinkGoogleResponse>>(
        "/auth/google/link",
        payload
    );
    return data.data;
};

export const unlinkGoogleAccount = async () => {
    const { data } = await axiosInstance.delete<ApiResponse<{ message: string; user: Omit<User, "password" | "publicId"> }>>(
        "/auth/google/unlink"
    );
    return data.data;
};

export const register = async (payload: RegisterPayload) => {
    const formData = new FormData();
    formData.append("fullName", payload.fullName);
    formData.append("email", payload.email);
    formData.append("password", payload.password);
    formData.append("role", payload.role ?? "user");

    if (payload.avatar) {
        formData.append("avatar", payload.avatar);
    }

    const { data } = await axiosInstance.post("/users", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return data;
};

export const refreshAccessToken = async () => {
    const { data } = await axiosInstance.post<RefreshTokenResponse>("/auth/refresh-token");
    return data;
};

export const getMe = async () => {
    const { data } = await axiosInstance.get<ApiResponse<User>>("/auth/me");
    return data;
};

export const updateProfile = async ({ fullName, avatar }: UpdateProfilePayload) => {
    const formData = new FormData();

    if (fullName) {
        formData.append("fullName", fullName);
    }

    if (avatar) {
        formData.append("avatar", avatar);
    }

    const { data } = await axiosInstance.patch<ApiResponse<User>>("/auth/me", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return data;
};

export const changePassword = async (payload: ChangePasswordPayload) => {
    const { data } = await axiosInstance.patch<ApiResponse<null>>("/auth/change-password", payload);
    return data;
};

export const logout = async () => {
    await axiosInstance.post("/auth/logout");
};

export const requestForgotPassword = async (payload: ForgotPasswordRequestPayload) => {
    const { data } = await axiosInstance.post<ApiResponse<{ message: string; warning?: string }>>("/auth/forgot-password/request", payload);
    return data.data;
};

export const verifyForgotPasswordCode = async (payload: ForgotPasswordVerifyPayload) => {
    const { data } = await axiosInstance.post<ApiResponse<{ message: string }>>("/auth/forgot-password/verify", payload);
    return data.data;
};

export const resetForgotPassword = async (payload: ForgotPasswordResetPayload) => {
    const { data } = await axiosInstance.post<ApiResponse<{ message: string }>>("/auth/forgot-password/reset", payload);
    return data.data;
};

export const activateBlogProfile = async (payload: { bio: string; coverImage: File }) => {
    const formData = new FormData();
    formData.append("bio", payload.bio);
    formData.append("coverImage", payload.coverImage);
    formData.append("isBlogActive", "true");

    const { data } = await axiosInstance.patch<ApiResponse<User>>("/auth/me", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return data.data;
};

export const updateBlogProfile = async (payload: { bio?: string; coverImage?: File }) => {
    const formData = new FormData();
    if (payload.bio !== undefined) {
        formData.append("bio", payload.bio);
    }
    if (payload.coverImage) {
        formData.append("coverImage", payload.coverImage);
    }

    const { data } = await axiosInstance.patch<ApiResponse<User>>("/auth/me", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return data.data;
};

