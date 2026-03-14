import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    createAddress,
    deleteAddress,
    getMyAddresses,
    setDefaultAddress,
    updateAddress,
} from "@/services/addresses";
import { authStorage } from "@/lib/auth";

export const MY_ADDRESSES_QUERY_KEY = ["addresses", "me"] as const;

export const useMyAddresses = () => {
    return useQuery({
        queryKey: MY_ADDRESSES_QUERY_KEY,
        queryFn: getMyAddresses,
        enabled: Boolean(authStorage.getAccessToken()),
    });
};

export const useCreateAddress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createAddress,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MY_ADDRESSES_QUERY_KEY });
        },
    });
};

export const useUpdateAddress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateAddress,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MY_ADDRESSES_QUERY_KEY });
        },
    });
};

export const useSetDefaultAddress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: setDefaultAddress,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MY_ADDRESSES_QUERY_KEY });
        },
    });
};

export const useDeleteAddress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteAddress,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: MY_ADDRESSES_QUERY_KEY });
        },
    });
};