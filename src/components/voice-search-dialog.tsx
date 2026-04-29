import { useRef, useState, type ChangeEvent } from "react";
import { AlertCircle, FileAudio, Loader2, Mic, RotateCcw, Square, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";

type VoiceSearchDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (query: string) => void;
};

export function VoiceSearchDialog({ open, onOpenChange, onSuccess }: VoiceSearchDialogProps) {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    // Two-phase transcript state: committed (from API) + editable draft
    const [transcript, setTranscript] = useState("");
    const [transcriptDraft, setTranscriptDraft] = useState("");

    const timerRef = useRef<number | null>(null);
    const maxAudioFileSize = 10 * 1024 * 1024;
    const acceptedAudioTypes = [
        "audio/webm", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav",
        "audio/mp4", "audio/m4a", "audio/aac", "audio/ogg",
    ];

    // After transcription: show transcript in dialog for editing — don't close yet
    const { mutate: submitVoice, isPending } = useVoiceSearch({
        onSuccess: (data) => {
            const text = data.transcribed_text || "";
            setTranscript(text);
            setTranscriptDraft(text);
            setError(null);
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
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setTranscript("");
        setTranscriptDraft("");
        if (fileInputRef.current) fileInputRef.current.value = "";
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

    const setSelectedAudio = (file: File, previewSource?: Blob) => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioFile(file);
        setAudioUrl(URL.createObjectURL(previewSource ?? file));
        // Reset transcript when a new audio is selected
        setTranscript("");
        setTranscriptDraft("");
    };

    const validateAudioFile = (file: File) => {
        const normalizedType = file.type || "application/octet-stream";
        if (!acceptedAudioTypes.includes(normalizedType) && !normalizedType.startsWith("audio/")) {
            return "Định dạng audio không được hỗ trợ. Vui lòng chọn MP3, WAV, M4A, AAC, OGG hoặc WebM.";
        }
        if (file.size > maxAudioFileSize) {
            return "File audio không được vượt quá 10MB.";
        }
        return null;
    };

    const handlePickAudio = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError(null);
        const validationError = validateAudioFile(file);
        if (validationError) {
            setError(validationError);
            event.target.value = "";
            return;
        }

        setDuration(0);
        chunksRef.current = [];
        setSelectedAudio(file);
    };

    const clearSelectedAudio = () => {
        setAudioFile(null);
        setDuration(0);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            setAudioUrl(null);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTranscript("");
        setTranscriptDraft("");
    };

    const startRecording = async () => {
        try {
            setError(null);
            clearSelectedAudio();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            setDuration(0);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) chunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                stopTimer();
                const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
                const file = new File([audioBlob], `voice-search-${Date.now()}.webm`, { type: "audio/webm" });
                setSelectedAudio(file, audioBlob);
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

    // Step 1: transcribe the audio file (keeps dialog open)
    const handleTranscribe = () => {
        if (!audioFile) {
            setError("Vui lòng ghi âm hoặc chọn file audio trước khi phiên âm.");
            return;
        }
        setError(null);
        submitVoice(audioFile);
    };

    // Step 2: confirm the edited transcript and trigger search
    const handleSearch = () => {
        const query = transcriptDraft.trim();
        if (!query) {
            setError("Vui lòng nhập hoặc chỉnh sửa nội dung giọng nói trước khi tìm kiếm.");
            return;
        }
        onSuccess(query);
        handleClose();
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const hasTranscript = transcript.length > 0;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Tìm kiếm bằng giọng nói</DialogTitle>
                    <DialogDescription>
                        Ghi âm hoặc chọn file audio, sau đó phiên âm và chỉnh sửa nội dung trước khi tìm kiếm.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/webm,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/m4a,audio/aac,audio/ogg,audio/*"
                        className="hidden"
                        onChange={handlePickAudio}
                    />

                    {/* Recording controls */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Thời lượng</span>
                            <span className="font-mono text-sm font-semibold text-slate-800">{formatDuration(duration)}</span>
                        </div>

                        <div className="mt-4 flex items-center justify-center">
                            {!isRecording ? (
                                <Button
                                    type="button"
                                    onClick={startRecording}
                                    disabled={isPending}
                                    className="gap-2"
                                >
                                    <Mic className="size-4" />
                                    Bắt đầu ghi âm
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={stopRecording}
                                    className="gap-2"
                                >
                                    <Square className="size-4" />
                                    Dừng ghi âm
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* File upload */}
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                                    <FileAudio className="size-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">Chọn file audio</p>
                                    <p className="text-xs text-slate-500">Hỗ trợ MP3, WAV, M4A, AAC, OGG, WebM tối đa 10MB.</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isPending || isRecording}
                                className="gap-2"
                            >
                                <Upload className="size-4" />
                                Chọn file
                            </Button>
                        </div>
                    </div>

                    {/* Audio preview */}
                    {audioUrl && audioFile ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-800">{audioFile.name}</p>
                                    <p className="text-xs text-slate-500">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={clearSelectedAudio}
                                    disabled={isPending || isRecording}
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>
                            <audio controls src={audioUrl} className="w-full" />
                        </div>
                    ) : null}

                    {/* Transcript editing section (shown after transcription) */}
                    {isPending ? (
                        <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <Loader2 className="size-5 animate-spin text-primary" />
                            <div>
                                <p className="text-sm font-medium text-slate-700">Đang nhận diện giọng nói...</p>
                                <p className="text-xs text-slate-400">Vui lòng chờ trong giây lát</p>
                            </div>
                        </div>
                    ) : hasTranscript ? (
                        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                            <div className="mb-2 flex items-center gap-2">
                                <Mic className="size-3.5 text-sky-600" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                                    Nội dung nhận diện được
                                </p>
                            </div>
                            <Textarea
                                value={transcriptDraft}
                                onChange={(e) => setTranscriptDraft(e.target.value)}
                                placeholder="Chỉnh sửa nội dung trước khi tìm kiếm..."
                                className="min-h-20 bg-white text-sm"
                                autoFocus
                            />
                            <p className="mt-1.5 text-xs text-sky-600">
                                Bạn có thể chỉnh sửa văn bản trước khi tìm kiếm.
                            </p>
                        </div>
                    ) : null}

                    {/* Error display */}
                    {error ? (
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                            <AlertCircle className="mt-0.5 size-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    ) : null}
                </div>

                <DialogFooter>
                    {hasTranscript ? (
                        // Step 2: transcript ready — show retry + search
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setTranscript("");
                                    setTranscriptDraft("");
                                    setError(null);
                                }}
                            >
                                <RotateCcw className="size-4" />
                                Phiên âm lại
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSearch}
                                disabled={!transcriptDraft.trim()}
                                className="gap-2"
                            >
                                <Mic className="size-4" />
                                Tìm kiếm
                            </Button>
                        </>
                    ) : (
                        // Step 1: input audio — show cancel + transcribe
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isPending || isRecording}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="button"
                                onClick={handleTranscribe}
                                disabled={!audioFile || isPending || isRecording}
                                className="gap-2"
                            >
                                {isPending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Mic className="size-4" />
                                )}
                                {isPending ? "Đang phiên âm..." : "Phiên âm"}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
