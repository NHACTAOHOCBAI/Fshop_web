import { useEffect, useRef, useState } from "react";
import AgoraRTC, { type IAgoraRTCClient, type ICameraVideoTrack, type IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { Loader2, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useIssueLivestreamAgoraToken } from "@/hooks/useLivestreams";

type Props = {
    livestreamId: number;
    agoraChannel: string;
};

const APP_ID = import.meta.env.VITE_AGORA_APP_ID as string;

export const LivestreamPublisher = ({ livestreamId, agoraChannel }: Props) => {
    const localVideoRef = useRef<HTMLDivElement>(null);
    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
    const videoTrackRef = useRef<ICameraVideoTrack | null>(null);

    const [joined, setJoined] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [joining, setJoining] = useState(false);

    const tokenMutation = useIssueLivestreamAgoraToken();

    useEffect(() => {
        return () => {
            void leaveChannel();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const leaveChannel = async () => {
        audioTrackRef.current?.close();
        videoTrackRef.current?.close();
        audioTrackRef.current = null;
        videoTrackRef.current = null;
        if (clientRef.current) {
            await clientRef.current.leave();
            clientRef.current = null;
        }
        setJoined(false);
    };

    const joinChannel = async () => {
        if (!APP_ID) {
            toast.error("VITE_AGORA_APP_ID chưa được cấu hình.");
            return;
        }

        setJoining(true);
        try {
            const { data } = await new Promise<{ data: { token: string; uid: number } }>((resolve, reject) => {
                tokenMutation.mutate(livestreamId, {
                    onSuccess: (res) => resolve(res),
                    onError: reject,
                });
            });

            const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
            client.setClientRole("host");
            clientRef.current = client;

            await client.join(APP_ID, agoraChannel, data.token, data.uid);

            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
            audioTrackRef.current = audioTrack;
            videoTrackRef.current = videoTrack;

            await client.publish([audioTrack, videoTrack]);

            if (localVideoRef.current) {
                videoTrack.play(localVideoRef.current);
            }

            setJoined(true);
        } catch (err) {
            toast.error("Không thể bắt đầu phát sóng. Kiểm tra quyền camera/mic.");
            console.error(err);
            await leaveChannel();
        } finally {
            setJoining(false);
        }
    };

    const toggleMic = async () => {
        if (!audioTrackRef.current) return;
        await audioTrackRef.current.setEnabled(!micOn);
        setMicOn(!micOn);
    };

    const toggleCam = async () => {
        if (!videoTrackRef.current) return;
        await videoTrackRef.current.setEnabled(!camOn);
        setCamOn(!camOn);
    };

    return (
        <div className="space-y-3">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900">
                <div ref={localVideoRef} className="h-full w-full" />
                {!joined && (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        <Video className="size-10" />
                    </div>
                )}
                {joined && (
                    <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white">
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
                        LIVE
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {!joined ? (
                    <Button onClick={joinChannel} disabled={joining} className="flex-1">
                        {joining ? <Loader2 className="size-4 animate-spin" /> : <Video className="size-4" />}
                        Bật camera & Phát sóng
                    </Button>
                ) : (
                    <>
                        <Button variant="outline" size="sm" onClick={toggleMic}>
                            {micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
                            {micOn ? "Tắt mic" : "Bật mic"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={toggleCam}>
                            {camOn ? <Video className="size-4" /> : <VideoOff className="size-4" />}
                            {camOn ? "Tắt camera" : "Bật camera"}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={leaveChannel}>
                            Dừng phát sóng
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};
