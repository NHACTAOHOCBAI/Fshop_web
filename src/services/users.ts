import axiosInstance from "@/lib/axios";
import type { QueryParams } from "@/types/query";
import type { ApiResponse, PaginatedApiResponse } from "@/types/response";
import type { RoleType, User } from "@/types/user";

export const getUsers = async ({ limit, page, search, sortOrder, sortBy }: QueryParams) => {
    const { data } = await axiosInstance.get<PaginatedApiResponse<User>>("/users", {
        params: { limit, page, search, sortOrder, sortBy },
    });

    return data;
};

export const deleteUser = async ({ id }: { id: number }) => {
    return axiosInstance.delete(`/users/${id}`);
};

export const createUser = async (data: {
    fullName: string;
    email: string;
    password: string;
    role: RoleType;
    avatar?: File;
}) => {
    const formData = new FormData();
    formData.append("fullName", data.fullName);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("role", data.role);
    if (data.avatar) {
        formData.append("avatar", data.avatar);
    }

    return axiosInstance.post("/users", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const updateUser = async ({
    id,
    data,
}: {
    id: number;
    data: {
        fullName?: string;
        email?: string;
        role?: RoleType;
        avatar?: File;
    };
}) => {
    const formData = new FormData();
    if (data.fullName) {
        formData.append("fullName", data.fullName);
    }
    if (data.email) {
        formData.append("email", data.email);
    }
    if (data.role) {
        formData.append("role", data.role);
    }
    if (data.avatar) {
        formData.append("avatar", data.avatar);
    }

    return axiosInstance.patch(`/users/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const getUserById = async (id: number) => {
    const { data } = await axiosInstance.get<ApiResponse<User>>(`/users/${id}`);
    return data;
};
