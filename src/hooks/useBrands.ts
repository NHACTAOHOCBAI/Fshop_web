import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteBrand, getBrands } from "@/services/brands";
import type { QueryParams } from "@/types/query";

export const useBrands = (params?: QueryParams) => {
    return useQuery({
        queryKey: ["brands", params],
        queryFn: () => getBrands(params || { limit: 10, page: 1 }),
    });
};

export const useDeleteBrand = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteBrand,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
        },
    });
};
