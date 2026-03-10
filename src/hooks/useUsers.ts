import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createUser, deleteUser, getUsers, updateUser } from "@/services/users";
import type { QueryParams } from "@/types/query";

export const useUsers = (params?: QueryParams) => {
    return useQuery({
        queryKey: ["users", params],
        queryFn: () => getUsers(params || { limit: 10, page: 1 }),
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
};
