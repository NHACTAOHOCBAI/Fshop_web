import { useMemo } from "react";

import { UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type PreviewFile = File & { preview?: string };

interface ImageUploadProps {
    value: File[] | undefined;
    onChange: (files: File[]) => void;
    label?: string;
    numOfImage: number;
    disabled?: boolean;
    error?: string;
}

export function ImageUpload({
    value,
    onChange,
    label,
    numOfImage,
    disabled,
    error,
}: ImageUploadProps) {
    const files = value ?? [];

    const previews = useMemo(
        () =>
            files.map((file) => {
                const previewFile = file as PreviewFile;
                return {
                    file,
                    url: previewFile.preview ?? URL.createObjectURL(file),
                };
            }),
        [files]
    );

    const handleFileSelect = (selectedFiles: FileList | null) => {
        if (!selectedFiles || disabled) {
            return;
        }

        const incoming = Array.from(selectedFiles);
        const remain = Math.max(0, numOfImage - files.length);
        const next = [...files, ...incoming.slice(0, remain)];
        onChange(next);
    };

    const removeFile = (file: File) => {
        if (disabled) {
            return;
        }

        onChange(files.filter((item) => item !== file));
    };

    return (
        <div className="space-y-2">
            {label && <p className="text-sm font-medium">{label}</p>}

            <label
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition ${
                    disabled || files.length >= numOfImage
                        ? "cursor-not-allowed opacity-60"
                        : "hover:border-primary"
                }`}
            >
                <UploadCloud className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    {files.length >= numOfImage
                        ? "Maximum number of images reached"
                        : "Click to upload image"}
                </p>
                <p className="text-xs text-muted-foreground">
                    {files.length}/{numOfImage} image(s)
                </p>
                <input
                    type="file"
                    accept="image/*"
                    multiple={numOfImage > 1}
                    disabled={disabled || files.length >= numOfImage}
                    className="hidden"
                    onChange={(event) => {
                        handleFileSelect(event.target.files);
                        event.target.value = "";
                    }}
                />
            </label>

            {previews.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {previews.map(({ file, url }, index) => (
                        <div key={`${file.name}-${index}`} className="group relative overflow-hidden rounded-md border">
                            <img src={url} alt={file.name} className="h-28 w-full object-cover" />
                            <Button
                                type="button"
                                size="icon-sm"
                                variant="outline"
                                className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100"
                                onClick={() => removeFile(file)}
                                disabled={disabled}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}
