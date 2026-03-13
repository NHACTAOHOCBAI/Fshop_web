import { useMemo, useState } from "react";

import type { UseQueryResult } from "@tanstack/react-query";
import {
    getCoreRowModel,
    type ColumnDef,
    type SortingState,
    useReactTable,
    type VisibilityState,
} from "@tanstack/react-table";

import type { QueryParams } from "@/types/query";

type TableDataPayload<T> = {
    pagination: {
        total: number;
        page?: number;
        limit?: number;
    };
    data: T[];
};

type WrappedTableDataPayload<T> = {
    data: TableDataPayload<T>;
};

type ApiListPayload<T> = {
    data: T[];
    meta?: {
        pagination?: {
            total?: number;
            page?: number;
            limit?: number;
        };
    };
};

interface UseTableProps<T> {
    use: (params: QueryParams) => UseQueryResult<unknown, Error>;
    columns: ColumnDef<T>[];
    defaultPageSize?: number;
}

function isTableDataPayload<T>(value: unknown): value is TableDataPayload<T> {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as { pagination?: unknown; data?: unknown };
    return (
        typeof candidate.pagination === "object" &&
        candidate.pagination !== null &&
        Array.isArray(candidate.data)
    );
}

const normalizePayload = <T,>(
    value: unknown
): TableDataPayload<T> => {
    if (isTableDataPayload<T>(value)) {
        return value;
    }

    const wrapped = value as WrappedTableDataPayload<T> | undefined;
    if (wrapped?.data && isTableDataPayload<T>(wrapped.data)) {
        return wrapped.data;
    }

    const apiPayload = value as ApiListPayload<T> | undefined;
    if (apiPayload && Array.isArray(apiPayload.data)) {
        const pagination = apiPayload.meta?.pagination;
        return {
            pagination: {
                total: pagination?.total ?? apiPayload.data.length,
                page: pagination?.page,
                limit: pagination?.limit,
            },
            data: apiPayload.data,
        };
    }

    return {
        pagination: {
            total: 0,
            page: 1,
            limit: 10,
        },
        data: [],
    };
};

const useTable = <T,>({ use, columns, defaultPageSize = 10 }: UseTableProps<T>) => {
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: defaultPageSize,
    });
    const [filter, setFilter] = useState("");
    const [sorting, setSorting] = useState<SortingState>([]);

    const { data, isFetching } = use({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: filter,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0]?.desc ? "DESC" : "ASC",
    });

    const normalizedData = normalizePayload<T>(data);

    const totalPages = useMemo(() => {
        return Math.max(
            1,
            Math.ceil((normalizedData.pagination.total ?? 0) / pagination.pageSize)
        );
    }, [normalizedData.pagination.total, pagination.pageSize]);

    const table = useReactTable<T>({
        data: normalizedData.data,
        columns,
        pageCount: totalPages,
        getCoreRowModel: getCoreRowModel(),

        manualPagination: true,
        onPaginationChange: setPagination,

        manualSorting: true,
        onSortingChange: setSorting,

        onColumnVisibilityChange: setColumnVisibility,

        state: {
            columnVisibility,
            pagination,
            sorting,
        },
    });

    return {
        table,
        filter,
        setFilter,
        setPagination,
        isFetching,
    };
};

export default useTable;
