export type Pagination = {
    total: number;
    page?: number;
    limit?: number;
};

export type ApiResponse<T> = {
    message: string;
    path: string;
    statusCode: number;
    timestamp?: string;
    takenTime?: string;
    meta?: {
        pagination?: Pagination;
    };
    data: T;
};

export type PaginatedApiResponse<T> = ApiResponse<T[]>;
