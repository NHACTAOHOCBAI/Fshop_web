import { useQuery } from "@tanstack/react-query";

import { getMyAddresses } from "@/services/addresses";
import { authStorage } from "@/lib/auth";

export const MY_ADDRESSES_QUERY_KEY = ["addresses", "me"] as const;

export const useMyAddresses = () => {
    return useQuery({
        queryKey: MY_ADDRESSES_QUERY_KEY,
        queryFn: getMyAddresses,
        enabled: Boolean(authStorage.getAccessToken()),
    });
};