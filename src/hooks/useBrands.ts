import { useQuery } from "@tanstack/react-query";
import { getBrands } from "@/services/brands";
import type { QueryParams } from "@/types/query";

export const useBrands = (params?: QueryParams) => {
    return useQuery({
        queryKey: ["brands", params],
        queryFn: () => getBrands(params || { limit: 10, page: 1 }),
    });
};
