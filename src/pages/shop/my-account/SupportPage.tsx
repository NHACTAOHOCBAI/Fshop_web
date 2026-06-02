import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import AccountSupportChatPanel from "@/components/layout/AccountSupportChatPanel";
import type { ChatProductAttachment, ChatOrderAttachment } from "@/types/chat";

type SupportRouteState = {
    prefillProduct?: ChatProductAttachment | null;
    prefillOrder?: ChatOrderAttachment | null;
};

const SupportPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = (location.state as SupportRouteState | null) ?? null;
    const [prefillProduct, setPrefillProduct] = useState<ChatProductAttachment | null>(state?.prefillProduct ?? null);
    const [prefillOrder, setPrefillOrder] = useState<ChatOrderAttachment | null>(state?.prefillOrder ?? null);

    useEffect(() => {
        if (!state?.prefillProduct && !state?.prefillOrder) {
            return;
        }

        if (state.prefillProduct) setPrefillProduct(state.prefillProduct);
        if (state.prefillOrder) setPrefillOrder(state.prefillOrder);

        navigate(location.pathname + location.search, { replace: true, state: null });
    }, [location.pathname, location.search, navigate, state]);

    return (
        <AccountSupportChatPanel 
            prefillProduct={prefillProduct} 
            prefillOrder={prefillOrder}
            onPrefillConsumed={() => {
                setPrefillProduct(null);
                setPrefillOrder(null);
            }} 
        />
    );
};

export default SupportPage;
