import axiosInstance from "@/lib/axios";
import type { Category } from "@/types/category";
import type { QueryParams } from "@/types/query";
import type { ApiResponse, PaginatedApiResponse } from "@/types/response";

export const getCategories = async ({
    limit,
    page,
    search,
    sortOrder,
    sortBy,
}: QueryParams) => {
    const { data } = await axiosInstance.get<PaginatedApiResponse<Category>>("/categories", {
        params: { limit, page, search, sortOrder, sortBy },
    });

    return data;
};

export const getCategoryById = async (id: number) => {
    const { data } = await axiosInstance.get<ApiResponse<Category>>(`/categories/${id}`);
    return data;
};

export const getCategoryBySlug = async (slug: string) => {
    const { data } = await axiosInstance.get<ApiResponse<Category>>(`/categories/slugs/${slug}`);
    return data;
};

export const deleteCategory = async ({ id }: { id: number }) => {
    return axiosInstance.delete(`/categories/${id}`);
};

export const createCategory = async (data: {
    name: string;
    department: "men" | "women" | "kids";
    image: File;
    description?: string;
}) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("department", data.department);
    if (data.description) {
        formData.append("description", data.description);
    }
    formData.append("image", data.image);

    return axiosInstance.post("/categories", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const updateCategory = async ({
    id,
    data,
}: {
    id: number;
    data: {
        name?: string;
        department?: "men" | "women" | "kids";
        image?: File;
        description?: string;
    };
}) => {
    const formData = new FormData();
    if (data.name) {
        formData.append("name", data.name);
    }
    if (data.department) {
        formData.append("department", data.department);
    }
    if (data.description) {
        formData.append("description", data.description);
    }
    if (data.image) {
        formData.append("image", data.image);
    }

    return axiosInstance.patch(`/categories/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};
