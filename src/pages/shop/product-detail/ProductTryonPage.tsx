import { ArrowLeft, Camera, Loader2, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { useProductById, useProductTryonAssets } from "@/hooks/useProducts";
import type { ProductTryonAsset } from "@/types/product";

type DeepARInstance = {
    shutdown?: () => void | Promise<void>;
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
                setRuntimeError("Missing VITE_DEEPAR_LICENSE_KEY in web environment.");
                return;
            }

            if (!navigator.mediaDevices?.getUserMedia) {
                setRuntimeError("This browser does not support camera access.");
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

                const instance = await deepar.initialize({
                    licenseKey,
                    canvas: canvasRef.current,
                    effect: selectedAsset.deeparEffectUrl,
                });

                if (cancelled) {
                    await instance.shutdown?.();
                    return;
                }

                deepARRef.current = instance;
            } catch (error) {
                const message = error instanceof Error ? error.message : "DeepAR could not start.";
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

    const isLoading = productQuery.isLoading || assetsQuery.isLoading;
    const hasAssets = assets.length > 0;

    if (isLoading) {
        return (
            <div className="flex min-h-[65vh] items-center justify-center text-sm text-slate-500">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading AR experience...
            </div>
        );
    }

    if (productQuery.isError || !product) {
        return (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <p>Could not load product for AR try-on.</p>
                <Button asChild variant="outline">
                    <Link to={`/${department}`}>Back to catalog</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-120px)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button asChild variant="outline">
                    <Link to={`/${department}/products/${product.id}`}>
                        <ArrowLeft className="size-4" />
                        Product detail
                    </Link>
                </Button>
                <div className="text-right">
                    <p className="text-sm text-slate-500">AR Try-On</p>
                    <h1 className="text-xl font-semibold text-slate-900">{product.name}</h1>
                </div>
            </div>

            {!hasAssets ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                    This product does not have an active AR try-on asset yet.
                </div>
            ) : (
                <div className="grid min-h-[640px] gap-4 lg:grid-cols-[1fr_280px]">
                    <section className="relative overflow-hidden rounded-lg bg-black">
                        <canvas ref={canvasRef} className="h-full min-h-[640px] w-full" />

                        {(isInitializing || runtimeError) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-6 text-center text-white">
                                {isInitializing ? (
                                    <div className="space-y-3">
                                        <Loader2 className="mx-auto size-7 animate-spin" />
                                        <p className="text-sm">Starting camera and DeepAR...</p>
                                    </div>
                                ) : (
                                    <div className="max-w-md space-y-3">
                                        <Camera className="mx-auto size-7" />
                                        <p className="text-sm">{runtimeError}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    <aside className="space-y-3">
                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-900">Assets</p>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    onClick={() => selectedAsset && setSelectedAssetId(selectedAsset.id)}
                                    aria-label="Reload current asset"
                                >
                                    <RotateCcw className="size-4" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {assets.map((asset) => (
                                    <button
                                        key={asset.id}
                                        type="button"
                                        onClick={() => setSelectedAssetId(asset.id)}
                                        className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition ${
                                            selectedAsset?.id === asset.id
                                                ? "border-primary bg-primary/5"
                                                : "border-slate-200 hover:border-primary/50"
                                        }`}
                                    >
                                        {asset.thumbnailUrl ? (
                                            <img src={asset.thumbnailUrl} alt={asset.displayName} className="size-12 rounded object-cover" />
                                        ) : (
                                            <div className="flex size-12 items-center justify-center rounded bg-slate-100 text-xs text-slate-500">
                                                AR
                                            </div>
                                        )}
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-medium text-slate-900">{asset.displayName}</span>
                                            <span className="block text-xs capitalize text-slate-500">{asset.assetType}</span>
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
