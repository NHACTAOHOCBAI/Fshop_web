import { useMutation } from "@tanstack/react-query";

import { createOrder } from "@/services/orders";

export const useCreateOrder = () => {
    return useMutation({
        mutationFn: createOrder,
    });
};
