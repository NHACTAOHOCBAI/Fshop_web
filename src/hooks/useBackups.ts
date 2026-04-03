import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createBackup, deleteBackup, getBackups, restoreBackup } from "@/services/backups";

export const useBackups = () => {
    return useQuery({
        queryKey: ["backups"],
        queryFn: getBackups,
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
