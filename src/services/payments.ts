import axiosInstance from '@/lib/axios';
import type { ApiResponse } from '@/types/response';
import type { PaymentMethod, PaymentResponse, VerifyReturnResult } from '@/types/payment';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

export const initiatePayment = async (
    orderId: number,
    paymentMethod: PaymentMethod,
): Promise<ApiResponse<PaymentResponse>> => {
    // All payment methods redirect to frontend return page
    const returnUrl = `${window.location.origin}/payment/return`;
    const notifyUrl = `${apiBaseUrl}/payments/webhook/momo`;

    const { data } = await axiosInstance.post<ApiResponse<PaymentResponse>>(
        '/payments/initiate',
        { orderId, paymentMethod },
        { params: { returnUrl, notifyUrl } },
    );
    return data;
};

export const verifyMoMoReturn = async (
    params: Record<string, string>,
): Promise<ApiResponse<VerifyReturnResult>> => {
    const { data } = await axiosInstance.get<ApiResponse<VerifyReturnResult>>(
        '/payments/momo/verify-return',
        { params },
    );
    return data;
};
