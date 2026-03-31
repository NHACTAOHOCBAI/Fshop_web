import { useState } from "react";
import { Upload, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useImageSearch } from "@/hooks/useImageSearch";
import type { ImageSearchResult } from "@/types/product";

interface ImageSearchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (results: ImageSearchResult[]) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FORMATS = ["image/jpeg", "image/png", "image/webp"];

export function ImageSearchDialog({
    open,
    onOpenChange,
    onSuccess,
}: ImageSearchDialogProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragActive, setIsDragActive] = useState(false);

    const { mutate: searchImage, isPending } = useImageSearch({
        onSuccess: (results) => {
            onSuccess(results);
            handleClose();
        },
        onError: (error) => {
            setError(error.message || "Không thể tìm kiếm ảnh. Vui lòng thử lại.");
        },
    });

    const validateFile = (file: File): string | null => {
        if (!ACCEPTED_FORMATS.includes(file.type)) {
            return "Chỉ hỗ trợ định dạng JPG, PNG hoặc WebP";
        }
        if (file.size > MAX_FILE_SIZE) {
            return "Kích thước ảnh không vượt quá 5MB";
        }
        return null;
    };

    const handleFileSelect = (file: File) => {
        const validation = validateFile(file);
        if (validation) {
            setError(validation);
            return;
        }

        setError(null);
        setSelectedFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.currentTarget.files;
        if (files?.length) {
            handleFileSelect(files[0]);
        }
    };

    const handleSearch = () => {
        if (selectedFile) {
            searchImage(selectedFile);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setPreview(null);
        setError(null);
        setIsDragActive(false);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Tìm kiếm bằng hình ảnh</DialogTitle>
                    <DialogDescription>
                        Tải lên một hình ảnh để tìm các sản phẩm tương tự
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Upload Area */}
                    <div
                        onDrag={handleDrag}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                            isDragActive
                                ? "border-primary bg-primary/5"
                                : "border-slate-300 hover:border-primary/50"
                        } ${preview ? "hidden" : ""}`}
                    >
                        <div className="flex flex-col items-center gap-3">
                            <Upload className="size-8 text-slate-400" />
                            <div>
                                <label
                                    htmlFor="image-upload"
                                    className="cursor-pointer text-sm font-medium text-primary hover:underline"
                                >
                                    Nhấp để chọn ảnh
                                </label>
                                <p className="text-xs text-slate-500">
                                    hoặc kéo và thả ảnh vào đây
                                </p>
                            </div>
                            <p className="text-xs text-slate-400">
                                JPG, PNG hoặc WebP • Tối đa 5MB
                            </p>
                        </div>
                        <input
                            id="image-upload"
                            type="file"
                            accept={ACCEPTED_FORMATS.join(",")}
                            onChange={handleInputChange}
                            className="hidden"
                            disabled={isPending}
                        />
                    </div>

                    {/* Image Preview */}
                    {preview && (
                        <div className="relative space-y-3">
                            <div className="relative overflow-hidden rounded-lg bg-slate-100">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="h-auto w-full object-contain"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedFile(null);
                                    setPreview(null);
                                    setError(null);
                                }}
                                disabled={isPending}
                                className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow-md hover:bg-slate-50 disabled:opacity-50"
                            >
                                <X className="size-4 text-slate-600" />
                            </button>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="flex gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                            <AlertCircle className="mt-0.5 size-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isPending}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSearch}
                        disabled={!selectedFile || isPending}
                        className="gap-2"
                    >
                        {isPending && <Loader2 className="size-4 animate-spin" />}
                        {isPending ? "Đang tìm kiếm..." : "Tìm kiếm"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
