import { useEffect, useRef, useState } from "react";

type UseVoiceRecorderOptions = {
  onRecorded: (file: File) => void;
};

const pickSupportedMimeType = () => {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
};

export const useVoiceRecorder = ({ onRecorded }: UseVoiceRecorderOptions) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const shouldDiscardRef = useRef(false);

  const cleanup = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setRecordingStartedAt(null);
    setIsRecording(false);
  };

  useEffect(() => cleanup, []);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      throw new Error("This browser does not support audio recording.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = pickSupportedMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    chunksRef.current = [];
    shouldDiscardRef.current = false;
    streamRef.current = stream;
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      if (shouldDiscardRef.current) {
        shouldDiscardRef.current = false;
        cleanup();
        return;
      }

      const finalType = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: finalType });
      if (blob.size > 0) {
        const extension = finalType.includes("ogg") ? "ogg" : "webm";
        onRecorded(new File([blob], `support-voice-${Date.now()}.${extension}`, { type: finalType }));
      }
      cleanup();
    };

    recorder.start();
    setIsRecording(true);
    setRecordingStartedAt(Date.now());
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    shouldDiscardRef.current = false;
    if (!recorder || recorder.state !== "recording") {
      cleanup();
      return;
    }
    recorder.stop();
  };

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current;
    shouldDiscardRef.current = true;
    if (recorder?.state === "recording") {
      recorder.stop();
    } else {
      cleanup();
    }
  };

  return {
    isRecording,
    recordingStartedAt,
    startRecording,
    stopRecording,
    cancelRecording,
  };
};
