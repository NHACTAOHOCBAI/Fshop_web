import { useState, useRef } from "react";
import { useParams, Link } from "react-router";
import { 
    ChevronLeft, 
    Upload, 
    X, 
    Loader2, 
    AlertCircle, 
    Download, 
    RefreshCw, 
    Shirt, 
    ShoppingBag, 
    User, 
    Sparkles, 
    Info, 
    ShoppingCart 
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useProductById } from "@/hooks/useProducts";
import { useVirtualTryon2D } from "@/hooks/useProducts";
import { useAddToCart } from "@/hooks/useCart";
import { extractApiErrorMessage } from "@/lib/api-error";
import { formatCurrency } from "@/lib/utils";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FORMATS = ["image/jpeg", "image/png", "image/webp"];

const SAMPLE_MODELS = [
    {
        id: "female1",
        name: "Mẫu Nữ 1",
        imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
    },
    {
        id: "female2",
        name: "Mẫu Nữ 2",
        imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80",
    },
    {
        id: "male1",
        name: "Mẫu Nam 1",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
    },
    {
        id: "male2",
        name: "Mẫu Nam 2",
        imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
    }
];

const ProductVTO2DPage = () => {
    const { department, productId } = useParams<{ department?: string; productId?: string }>();
    const id = Number(productId);

    const productQuery = useProductById(id, Number.isFinite(id) && id > 0);
    const product = productQuery.data?.data;

    const [personFile, setPersonFile] = useState<File | null>(null);
    const [personPreview, setPersonPreview] = useState<string | null>(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
    const [showOriginal, setShowOriginal] = useState(false);
    const [isLoadingSample, setIsLoadingSample] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { mutate: tryon, isPending, error: tryonError, reset } = useVirtualTryon2D();
    const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();

    const garmentImageUrl =
        product?.images?.[0]?.imageUrl ?? product?.variants?.[0]?.imageUrl ?? null;

    const firstVariant = product?.variants?.[0];

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

    const handleSelectSampleModel = async (url: string) => {
        setIsLoadingSample(true);
        setFileError(null);
        setResultImageUrl(null);
        reset();
        try {
            setPersonPreview(url);
            const response = await fetch(url);
            const blob = await response.blob();
            const file = new File([blob], "sample-model.jpg", { type: "image/jpeg" });
            setPersonFile(file);
        } catch (err) {
            setFileError("Không thể tải ảnh mẫu. Vui lòng thử lại.");
        } finally {
            setIsLoadingSample(false);
        }
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
                onSuccess: (data) => {
                    setResultImageUrl(data.resultImageUrl);
                    setShowOriginal(false);
                },
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
        const urlToDownload = showOriginal ? personPreview : resultImageUrl;
        if (!urlToDownload) return;
        const a = document.createElement("a");
        a.href = urlToDownload;
        a.download = `tryon-${product?.name ?? "result"}.jpg`;
        a.target = "_blank";
        a.click();
    };

    const handleAddToCart = () => {
        if (!firstVariant) {
            toast.error("Không tìm thấy phân loại sản phẩm phù hợp");
            return;
        }

        addToCart(
            {
                variantId: firstVariant.id,
                quantity: 1,
            },
            {
                onSuccess: () => {
                    toast.success("Đã thêm sản phẩm vào giỏ hàng");
                },
                onError: (error) => {
                    toast.error(extractApiErrorMessage(error, "Không thể thêm vào giỏ hàng"));
                },
            }
        );
    };

    return (
        <div className="space-y-6">
            {/* Navigation & Breadcrumbs */}
            <div>
                <Link
                    to={`/${department || "men"}/products/${id}`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                    <ChevronLeft className="size-4" />
                    Quay lại chi tiết sản phẩm
                </Link>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-slate-900">Thử đồ 2D (AI)</h1>
                {product && (
                    <p className="text-sm text-slate-500">
                        Sản phẩm: <span className="font-semibold text-slate-700">{product.name}</span>
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left: Inputs */}
                <div className="space-y-5">
                    {/* Garment preview */}
                    <div className="rounded-lg border border-slate-200 bg-white p-6">
                        <div className="mb-3 flex items-center gap-2">
                            <ShoppingBag className="size-4 text-primary" />
                            <span className="text-sm font-semibold text-slate-700">Quần áo được chọn</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
                            {garmentImageUrl ? (
                                <img
                                    src={garmentImageUrl}
                                    alt={product?.name}
                                    className="mx-auto h-40 w-full rounded-lg object-contain border border-slate-100 bg-slate-50"
                                />
                            ) : (
                                <div className="flex h-40 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
                                    {productQuery.isLoading ? "Đang tải..." : "Không có ảnh sản phẩm"}
                                </div>
                            )}
                            {product && (
                                <div className="flex flex-col justify-between">
                                    <div className="space-y-1.5">
                                        <h3 className="font-semibold text-slate-900 text-sm line-clamp-2">{product.name}</h3>
                                        <p className="text-xs text-slate-500">Thương hiệu: <span className="font-medium text-slate-700">{product.brand?.name ?? "Đang cập nhật"}</span></p>
                                        <p className="text-sm font-bold text-primary">{formatCurrency(Number(product.price))}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-3 gap-2 w-fit"
                                        disabled={isAddingToCart || !firstVariant}
                                        onClick={handleAddToCart}
                                    >
                                        <ShoppingCart className="size-3.5" />
                                        Thêm vào giỏ
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Person photo upload */}
                    <div className="rounded-lg border border-slate-200 bg-white p-6">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="size-4 text-primary" />
                                <span className="text-sm font-semibold text-slate-700">Ảnh của bạn</span>
                            </div>
                            {isLoadingSample && <Loader2 className="size-4 animate-spin text-slate-400" />}
                        </div>

                        {!personPreview ? (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                                onDragLeave={() => setIsDragActive(false)}
                                onDrop={handleDrop}
                                onClick={() => inputRef.current?.click()}
                                className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
                                    isDragActive
                                        ? "border-primary bg-primary/5"
                                        : "border-slate-200 hover:border-primary/50"
                                }`}
                            >
                                <Upload className="size-8 text-slate-400" />
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-primary">Nhấp để chọn ảnh</p>
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
                                    className="absolute -right-2 -top-2 rounded-full border border-slate-200 bg-white p-1 hover:bg-slate-50 disabled:opacity-50"
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
                            disabled={isPending || isLoadingSample}
                        />

                        {/* Sample models selection */}
                        <div className="mt-5">
                            <p className="text-xs font-semibold text-slate-500 mb-2">Hoặc thử nhanh với ảnh người mẫu mẫu:</p>
                            <div className="flex flex-wrap gap-3">
                                {SAMPLE_MODELS.map((model) => (
                                    <button
                                        key={model.id}
                                        type="button"
                                        disabled={isPending || isLoadingSample}
                                        onClick={() => handleSelectSampleModel(model.imageUrl)}
                                        className="group relative flex flex-col items-center gap-1.5 focus:outline-none"
                                    >
                                        <div className="size-12 overflow-hidden rounded-full border-2 border-slate-200 transition group-hover:border-primary group-focus:border-primary">
                                            <img
                                                src={model.imageUrl}
                                                alt={model.name}
                                                className="size-full object-cover"
                                            />
                                        </div>
                                        <span className="text-[10px] text-slate-500 group-hover:text-primary transition">{model.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

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
                        disabled={!personFile || !garmentImageUrl || isPending || isLoadingSample}
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

                    {/* VTO Tips */}
                    <div className="rounded-lg border border-sky-100 bg-sky-50/50 p-4 text-sky-900 text-xs space-y-2">
                        <div className="flex items-center gap-1.5 font-semibold">
                            <Info className="size-4 text-sky-600" />
                            <span>Mẹo để có kết quả thử đồ đẹp nhất:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sky-800">
                            <li>Nên đứng thẳng người, đối diện trực tiếp với máy ảnh.</li>
                            <li>Chọn ảnh có ánh sáng rõ ràng, không bị mờ nhòe.</li>
                            <li>Mặc trang phục đơn giản, ôm vừa vặn cơ thể để AI ghép chuẩn xác hơn.</li>
                            <li>Hạn chế ảnh có hậu cảnh quá phức tạp hoặc có người khác đứng gần.</li>
                        </ul>
                    </div>
                </div>

                {/* Right: Result */}
                <div className="rounded-lg border border-slate-200 bg-white p-6 flex flex-col justify-between min-h-[400px]">
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="size-4 text-primary" />
                                <span className="text-sm font-semibold text-slate-700">Kết quả thử đồ</span>
                            </div>
                            {resultImageUrl && (
                                <div className="flex gap-1.5 bg-slate-100 p-0.5 rounded-md text-[10px] font-medium border border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowOriginal(false)}
                                        className={`px-2 py-0.5 rounded transition ${
                                            !showOriginal ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                                        }`}
                                    >
                                        Mặc thử
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowOriginal(true)}
                                        className={`px-2 py-0.5 rounded transition ${
                                            showOriginal ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                                        }`}
                                    >
                                        Ảnh gốc
                                    </button>
                                </div>
                            )}
                        </div>

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
                                <div className="relative border border-slate-100 rounded-lg overflow-hidden bg-slate-50">
                                    <img
                                        src={showOriginal ? (personPreview ?? "") : resultImageUrl}
                                        alt="Kết quả thử đồ"
                                        className="mx-auto max-h-[400px] w-auto rounded-lg object-contain"
                                    />
                                    {showOriginal && (
                                        <span className="absolute bottom-2 left-2 bg-slate-900/60 text-white text-[10px] px-2 py-0.5 rounded">
                                            Ảnh gốc
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-lg bg-slate-50/50 text-slate-400 border border-dashed border-slate-200">
                                {isPending ? (
                                    <>
                                        <Loader2 className="size-10 animate-spin text-primary" />
                                        <p className="text-sm">Đang tạo ảnh thử đồ...</p>
                                    </>
                                ) : (
                                    <>
                                        <Shirt className="size-10" />
                                        <p className="text-sm text-center">
                                            Tải ảnh của bạn lên hoặc chọn ảnh mẫu,
                                            <br />
                                            sau đó nhấn "Thử đồ ngay"
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {resultImageUrl && (
                        <div className="flex gap-2 mt-4">
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
                                {showOriginal ? "Tải ảnh gốc" : "Tải ảnh kết quả"}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductVTO2DPage;
