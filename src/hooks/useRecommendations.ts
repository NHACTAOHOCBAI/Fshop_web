import { useQuery } from "@tanstack/react-query";
import { getFrequentlyBoughtTogether, getPersonalizedRecommendations } from "@/services/recommendations";


export const useFrequentlyBoughtTogether = (productId: number, enabled: boolean = true) => {
    return useQuery({
        queryKey: ["recommendations", "frequently-bought-together", productId],
        queryFn: () => getFrequentlyBoughtTogether(productId),
        enabled: enabled && !!productId,
    });
};

export const usePersonalizedRecommendations = (limit: number = 10, enabled: boolean = true) => {
    return useQuery({
        queryKey: ["recommendations", "personalize"],
        queryFn: () => getPersonalizedRecommendations(limit),
        enabled: enabled,
    });
};

