import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createBackup, deleteBackup, getBackups, restoreBackup } from "@/services/backups";
import type { Backup, BackupStatus } from "@/types/backup";
import type { QueryParams } from "@/types/query";

type BackupsTableData = {
    pagination: {
        total: number;
        page: number;
        limit: number;
    };
    data: Backup[];
};

const normalizeSortBy = (sortBy?: string): "filename" | "size" | "createdAt" => {
    if (sortBy === "filename" || sortBy === "size" || sortBy === "createdAt") {
        return sortBy;
    }

    return "createdAt";
};

const applyBackupsQuery = (
    backups: Backup[],
    params: QueryParams,
    statusFilter: BackupStatus | "all"
): BackupsTableData => {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, params.limit ?? 10);
    const keyword = (params.search ?? "").trim().toLowerCase();
    const sortBy = normalizeSortBy(params.sortBy);
    const sortOrder = params.sortOrder === "ASC" ? "ASC" : "DESC";

    const filtered = backups.filter((backup) => {
        const matchSearch = !keyword || backup.filename.toLowerCase().includes(keyword);
        const matchStatus = statusFilter === "all" || backup.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
        let compare = 0;

        if (sortBy === "filename") {
            compare = a.filename.localeCompare(b.filename);
        }

        if (sortBy === "size") {
            compare = a.size - b.size;
        }

        if (sortBy === "createdAt") {
            compare = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }

        return sortOrder === "ASC" ? compare : -compare;
    });

    const total = sorted.length;
    const start = (page - 1) * limit;

    return {
        pagination: {
            total,
            page,
            limit,
        },
        data: sorted.slice(start, start + limit),
    };
};

export const useBackups = (
    params: QueryParams = {},
    statusFilter: BackupStatus | "all" = "all"
) => {
    return useQuery({
        queryKey: ["backups", params, statusFilter],
        queryFn: async () => {
            const response = await getBackups();
            return applyBackupsQuery(response.data ?? [], params, statusFilter);
        },
    });
};

export const useCreateBackup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createBackup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["backups"] });
        },
    });
};

export const useRestoreBackup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: restoreBackup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["backups"] });
        },
    });
};

export const useDeleteBackup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteBackup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["backups"] });
        },
    });
};
