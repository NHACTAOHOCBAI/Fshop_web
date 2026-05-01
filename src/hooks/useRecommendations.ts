import { useQuery } from "@tanstack/react-query";
import { getFrequentlyBoughtTogether } from "@/services/recommendations";

export const useFrequentlyBoughtTogether = (productId: number, enabled: boolean = true) => {
    return useQuery({
        queryKey: ["recommendations", "frequently-bought-together", productId],
        queryFn: () => getFrequentlyBoughtTogether(productId),
        enabled: enabled && !!productId,
    });
};
