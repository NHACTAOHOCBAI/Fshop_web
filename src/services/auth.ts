import axiosInstance from "@/lib/axios";
import type {
    LoginPayload,
    LoginResponse,
    RefreshTokenResponse,
    RegisterPayload,
} from "@/types/auth";

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
    const { data } = await axiosInstance.get("/auth/me");
    return data;
};

export const logout = async () => {
    await axiosInstance.post("/auth/logout");
};
