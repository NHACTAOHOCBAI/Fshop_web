export type CheckoutItem = {
    cartItemId: number;
    variantId: number;
    productId: number;
    productName: string;
    imageUrl?: string;
    colorName?: string;
    sizeName?: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
};

export type CheckoutSession = {
    items: CheckoutItem[];
    subtotal: number;
    shippingFee: number;
    total: number;
    createdAt: string;
};

const CHECKOUT_SESSION_KEY = "fshop_checkout_session";

export const saveCheckoutSession = (session: CheckoutSession) => {
    localStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(session));
};

export const getCheckoutSession = (): CheckoutSession | null => {
    const raw = localStorage.getItem(CHECKOUT_SESSION_KEY);
    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as CheckoutSession;
    } catch {
        return null;
    }
};

export const clearCheckoutSession = () => {
    localStorage.removeItem(CHECKOUT_SESSION_KEY);
};
