import { useEffect, useRef, useState } from "react";
import AgoraRTC, { type IAgoraRTCClient, type IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { Loader2, Video } from "lucide-react";
import { toast } from "sonner";

import { useIssueLivestreamAgoraToken } from "@/hooks/useLivestreams";

type Props = {
    livestreamId: number;
    agoraChannel: string;
    coverImageUrl?: string;
};

const APP_ID = import.meta.env.VITE_AGORA_APP_ID as string;

export const LivestreamViewer = ({ livestreamId, agoraChannel, coverImageUrl }: Props) => {
    const remoteVideoRef = useRef<HTMLDivElement>(null);
    const clientRef = useRef<IAgoraRTCClient | null>(null);

    const [loading, setLoading] = useState(true);
    const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

    const tokenMutation = useIssueLivestreamAgoraToken();

    useEffect(() => {
        if (!APP_ID) {
            setLoading(false);
            return;
        }

        let cancelled = false;

        const join = async () => {
            try {
                const { data } = await new Promise<{ data: { token: string; uid: number } }>((resolve, reject) => {
                    tokenMutation.mutate(livestreamId, {
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

                await client.join(APP_ID, agoraChannel, data.token, data.uid);
            } catch (err) {
                if (!cancelled) {
                    toast.error("Không thể kết nối stream. Vui lòng thử lại.");
                    console.error(err);
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
    }, [livestreamId, agoraChannel]);

    return (
        <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-slate-900">
            <div ref={remoteVideoRef} className="h-full w-full" />

            {!hasRemoteVideo && coverImageUrl && (
                <img
                    src={coverImageUrl}
                    alt="Livestream cover"
                    className="absolute inset-0 h-full w-full object-cover opacity-60"
                />
            )}

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="size-8 animate-spin text-white" />
                </div>
            )}

            {!loading && !hasRemoteVideo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-300">
                    <Video className="size-10" />
                    <p className="text-sm">Host chưa bắt đầu phát sóng</p>
                </div>
            )}
        </div>
    );
};
