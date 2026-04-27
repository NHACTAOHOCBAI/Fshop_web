import { useQuery } from '@tanstack/react-query';
import { verifyMoMoReturn } from '@/services/payments';

export const useVerifyMoMoReturn = (params: Record<string, string>, enabled: boolean) =>
    useQuery({
        queryKey: ['payment', 'momo-return', params.orderId],
        queryFn: () => verifyMoMoReturn(params),
        enabled,
        retry: false,
        staleTime: Infinity,
    });
