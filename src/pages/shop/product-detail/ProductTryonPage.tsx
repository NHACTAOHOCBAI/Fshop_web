import { Camera, Loader2, RotateCcw, ChevronLeft, ShoppingBag, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useProductById, useProductTryonAssets } from "@/hooks/useProducts";
import { BE_URL } from "@/lib/axios";
import type { ProductTryonAsset } from "@/types/product";
import { useAddToCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";
import { extractApiErrorMessage } from "@/lib/api-error";

type DeepARInstance = {
    shutdown?: () => void | Promise<void>;
};

const AR_OUTPUT_ASPECT_RATIO = 16 / 9;
const AR_OUTPUT_MAX_WIDTH = 1920;
const AR_OUTPUT_MIN_WIDTH = 1280;
const AR_CAMERA_WIDTH = 1920;
const AR_CAMERA_HEIGHT = 1080;
const AR_CAMERA_FPS = 30;

const resolveEffectUrl = (url: string) => {
    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    return `${BE_URL.replace(/\/$/, "")}/${url.replace(/^\/?(api\/v1\/)?/, "")}`;
};

const isInternalEffectUrl = (url: string) => url.startsWith("/api/v1/products/tryon-effects/");

const shouldUseDevApiProxy = () => {
    if (!/^https?:\/\/[^/]*ngrok[^/]*/i.test(BE_URL)) {
        return false;
    }

    return ["localhost", "127.0.0.1"].includes(window.location.hostname);
};

const getDeepAREffectUrl = (url: string) => {
    if (isInternalEffectUrl(url) && shouldUseDevApiProxy()) {
        return url;
    }

    return resolveEffectUrl(url);
};

const configureCanvasResolution = (canvas: HTMLCanvasElement) => {
    const bounds = canvas.getBoundingClientRect();
    const cssWidth = bounds.width || AR_OUTPUT_MIN_WIDTH;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const outputWidth = Math.min(
        Math.max(Math.round(cssWidth * dpr), AR_OUTPUT_MIN_WIDTH),
        AR_OUTPUT_MAX_WIDTH,
    );
    const outputHeight = Math.round(outputWidth / AR_OUTPUT_ASPECT_RATIO);

    canvas.width = outputWidth;
    canvas.height = outputHeight;
};

const ProductTryonPage = () => {
    const params = useParams<{ department?: string; productId?: string }>();
    const department = params.department || "men";
    const productId = Number(params.productId);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const deepARRef = useRef<DeepARInstance | null>(null);

    const productQuery = useProductById(productId, Number.isFinite(productId) && productId > 0);
    const assetsQuery = useProductTryonAssets(productId, Number.isFinite(productId) && productId > 0);
    const assets = useMemo(() => assetsQuery.data?.data ?? [], [assetsQuery.data?.data]);
    const product = productQuery.data?.data;

    const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const [runtimeError, setRuntimeError] = useState<string | null>(null);

    const { mutate: addToCart, isPending: isAddingToCart } = useAddToCart();

    const firstVariant = product?.variants?.[0];

    const selectedAsset = useMemo<ProductTryonAsset | null>(() => {
        if (assets.length === 0) {
            return null;
        }

        return assets.find((asset) => asset.id === selectedAssetId) ?? assets[0];
    }, [assets, selectedAssetId]);

    useEffect(() => {
        if (!selectedAssetId && assets[0]) {
            setSelectedAssetId(assets[0].id);
        }
    }, [assets, selectedAssetId]);

    useEffect(() => {
        let cancelled = false;

        const cleanupDeepAR = async () => {
            const currentInstance = deepARRef.current;
            deepARRef.current = null;
            if (currentInstance?.shutdown) {
                await currentInstance.shutdown();
            }
        };

        const initializeDeepAR = async () => {
            if (!selectedAsset || !canvasRef.current) {
                return;
            }

            const licenseKey = import.meta.env.VITE_DEEPAR_LICENSE_KEY;
            if (!licenseKey) {
                setRuntimeError("Thiếu cấu hình VITE_DEEPAR_LICENSE_KEY trên hệ thống.");
                return;
            }

            if (!navigator.mediaDevices?.getUserMedia) {
                setRuntimeError("Trình duyệt này không hỗ trợ truy cập camera.");
                return;
            }

            setIsInitializing(true);
            setRuntimeError(null);

            try {
                await cleanupDeepAR();
                const deepar = await import("deepar");
                if (cancelled || !canvasRef.current) {
                    return;
                }

                configureCanvasResolution(canvasRef.current);

                const instance = await deepar.initialize({
                    licenseKey,
                    canvas: canvasRef.current,
                    effect: getDeepAREffectUrl(selectedAsset.deeparEffectUrl),
                    additionalOptions: {
                        hint: "faceInit",
                        cameraConfig: {
                            disableDefaultCamera: true,
                        },
                    },
                });

                if (cancelled) {
                    await instance.shutdown?.();
                    return;
                }

                await instance.startCamera?.({
                    mirror: true,
                    mediaStreamConstraints: {
                        audio: false,
                        video: {
                            facingMode: "user",
                            width: { ideal: AR_CAMERA_WIDTH },
                            height: { ideal: AR_CAMERA_HEIGHT },
                            frameRate: { ideal: AR_CAMERA_FPS },
                        },
                    },
                });

                if (cancelled) {
                    await instance.shutdown?.();
                    return;
                }

                deepARRef.current = instance;
            } catch (error) {
                const message = error instanceof Error ? error.message : "Không thể khởi động DeepAR.";
                setRuntimeError(message);
            } finally {
                if (!cancelled) {
                    setIsInitializing(false);
                }
            }
        };

        void initializeDeepAR();

        return () => {
            cancelled = true;
            void cleanupDeepAR();
        };
    }, [selectedAsset]);

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

    const isLoading = productQuery.isLoading || assetsQuery.isLoading;
    const hasAssets = assets.length > 0;

    if (isLoading) {
        return (
            <div className="flex min-h-[65vh] items-center justify-center text-sm text-slate-500">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Đang tải trải nghiệm AR...
            </div>
        );
    }

    if (productQuery.isError || !product) {
        return (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <p>Không thể tải sản phẩm để thực hiện thử đồ AR.</p>
                <Button asChild variant="outline">
                    <Link to={`/${department}`}>Quay lại danh sách</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Navigation & Breadcrumbs */}
            <div>
                <Link
                    to={`/${department}/products/${product.id}`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                    <ChevronLeft className="size-4" />
                    Quay lại chi tiết sản phẩm
                </Link>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold text-slate-900">Thử đồ AR (DeepAR)</h1>
                <p className="text-sm text-slate-500">
                    Sản phẩm: <span className="font-semibold text-slate-700">{product.name}</span>
                </p>
            </div>

            {!hasAssets ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                    Sản phẩm này hiện chưa có phụ kiện thử đồ AR tương thích.
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    {/* Left Panel: Camera View */}
                    <section className="relative overflow-hidden rounded-lg bg-black border border-slate-200">
                        <canvas
                            ref={canvasRef}
                            className="block aspect-video w-full bg-black"
                        />

                        {(isInitializing || runtimeError) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-6 text-center text-white">
                                {isInitializing ? (
                                    <div className="space-y-3">
                                        <Loader2 className="mx-auto size-7 animate-spin" />
                                        <p className="text-sm">Đang kết nối camera và tải hiệu ứng AR...</p>
                                    </div>
                                ) : (
                                    <div className="max-w-md space-y-3">
                                        <Camera className="mx-auto size-7 text-red-400" />
                                        <p className="text-sm text-red-200">{runtimeError}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Right Panel: Controls & Info */}
                    <aside className="space-y-5">
                        {/* Product info card */}
                        <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="size-4 text-primary" />
                                <span className="text-sm font-semibold text-slate-700">Thông tin sản phẩm</span>
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="font-semibold text-slate-950 text-sm line-clamp-2">{product.name}</h3>
                                <p className="text-xs text-slate-500">Thương hiệu: <span className="font-medium text-slate-700">{product.brand?.name ?? "Đang cập nhật"}</span></p>
                                <p className="text-sm font-bold text-primary">{formatCurrency(Number(product.price))}</p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-3 gap-2"
                                disabled={isAddingToCart || !firstVariant}
                                onClick={handleAddToCart}
                            >
                                <ShoppingCart className="size-4" />
                                Thêm vào giỏ
                            </Button>
                        </div>

                        {/* Effects assets selection */}
                        <div className="rounded-lg border border-slate-200 bg-white p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-700">Danh sách phụ kiện thử đồ</span>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    onClick={() => selectedAsset && setSelectedAssetId(selectedAsset.id)}
                                    aria-label="Tải lại hiệu ứng"
                                    className="size-8"
                                >
                                    <RotateCcw className="size-4" />
                                </Button>
                            </div>

                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {assets.map((asset) => (
                                    <button
                                        key={asset.id}
                                        type="button"
                                        onClick={() => setSelectedAssetId(asset.id)}
                                        className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition ${
                                            selectedAsset?.id === asset.id
                                                ? "border-primary bg-primary/5 font-semibold text-primary"
                                                : "border-slate-200 hover:border-primary/50 text-slate-700"
                                        }`}
                                    >
                                        {asset.thumbnailUrl ? (
                                            <img src={asset.thumbnailUrl} alt={asset.displayName} className="size-10 rounded object-cover" />
                                        ) : (
                                            <div className="flex size-10 items-center justify-center rounded bg-slate-50 text-[10px] text-slate-400 border border-slate-100">
                                                AR
                                            </div>
                                        )}
                                        <span className="min-w-0">
                                            <span className="block truncate text-xs font-semibold">{asset.displayName}</span>
                                            <span className="block text-[10px] capitalize text-slate-400 font-normal">{asset.assetType}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
};

export default ProductTryonPage;
