import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, Upload, X, Loader2, AlertCircle, Download, RefreshCw, Shirt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useProductById } from "@/hooks/useProducts";
import { useVirtualTryon2D } from "@/hooks/useProducts";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FORMATS = ["image/jpeg", "image/png", "image/webp"];

const ProductVTO2DPage = () => {
    const navigate = useNavigate();
    const { productId } = useParams<{ department?: string; productId?: string }>();
    const id = Number(productId);

    const productQuery = useProductById(id, Number.isFinite(id) && id > 0);
    const product = productQuery.data?.data;

    const [personFile, setPersonFile] = useState<File | null>(null);
    const [personPreview, setPersonPreview] = useState<string | null>(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { mutate: tryon, isPending, error: tryonError, reset } = useVirtualTryon2D();

    const garmentImageUrl =
        product?.images?.[0]?.imageUrl ?? product?.variants?.[0]?.imageUrl ?? null;

    const validateFile = (file: File): string | null => {
        if (!ACCEPTED_FORMATS.includes(file.type)) return "Chỉ hỗ trợ JPG, PNG hoặc WebP";
        if (file.size > MAX_FILE_SIZE) return "Kích thước ảnh không vượt quá 10MB";
        return null;
    };

    const handleFileSelect = (file: File) => {
        const err = validateFile(file);
        if (err) { setFileError(err); return; }
        setFileError(null);
        setResultImageUrl(null);
        reset();
        setPersonFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setPersonPreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleTryon = () => {
        if (!personFile || !id) return;
        tryon(
            { productId: id, personImage: personFile, garmentDesc: product?.name },
            {
                onSuccess: (data) => setResultImageUrl(data.resultImageUrl),
            },
        );
    };

    const handleReset = () => {
        setPersonFile(null);
        setPersonPreview(null);
        setResultImageUrl(null);
        setFileError(null);
        reset();
        if (inputRef.current) inputRef.current.value = "";
    };

    const handleDownload = () => {
        if (!resultImageUrl) return;
        const a = document.createElement("a");
        a.href = resultImageUrl;
        a.download = `tryon-${product?.name ?? "result"}.jpg`;
        a.target = "_blank";
        a.click();
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b bg-white px-4 py-3 shadow-sm">
                <div className="mx-auto flex max-w-5xl items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="shrink-0"
                    >
                        <ChevronLeft className="size-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Shirt className="size-5 text-primary" />
                        <h1 className="text-base font-semibold text-slate-800">Thử đồ 2D (AI)</h1>
                    </div>
                    {product && (
                        <span className="ml-auto truncate text-sm text-slate-500 max-w-[200px]">
                            {product.name}
                        </span>
                    )}
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-4 py-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Left: Inputs */}
                    <div className="space-y-5">
                        {/* Garment preview */}
                        <div className="rounded-xl border bg-white p-4 shadow-sm">
                            <p className="mb-3 text-sm font-medium text-slate-700">
                                🧥 Quần áo được chọn
                            </p>
                            {garmentImageUrl ? (
                                <img
                                    src={garmentImageUrl}
                                    alt={product?.name}
                                    className="mx-auto h-48 w-full rounded-lg object-contain"
                                />
                            ) : (
                                <div className="flex h-48 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400">
                                    {productQuery.isLoading ? "Đang tải..." : "Không có ảnh sản phẩm"}
                                </div>
                            )}
                        </div>

                        {/* Person photo upload */}
                        <div className="rounded-xl border bg-white p-4 shadow-sm">
                            <p className="mb-3 text-sm font-medium text-slate-700">
                                🧍 Ảnh của bạn
                            </p>

                            {!personPreview ? (
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                                    onDragLeave={() => setIsDragActive(false)}
                                    onDrop={handleDrop}
                                    onClick={() => inputRef.current?.click()}
                                    className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
                                        isDragActive
                                            ? "border-primary bg-primary/5"
                                            : "border-slate-300 hover:border-primary/50"
                                    }`}
                                >
                                    <Upload className="size-8 text-slate-400" />
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-primary">Nhấp để chọn ảnh</p>
                                        <p className="text-xs text-slate-500">hoặc kéo và thả vào đây</p>
                                    </div>
                                    <p className="text-xs text-slate-400">JPG, PNG, WebP • Tối đa 10MB</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    <img
                                        src={personPreview}
                                        alt="Ảnh của bạn"
                                        className="h-48 w-full rounded-lg object-contain"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        disabled={isPending}
                                        className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow-md hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        <X className="size-4 text-slate-600" />
                                    </button>
                                </div>
                            )}

                            <input
                                ref={inputRef}
                                type="file"
                                accept={ACCEPTED_FORMATS.join(",")}
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.currentTarget.files?.[0];
                                    if (f) handleFileSelect(f);
                                }}
                                disabled={isPending}
                            />

                            {fileError && (
                                <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                                    <AlertCircle className="size-4 shrink-0" />
                                    {fileError}
                                </div>
                            )}
                        </div>

                        {/* Action */}
                        <Button
                            onClick={handleTryon}
                            disabled={!personFile || !garmentImageUrl || isPending}
                            className="w-full gap-2"
                            size="lg"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Đang xử lý (~30-60 giây)...
                                </>
                            ) : (
                                <>
                                    <Shirt className="size-4" />
                                    Thử đồ ngay
                                </>
                            )}
                        </Button>

                        {isPending && (
                            <p className="text-center text-xs text-slate-500">
                                AI đang xử lý ảnh của bạn. Vui lòng chờ trong giây lát...
                            </p>
                        )}
                    </div>

                    {/* Right: Result */}
                    <div className="rounded-xl border bg-white p-4 shadow-sm">
                        <p className="mb-3 text-sm font-medium text-slate-700">
                            ✨ Kết quả thử đồ
                        </p>

                        {tryonError && (
                            <div className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                                <span>
                                    {(tryonError as Error).message || "Thử đồ thất bại. Vui lòng thử lại."}
                                </span>
                            </div>
                        )}

                        {resultImageUrl ? (
                            <div className="space-y-3">
                                <img
                                    src={resultImageUrl}
                                    alt="Kết quả thử đồ"
                                    className="w-full rounded-lg object-contain"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 gap-2"
                                        onClick={handleReset}
                                    >
                                        <RefreshCw className="size-4" />
                                        Thử lại
                                    </Button>
                                    <Button
                                        className="flex-1 gap-2"
                                        onClick={handleDownload}
                                    >
                                        <Download className="size-4" />
                                        Tải ảnh
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg bg-slate-50 text-slate-400">
                                {isPending ? (
                                    <>
                                        <Loader2 className="size-10 animate-spin text-primary" />
                                        <p className="text-sm">Đang tạo ảnh thử đồ...</p>
                                    </>
                                ) : (
                                    <>
                                        <Shirt className="size-10" />
                                        <p className="text-sm text-center">
                                            Tải ảnh của bạn lên và nhấn "Thử đồ ngay"
                                            <br />
                                            để xem kết quả tại đây
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductVTO2DPage;
