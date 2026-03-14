import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authStorage } from "@/lib/auth";
import { clearWishlists, getMyWishlists, toggleWishlist } from "@/services/wishlists";

export const WISHLISTS_QUERY_KEY = ["wishlists", "me"] as const;

export const useWishlists = () => {
    return useQuery({
        queryKey: WISHLISTS_QUERY_KEY,
        queryFn: getMyWishlists,
        enabled: Boolean(authStorage.getAccessToken()),
    });
};

export const useToggleWishlist = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: toggleWishlist,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: WISHLISTS_QUERY_KEY });
        },
    });
};

export const useClearWishlists = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: clearWishlists,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: WISHLISTS_QUERY_KEY });
        },
    });
};
