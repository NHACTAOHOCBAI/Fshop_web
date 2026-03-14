import axiosInstance from "@/lib/axios";
import type {
    ChangePasswordPayload,
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
