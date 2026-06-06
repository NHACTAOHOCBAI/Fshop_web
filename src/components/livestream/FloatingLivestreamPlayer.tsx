import { useEffect, useRef, useState } from "react";
import AgoraRTC, { type IAgoraRTCClient, type IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { Loader2, Maximize2, Video, X } from "lucide-react";
import { useNavigate } from "react-router";

import { useIssueLivestreamAgoraToken } from "@/hooks/useLivestreams";
import { useLivestreamContext } from "@/context/LivestreamContext";

const APP_ID = import.meta.env.VITE_AGORA_APP_ID as string;

export const FloatingLivestreamPlayer = () => {
    const navigate = useNavigate();
    const { activeLivestream, showFloating, setActiveLivestream, setShowFloating } = useLivestreamContext();
    const remoteVideoRef = useRef<HTMLDivElement>(null);
    const clientRef = useRef<IAgoraRTCClient | null>(null);

    const [loading, setLoading] = useState(true);
    const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

    // Snapping & Drag state
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isSnapping, setIsSnapping] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    const playerWidth = 288; // w-72 (18rem)
    const playerHeight = 162; // aspect-video (16:9)
    const margin = 24; // 24px margin from edges

    const tokenMutation = useIssueLivestreamAgoraToken();

    // Initialize position to bottom-right corner
    useEffect(() => {
        if (showFloating && activeLivestream) {
            const x = window.innerWidth - playerWidth - margin;
            const y = window.innerHeight - playerHeight - margin;
            setCoords({ x, y });
            setInitialized(true);
        }
    }, [showFloating, activeLivestream]);

    useEffect(() => {
        if (!showFloating || !activeLivestream || !APP_ID) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);

        const join = async () => {
            try {
                const { data } = await new Promise<{ data: { token: string; uid: number } }>((resolve, reject) => {
                    tokenMutation.mutate(activeLivestream.id, {
                        onSuccess: (res) => resolve(res),
                        onError: reject,
                    });
                });

                if (cancelled) return;

                const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
                client.setClientRole("audience");
                clientRef.current = client;

                client.on("user-published", async (remoteUser: IAgoraRTCRemoteUser, mediaType: "video" | "audio") => {
                    await client.subscribe(remoteUser, mediaType);
                    if (mediaType === "video" && remoteVideoRef.current) {
                        remoteUser.videoTrack?.play(remoteVideoRef.current);
                        setHasRemoteVideo(true);
                    }
                    if (mediaType === "audio") {
                        remoteUser.audioTrack?.play();
                    }
                });

                client.on("user-unpublished", (_remoteUser: IAgoraRTCRemoteUser, mediaType: "video" | "audio") => {
                    if (mediaType === "video") {
                        setHasRemoteVideo(false);
                    }
                });

                await client.join(APP_ID, activeLivestream.agoraChannel, data.token, data.uid);
            } catch (err) {
                if (!cancelled) {
                    console.error("Agora PiP connect error:", err);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void join();

        return () => {
            cancelled = true;
            void clientRef.current?.leave();
            clientRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showFloating, activeLivestream]);

    // Mouse events
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest("button")) return;
        setIsDragging(true);
        setIsSnapping(false);
        dragStart.current = {
            x: e.clientX - coords.x,
            y: e.clientY - coords.y,
        };
        e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        let newX = e.clientX - dragStart.current.x;
        let newY = e.clientY - dragStart.current.y;

        // Keep it bounded during dragging
        newX = Math.max(margin, Math.min(window.innerWidth - playerWidth - margin, newX));
        newY = Math.max(margin, Math.min(window.innerHeight - playerHeight - margin, newY));

        setCoords({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        setIsSnapping(true);

        const targetX = coords.x;
        const targetY = coords.y;

        // Calculate closest corner of the screen
        const corners = [
            { x: margin, y: margin }, // Top-Left
            { x: window.innerWidth - playerWidth - margin, y: margin }, // Top-Right
            { x: margin, y: window.innerHeight - playerHeight - margin }, // Bottom-Left
            { x: window.innerWidth - playerWidth - margin, y: window.innerHeight - playerHeight - margin }, // Bottom-Right
        ];

        let closestCorner = corners[3]; // default bottom-right
        let minDistance = Infinity;

        corners.forEach((corner) => {
            const dist = Math.sqrt(Math.pow(targetX - corner.x, 2) + Math.pow(targetY - corner.y, 2));
            if (dist < minDistance) {
                minDistance = dist;
                closestCorner = corner;
            }
        });

        setCoords(closestCorner);
    };

    // Touch events for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        if ((e.target as HTMLElement).closest("button")) return;
        setIsDragging(true);
        setIsSnapping(false);
        const touch = e.touches[0];
        dragStart.current = {
            x: touch.clientX - coords.x,
            y: touch.clientY - coords.y,
        };
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        let newX = touch.clientX - dragStart.current.x;
        let newY = touch.clientY - dragStart.current.y;

        newX = Math.max(margin, Math.min(window.innerWidth - playerWidth - margin, newX));
        newY = Math.max(margin, Math.min(window.innerHeight - playerHeight - margin, newY));

        setCoords({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
        handleMouseUp();
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            window.addEventListener("touchmove", handleTouchMove, { passive: false });
            window.addEventListener("touchend", handleTouchEnd);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDragging, coords]);

    const handleClose = () => {
        setActiveLivestream(null);
        setShowFloating(false);
    };

    const handleExpand = () => {
        if (!activeLivestream) return;
        setShowFloating(false);
        navigate(`/livestreams/${activeLivestream.id}`);
    };

    if (!showFloating || !activeLivestream || !initialized) return null;

    return (
        <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{
                left: `${coords.x}px`,
                top: `${coords.y}px`,
                touchAction: "none",
                transition: isSnapping ? "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)" : "none",
            }}
            className="fixed z-50 w-72 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-black select-none overflow-hidden group cursor-move"
        >
            {/* Aspect Video Wrapper */}
            <div className="relative aspect-video w-full">
                <div ref={remoteVideoRef} className="h-full w-full" />

                {/* Floating Controller overlay (Visible on Hover) */}
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 z-10">
                    <div className="flex items-center justify-between w-full">
                        <p className="truncate text-xs font-semibold text-white max-w-[170px] flex items-center gap-1.5">
                            <span className="inline-block size-2 rounded-full bg-red-500 animate-pulse" />
                            {activeLivestream.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                type="button"
                                onClick={handleExpand}
                                className="rounded-md p-1 bg-white/10 text-white hover:bg-white/20 transition-colors"
                                title="Quay lại livestream"
                            >
                                <Maximize2 className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="rounded-md p-1 bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                                title="Tắt livestream"
                            >
                                <X className="size-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {!hasRemoteVideo && activeLivestream.coverImageUrl && (
                    <img
                        src={activeLivestream.coverImageUrl}
                        alt="Livestream cover"
                        className="absolute inset-0 h-full w-full object-cover opacity-60"
                    />
                )}

                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                        <Loader2 className="size-6 animate-spin text-white" />
                    </div>
                )}

                {!loading && !hasRemoteVideo && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-400 p-2 text-center">
                        <Video className="size-6 opacity-60" />
                        <p className="text-[10px]">Đang kết nối lại luồng livestream...</p>
                    </div>
                )}
            </div>
        </div>
    );
};
