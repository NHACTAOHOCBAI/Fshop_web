import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { AlertCircle, ChevronLeft, Download, Loader2, Sparkles, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProductById, useProducts, useVirtualTryonOutfit } from "@/hooks/useProducts";
import type { Product } from "@/types/product";

const MAX_PRODUCTS = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FORMATS = ["image/jpeg", "image/png", "image/webp"];

const getProductImage = (product?: Product | null) =>
    product?.images?.[0]?.imageUrl ?? product?.variants?.[0]?.imageUrl ?? null;

const parseInitialProductIds = (value: string | null) => {
    if (!value) return [];
    return Array.from(new Set(value.split(",").map((item) => Number(item.trim())).filter((id) => Number.isInteger(id) && id > 0))).slice(0, MAX_PRODUCTS);
};

const ProductOutfitTryonPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialProductIds = useMemo(() => parseInitialProductIds(searchParams.get("productIds")), [searchParams]);
    const firstProductId = initialProductIds[0] ?? 0;

    const [selectedIds, setSelectedIds] = useState<number[]>(initialProductIds);
    const [search, setSearch] = useState("");
    const [personFile, setPersonFile] = useState<File | null>(null);
    const [personPreview, setPersonPreview] = useState<string | null>(null);
    const [stylePrompt, setStylePrompt] = useState("Giữ gương mặt, dáng người và ánh sáng tự nhiên; phối outfit như ảnh sản phẩm.");
    const [fileError, setFileError] = useState<string | null>(null);
    const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const preselectedQuery = useProductById(firstProductId, firstProductId > 0);
    const productsQuery = useProducts({
        page: 1,
        limit: 30,
        search: search.trim() || undefined,
        sortBy: "createdAt",
        sortOrder: "DESC",
    });
    const outfitMutation = useVirtualTryonOutfit();

    const products = useMemo(() => {
        const map = new Map<number, Product>();
        const preselected = preselectedQuery.data?.data;
        if (preselected) map.set(preselected.id, preselected);
        for (const product of productsQuery.data?.data ?? []) map.set(product.id, product);
        return Array.from(map.values());
    }, [preselectedQuery.data?.data, productsQuery.data?.data]);

    useEffect(() => {
        return () => {
            if (personPreview?.startsWith("blob:")) URL.revokeObjectURL(personPreview);
        };
    }, [personPreview]);

    const validateFile = (file: File) => {
        if (!ACCEPTED_FORMATS.includes(file.type)) return "Chỉ hỗ trợ JPG, PNG hoặc WebP.";
        if (file.size > MAX_FILE_SIZE) return "Kích thước ảnh không vượt quá 10MB.";
        return null;
    };

    const handleFileSelect = (file: File) => {
        const error = validateFile(file);
        if (error) {
            setFileError(error);
            return;
        }
        setFileError(null);
        setPersonFile(file);
        setResultImageUrl(null);
        if (personPreview?.startsWith("blob:")) URL.revokeObjectURL(personPreview);
        setPersonPreview(URL.createObjectURL(file));
        outfitMutation.reset();
    };

    const toggleProduct = (productId: number) => {
        setResultImageUrl(null);
        setSelectedIds((current) => {
            if (current.includes(productId)) return current.filter((id) => id !== productId);
            if (current.length >= MAX_PRODUCTS) return current;
            return [...current, productId];
        });
    };

    const handleSubmit = () => {
        if (!personFile || selectedIds.length === 0) return;
        outfitMutation.mutate(
            { personImage: personFile, productIds: selectedIds, stylePrompt },
            { onSuccess: (data) => setResultImageUrl(data.resultImageUrl) },
        );
    };

    const handleDownload = () => {
        if (!resultImageUrl) return;
        const link = document.createElement("a");
        link.href = resultImageUrl;
        link.target = "_blank";
        link.download = "gemini-outfit-preview.jpg";
        link.click();
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="sticky top-0 z-10 border-b bg-white px-4 py-3 shadow-sm">
                <div className="mx-auto flex max-w-6xl items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ChevronLeft className="size-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Sparkles className="size-5 text-primary" />
                        <h1 className="text-base font-semibold text-slate-900">Thử phối đồ AI</h1>
                    </div>
                    <p className="ml-auto hidden text-xs text-slate-500 sm:block">Ảnh AI chỉ mang tính tham khảo phối đồ.</p>
                </div>
            </div>

            <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[1fr_1.1fr]">
                <section className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-800">Ảnh của bạn</h2>
                            <span className="text-xs text-slate-500">JPG, PNG, WebP · tối đa 10MB</span>
                        </div>
                        {personPreview ? (
                            <div className="relative overflow-hidden rounded-lg bg-slate-100">
                                <img src={personPreview} alt="Ảnh của bạn" className="h-72 w-full object-contain" />
                                <button
                                    type="button"
                                    disabled={outfitMutation.isPending}
                                    onClick={() => {
                                        setPersonFile(null);
                                        setPersonPreview(null);
                                        setResultImageUrl(null);
                                        if (inputRef.current) inputRef.current.value = "";
                                    }}
                                    className="absolute right-2 top-2 rounded-full bg-white p-1.5 shadow-sm"
                                >
                                    <X className="size-4 text-slate-600" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="flex h-72 w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition-colors hover:border-primary/50 hover:bg-primary/5"
                            >
                                <Upload className="size-8" />
                                <span className="text-sm font-medium text-primary">Chọn ảnh người mẫu/của bạn</span>
                            </button>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            accept={ACCEPTED_FORMATS.join(",")}
                            className="hidden"
                            onChange={(event) => {
                                const file = event.currentTarget.files?.[0];
                                if (file) handleFileSelect(file);
                            }}
                        />
                        {fileError ? (
                            <p className="mt-3 flex items-center gap-2 text-sm text-destructive">
                                <AlertCircle className="size-4" />
                                {fileError}
                            </p>
                        ) : null}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h2 className="text-sm font-semibold text-slate-800">Yêu cầu phối đồ</h2>
                        <Textarea
                            value={stylePrompt}
                            onChange={(event) => setStylePrompt(event.target.value)}
                            className="mt-3 min-h-24"
                            placeholder="Ví dụ: phối tự nhiên, nền sáng, giữ logo sản phẩm rõ..."
                        />
                        <Button
                            type="button"
                            className="mt-4 w-full gap-2"
                            size="lg"
                            disabled={!personFile || selectedIds.length === 0 || outfitMutation.isPending}
                            onClick={handleSubmit}
                        >
                            {outfitMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                            {outfitMutation.isPending ? "Gemini đang tạo ảnh..." : "Tạo ảnh phối đồ"}
                        </Button>
                        <p className="mt-2 text-center text-xs text-slate-500">Gemini có thể mất 30-90 giây tùy ảnh và số sản phẩm.</p>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-800">Sản phẩm phối thử</h2>
                                <p className="text-xs text-slate-500">Chọn tối đa {MAX_PRODUCTS} sản phẩm. Đã chọn {selectedIds.length}/{MAX_PRODUCTS}.</p>
                            </div>
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Tìm sản phẩm..."
                                className="ml-auto w-full sm:w-64"
                            />
                        </div>

                        <div className="grid max-h-[28rem] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                            {products.map((product) => {
                                const selected = selectedIds.includes(product.id);
                                const disabled = !selected && selectedIds.length >= MAX_PRODUCTS;
                                const imageUrl = getProductImage(product);

                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => toggleProduct(product.id)}
                                        className={`flex gap-3 rounded-lg border p-3 text-left transition-colors ${
                                            selected
                                                ? "border-primary bg-primary/5"
                                                : "border-slate-200 bg-white hover:border-primary/40 disabled:opacity-45"
                                        }`}
                                    >
                                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                                            {imageUrl ? <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" /> : null}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="line-clamp-2 text-sm font-semibold text-slate-900">{product.name}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {[product.brand?.name, product.category?.name].filter(Boolean).join(" · ") || "FShop"}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                            {productsQuery.isLoading ? <p className="col-span-full py-5 text-center text-sm text-slate-500">Đang tải sản phẩm...</p> : null}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-800">Kết quả</h2>
                            {resultImageUrl ? (
                                <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                                    <Download className="size-4" />
                                    Tải ảnh
                                </Button>
                            ) : null}
                        </div>
                        {outfitMutation.error ? (
                            <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                                {(outfitMutation.error as Error).message || "Gemini chưa tạo được ảnh. Vui lòng thử ảnh rõ hơn hoặc ít sản phẩm hơn."}
                            </div>
                        ) : null}
                        {resultImageUrl ? (
                            <img src={resultImageUrl} alt="Kết quả phối đồ AI" className="w-full rounded-lg object-contain" />
                        ) : (
                            <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-lg bg-slate-50 text-center text-sm text-slate-500">
                                {outfitMutation.isPending ? (
                                    <>
                                        <Loader2 className="size-10 animate-spin text-primary" />
                                        <span>Gemini đang phối outfit từ ảnh và sản phẩm...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="size-10 text-slate-300" />
                                        <span>Upload ảnh, chọn sản phẩm rồi tạo preview tại đây.</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ProductOutfitTryonPage;
