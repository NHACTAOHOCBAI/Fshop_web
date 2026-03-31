import { useRef, useState } from "react";
import { Loader2, Mic, Square, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import type { VoiceSearchResponse } from "@/types/product";

type VoiceSearchDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (data: VoiceSearchResponse) => void;
};

export function VoiceSearchDialog({ open, onOpenChange, onSuccess }: VoiceSearchDialogProps) {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const timerRef = useRef<number | null>(null);

    const { mutate: submitVoice, isPending } = useVoiceSearch({
        onSuccess: (data) => {
            onSuccess(data);
            handleClose();
        },
        onError: (submitError) => {
            setError(submitError.message || "Không thể xử lý giọng nói. Vui lòng thử lại.");
        },
    });

    const resetState = () => {
        setIsRecording(false);
        setDuration(0);
        setError(null);
        setAudioFile(null);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        chunksRef.current = [];

        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    };

    const handleClose = () => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        resetState();
        onOpenChange(false);
    };

    const startTimer = () => {
        timerRef.current = window.setInterval(() => {
            setDuration((prev) => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const startRecording = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            setDuration(0);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                stopTimer();
                const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
                const file = new File([audioBlob], `voice-search-${Date.now()}.webm`, { type: "audio/webm" });
                setAudioFile(file);
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
                setIsRecording(false);

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop());
                    streamRef.current = null;
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            startTimer();
        } catch {
            setError("Không thể truy cập microphone. Vui lòng cấp quyền và thử lại.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    };

    const handleSubmit = () => {
        if (!audioFile) {
            setError("Vui lòng ghi âm trước khi tìm kiếm.");
            return;
        }

        submitVoice(audioFile);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Tìm kiếm bằng giọng nói</DialogTitle>
                    <DialogDescription>Nhấn ghi âm, nói từ khóa sản phẩm rồi gửi để tìm kiếm.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Thời lượng</span>
                            <span className="font-mono text-sm font-semibold text-slate-800">{formatDuration(duration)}</span>
                        </div>

                        <div className="mt-4 flex items-center justify-center">
                            {!isRecording ? (
                                <Button type="button" onClick={startRecording} disabled={isPending} className="gap-2">
                                    <Mic className="size-4" />
                                    Bắt đầu ghi âm
                                </Button>
                            ) : (
                                <Button type="button" variant="destructive" onClick={stopRecording} className="gap-2">
                                    <Square className="size-4" />
                                    Dừng ghi âm
                                </Button>
                            )}
                        </div>
                    </div>

                    {audioUrl ? (
                        <audio controls src={audioUrl} className="w-full" />
                    ) : null}

                    {error ? (
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                            <AlertCircle className="mt-0.5 size-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    ) : null}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleClose} disabled={isPending || isRecording}>
                        Hủy
                    </Button>
                    <Button type="button" onClick={handleSubmit} disabled={!audioFile || isPending || isRecording} className="gap-2">
                        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Mic className="size-4" />}
                        {isPending ? "Đang xử lý..." : "Tìm kiếm"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
