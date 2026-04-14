export type PaymentMethod = 'momo' | 'cod';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'expired' | 'refunded';

export interface PaymentResponse {
    paymentId: number;
    orderId: number;
    status: PaymentStatus;
    method: PaymentMethod;
    amount: number;
    externalTransactionId: string | null;
    redirectUrl: string;
    createdAt: string;
    updatedAt: string;
}

export interface VerifyReturnResult {
    success: boolean;
    paymentId: number;
    orderId: number;
    message: string;
}
