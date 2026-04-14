import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import AccountSupportChatPanel from "@/components/layout/AccountSupportChatPanel";
import type { ChatProductAttachment } from "@/types/chat";

type SupportRouteState = {
    prefillProduct?: ChatProductAttachment | null;
};

const SupportPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = (location.state as SupportRouteState | null) ?? null;
    const [prefillProduct, setPrefillProduct] = useState<ChatProductAttachment | null>(state?.prefillProduct ?? null);

    useEffect(() => {
        if (!state?.prefillProduct) {
            return;
        }

        setPrefillProduct(state.prefillProduct);
        navigate(location.pathname + location.search, { replace: true, state: null });
    }, [location.pathname, location.search, navigate, state]);

    return <AccountSupportChatPanel prefillProduct={prefillProduct} onPrefillConsumed={() => setPrefillProduct(null)} />;
};

export default SupportPage;
