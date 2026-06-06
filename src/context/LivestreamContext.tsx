import React, { createContext, useContext, useState } from "react";

export type ActiveLivestream = {
    id: number;
    agoraChannel: string;
    title: string;
    coverImageUrl?: string;
};

type LivestreamContextType = {
    activeLivestream: ActiveLivestream | null;
    setActiveLivestream: (livestream: ActiveLivestream | null) => void;
    showFloating: boolean;
    setShowFloating: (show: boolean) => void;
};

const LivestreamContext = createContext<LivestreamContextType | undefined>(undefined);

export const LivestreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeLivestream, setActiveLivestream] = useState<ActiveLivestream | null>(null);
    const [showFloating, setShowFloating] = useState(false);

    return (
        <LivestreamContext.Provider
            value={{
                activeLivestream,
                setActiveLivestream,
                showFloating,
                setShowFloating,
            }}
        >
            {children}
        </LivestreamContext.Provider>
    );
};

export const useLivestreamContext = () => {
    const context = useContext(LivestreamContext);
    if (!context) {
        throw new Error("useLivestreamContext must be used within a LivestreamProvider");
    }
    return context;
};
