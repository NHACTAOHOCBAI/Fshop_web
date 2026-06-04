export type QueryParams = {
    page?: number;
    limit?: number;
    search?: string;
    department?: "men" | "women" | "kids";
    sortOrder?: "ASC" | "DESC";
    sortBy?: string;
};
