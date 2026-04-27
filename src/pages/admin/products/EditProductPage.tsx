import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { ImageUpload } from "@/components/image-upload/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useColors, useSizes } from "@/hooks/useAttributes";
import { useBrands } from "@/hooks/useBrands";
import { useCategories } from "@/hooks/useCategories";
import {
    useCreateProductTryonAsset,
    useDeleteProductTryonAsset,
    useProductById,
    useProductTryonAssets,
    useUpdateProductFull,
    useUpdateProductTryonAsset,
} from "@/hooks/useProducts";
import type { ProductTryonAssetType } from "@/types/product";

type ExistingImageState = {
    id: number;
    imageUrl?: string;
    removed: boolean;
};

type VariantEditorState = {
    key: string;
    id?: number;
    sku: string;
    colorId: string;
    sizeId: string;
    imageUrl?: string;
    removed: boolean;
    imageMode: "keep" | "remove" | "replace";
    imageFile: File[];
    isNew: boolean;
};

type TryonAssetEditorState = {
    id: number;
    assetType: ProductTryonAssetType;
    displayName: string;
    deeparEffectUrl: string;
    thumbnailUrl: string;
    variantId: string;
    isActive: "true" | "false";
};

type TryonAssetDraftState = Omit<TryonAssetEditorState, "id">;

const tryonAssetTypes: Array<{ value: ProductTryonAssetType; label: string }> = [
    { value: "glasses", label: "Glasses" },
    { value: "hat", label: "Hat" },
    { value: "accessory", label: "Accessory" },
];

const createEmptyTryonDraft = (): TryonAssetDraftState => ({
    assetType: "glasses",
    displayName: "",
    deeparEffectUrl: "",
    thumbnailUrl: "",
    variantId: "",
    isActive: "true",
});

const createEmptyVariant = (): VariantEditorState => ({
    key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sku: "",
    colorId: "",
    sizeId: "",
    removed: false,
    imageMode: "replace",
    imageFile: [],
    isNew: true,
});

export default function EditProductPage() {
    const navigate = useNavigate();
    const { productId } = useParams();
    const id = Number(productId);

    const { data: productDetail, isLoading, isError } = useProductById(id, Number.isFinite(id) && id > 0);
    const tryonAssetsQuery = useProductTryonAssets(id, Number.isFinite(id) && id > 0);
    const { mutate: updateProductFull, isPending } = useUpdateProductFull();
    const { mutate: createTryonAsset, isPending: isCreatingTryonAsset } = useCreateProductTryonAsset();
    const { mutate: updateTryonAsset, isPending: isUpdatingTryonAsset } = useUpdateProductTryonAsset();
    const { mutate: deleteTryonAsset, isPending: isDeletingTryonAsset } = useDeleteProductTryonAsset();

    const { data: brandsData } = useBrands({ page: 1, limit: 100 });
    const { data: categoriesData } = useCategories({ page: 1, limit: 100 });
    const { data: colorsData } = useColors({ page: 1, limit: 300 });
    const { data: sizesData } = useSizes({ page: 1, limit: 300 });

    const brands = brandsData?.data ?? [];
    const categories = categoriesData?.data ?? [];
    const colors = colorsData?.data ?? [];
    const sizes = sizesData?.data ?? [];
    const product = productDetail?.data;

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [brandId, setBrandId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [price, setPrice] = useState("");
    const [isActive, setIsActive] = useState<"true" | "false">("true");
    const [existingImages, setExistingImages] = useState<ExistingImageState[]>([]);
    const [newGalleryImages, setNewGalleryImages] = useState<File[]>([]);
    const [variants, setVariants] = useState<VariantEditorState[]>([]);
    const [tryonDraft, setTryonDraft] = useState<TryonAssetDraftState>(createEmptyTryonDraft);
    const [tryonEditors, setTryonEditors] = useState<TryonAssetEditorState[]>([]);

    useEffect(() => {
        if (!product) {
            return;
        }

        setName(product.name ?? "");
        setDescription(product.description ?? "");
        setBrandId(String(product.brandId ?? ""));
        setCategoryId(String(product.categoryId ?? ""));
        setPrice(String(Number(product.price ?? 0)));
        setIsActive(product.isActive ? "true" : "false");
        setExistingImages(
            (product.images ?? []).map((image) => ({
                id: image.id,
                imageUrl: image.imageUrl,
                removed: false,
            }))
        );
        setNewGalleryImages([]);
        setVariants(
            (product.variants ?? []).map((variant) => ({
                key: `variant-${variant.id}`,
                id: variant.id,
                sku: variant.sku ?? "",
                colorId: String(variant.colorId ?? ""),
                sizeId: String(variant.sizeId ?? ""),
                imageUrl: variant.imageUrl,
                removed: false,
                imageMode: "keep",
                imageFile: [],
                isNew: false,
            }))
        );
    }, [product]);

    useEffect(() => {
        const assets = tryonAssetsQuery.data?.data ?? [];
        setTryonEditors(
            assets.map((asset) => ({
                id: asset.id,
                assetType: asset.assetType,
                displayName: asset.displayName,
                deeparEffectUrl: asset.deeparEffectUrl,
                thumbnailUrl: asset.thumbnailUrl ?? "",
                variantId: asset.variantId ? String(asset.variantId) : "",
                isActive: asset.isActive ? "true" : "false",
            }))
        );
    }, [tryonAssetsQuery.data?.data]);

    const updateTryonEditor = (assetId: number, updater: (asset: TryonAssetEditorState) => TryonAssetEditorState) => {
        setTryonEditors((prev) => prev.map((item) => (item.id === assetId ? updater(item) : item)));
    };

    const activeVariantOptions = variants.filter((variant) => !variant.removed && variant.id);
    const isTryonPending = isCreatingTryonAsset || isUpdatingTryonAsset || isDeletingTryonAsset;

    const validateTryonAsset = (asset: TryonAssetDraftState | TryonAssetEditorState) => {
        if (!asset.displayName.trim()) {
            toast.error("AR asset needs a display name");
            return false;
        }

        if (!asset.deeparEffectUrl.trim()) {
            toast.error("DeepAR effect URL is required");
            return false;
        }

        try {
            new URL(asset.deeparEffectUrl.trim());
            if (asset.thumbnailUrl.trim()) {
                new URL(asset.thumbnailUrl.trim());
            }
        } catch {
            toast.error("AR asset URLs must be valid URLs");
            return false;
        }

        return true;
    };

    const submitTryonDraft = () => {
        if (!validateTryonAsset(tryonDraft)) {
            return;
        }

        createTryonAsset(
            {
                productId: id,
                assetType: tryonDraft.assetType,
                displayName: tryonDraft.displayName.trim(),
                deeparEffectUrl: tryonDraft.deeparEffectUrl.trim(),
                thumbnailUrl: tryonDraft.thumbnailUrl.trim() || null,
                variantId: tryonDraft.variantId ? Number(tryonDraft.variantId) : null,
                isActive: tryonDraft.isActive === "true",
            },
            {
                onSuccess: () => {
                    toast.success("AR asset created");
                    setTryonDraft(createEmptyTryonDraft());
                },
                onError: (error) => {
                    toast.error(error.message || "Could not create AR asset");
                },
            }
        );
    };

    const submitTryonEditor = (asset: TryonAssetEditorState) => {
        if (!validateTryonAsset(asset)) {
            return;
        }

        updateTryonAsset(
            {
                productId: id,
                assetId: asset.id,
                assetType: asset.assetType,
                displayName: asset.displayName.trim(),
                deeparEffectUrl: asset.deeparEffectUrl.trim(),
                thumbnailUrl: asset.thumbnailUrl.trim() || null,
                variantId: asset.variantId ? Number(asset.variantId) : null,
                isActive: asset.isActive === "true",
            },
            {
                onSuccess: () => toast.success("AR asset updated"),
                onError: (error) => toast.error(error.message || "Could not update AR asset"),
            }
        );
    };

    const removeTryonAsset = (assetId: number) => {
        deleteTryonAsset(
            { productId: id, assetId },
            {
                onSuccess: () => toast.success("AR asset disabled"),
                onError: (error) => toast.error(error.message || "Could not disable AR asset"),
            }
        );
    };

    const updateVariant = (key: string, updater: (variant: VariantEditorState) => VariantEditorState) => {
        setVariants((prev) => prev.map((item) => (item.key === key ? updater(item) : item)));
    };

    const addVariant = () => {
        setVariants((prev) => [...prev, createEmptyVariant()]);
    };

    const removeVariant = (key: string) => {
        setVariants((prev) =>
            prev
                .map((item) => {
                    if (item.key !== key) {
                        return item;
                    }
                    if (item.isNew) {
                        return { ...item, removed: true };
                    }
                    return { ...item, removed: !item.removed };
                })
                .filter((item) => !(item.isNew && item.removed))
        );
    };

    const submit = () => {
        if (!id || !Number.isFinite(id)) {
            toast.error("ID sản phẩm không hợp lệ");
            return;
        }

        if (!name.trim()) {
            toast.error("Tên sản phẩm là bắt buộc");
            return;
        }

        if (!brandId || !categoryId) {
            toast.error("Thương hiệu và danh mục là bắt buộc");
            return;
        }

        const numericPrice = Number(price);
        if (Number.isNaN(numericPrice) || numericPrice < 0) {
            toast.error("Giá phải là số lớn hơn hoặc bằng 0");
            return;
        }

        const activeVariants = variants.filter((item) => !item.removed);
        if (activeVariants.length === 0) {
            toast.error("Sản phẩm cần ít nhất 1 biến thể hoạt động");
            return;
        }

        const signatures = new Set<string>();
        for (const item of activeVariants) {
            if (!item.colorId || !item.sizeId) {
                toast.error("Biến thể cần chọn đầy đủ màu và size");
                return;
            }
            const signature = `${item.colorId}-${item.sizeId}`;
            if (signatures.has(signature)) {
                toast.error("Có biến thể bị trùng tổ hợp màu và size");
                return;
            }
            signatures.add(signature);
        }

        const keepImageIds = existingImages.filter((item) => !item.removed).map((item) => item.id);
        const removeVariantIds = variants.filter((item) => item.id && item.removed).map((item) => item.id as number);

        const variantImages: File[] = [];
        const variantPayload = activeVariants.map((item) => {
            const payload: {
                id?: number;
                sku?: string;
                colorId: number;
                sizeId: number;
                imageFileIndex?: number;
                removeImage?: boolean;
            } = {
                colorId: Number(item.colorId),
                sizeId: Number(item.sizeId),
            };

            if (item.id) {
                payload.id = item.id;
            }

            if (item.sku.trim()) {
                payload.sku = item.sku.trim();
            }

            if (item.imageMode === "replace") {
                if (item.imageFile.length > 0) {
                    payload.imageFileIndex = variantImages.length;
                    variantImages.push(item.imageFile[0]);
                } else if (item.id) {
                    toast.error("Bạn đã chọn thay ảnh cho biến thể nhưng chưa upload ảnh mới");
                    throw new Error("Missing variant replacement image");
                }
            }

            if (item.id && item.imageMode === "remove") {
                payload.removeImage = true;
            }

            return payload;
        });

        if (activeVariants.some((item) => item.isNew && item.imageFile.length === 0)) {
            toast.error("Biến thể mới cần có ảnh");
            return;
        }

        try {
            updateProductFull(
                {
                    id,
                    payload: {
                        name: name.trim(),
                        description,
                        brandId: Number(brandId),
                        categoryId: Number(categoryId),
                        price: numericPrice,
                        isActive: isActive === "true",
                        keepImageIds,
                        removeVariantIds,
                        variants: variantPayload,
                    },
                    productImages: newGalleryImages,
                    variantImages,
                },
                {
                    onSuccess: () => {
                        toast.success("Cập nhật sản phẩm thành công");
                        navigate("/admin/products");
                    },
                    onError: (error) => {
                        toast.error(error.message || "Cập nhật thất bại");
                    },
                },
            );
        } catch {
            return;
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Đang tải dữ liệu sản phẩm...
            </div>
        );
    }

    if (isError || !product) {
        return (
            <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                <p>Không thể tải sản phẩm để chỉnh sửa.</p>
                <Button type="button" variant="outline" onClick={() => navigate("/admin/products")}>Quay lại danh sách</Button>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold">Chỉnh sửa sản phẩm #{product.id}</h1>
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => navigate("/admin/products")}>
                    Quay lại danh sách sản phẩm
                </Button>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
                <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
                    <div className="space-y-4 rounded-md border p-4">
                        <p className="text-sm font-semibold">Thông tin cơ bản</p>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tên</label>
                            <Input value={name} onChange={(event) => setName(event.target.value)} disabled={isPending} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mô tả</label>
                            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} disabled={isPending} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Thương hiệu</label>
                                <Select value={brandId} onValueChange={setBrandId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn thương hiệu" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {brands.map((item) => (
                                            <SelectItem key={item.id} value={`${item.id}`}>
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Danh mục</label>
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn danh mục" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((item) => (
                                            <SelectItem key={item.id} value={`${item.id}`}>
                                                {item.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Giá cơ bản</label>
                                <Input type="number" value={price} onChange={(event) => setPrice(event.target.value)} disabled={isPending} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Trạng thái</label>
                                <Select value={isActive} onValueChange={(value) => setIsActive(value as "true" | "false")}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn trạng thái" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Đang hoạt động</SelectItem>
                                        <SelectItem value="false">Tạm ẩn</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Ảnh thư viện hiện có</p>
                            {existingImages.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {existingImages.map((image) => (
                                        <div key={image.id} className={`rounded-md border p-2 ${image.removed ? "opacity-50" : ""}`}>
                                            {image.imageUrl ? (
                                                <img src={image.imageUrl} alt={`gallery-${image.id}`} className="h-24 w-full rounded object-cover" />
                                            ) : (
                                                <div className="flex h-24 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">No image</div>
                                            )}
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={image.removed ? "outline" : "destructive"}
                                                className="mt-2 w-full"
                                                onClick={() =>
                                                    setExistingImages((prev) =>
                                                        prev.map((item) => (item.id === image.id ? { ...item, removed: !item.removed } : item))
                                                    )
                                                }
                                            >
                                                {image.removed ? "Giữ lại" : "Xóa ảnh"}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">Sản phẩm chưa có ảnh thư viện.</p>
                            )}
                        </div>

                        <ImageUpload
                            value={newGalleryImages}
                            onChange={setNewGalleryImages}
                            numOfImage={10}
                            label="Thêm ảnh thư viện mới"
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-3 rounded-md border p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Biến thể</p>
                            <Button type="button" size="sm" variant="outline" onClick={addVariant}>
                                Thêm biến thể
                            </Button>
                        </div>

                        {variants.length > 0 ? variants.map((variant, index) => (
                            <div key={variant.key} className={`space-y-3 rounded-md border p-3 ${variant.removed ? "opacity-60" : ""}`}>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">Biến thể {index + 1} {variant.id ? `(#${variant.id})` : "(Mới)"}</p>
                                    <Button type="button" size="sm" variant={variant.removed ? "outline" : "destructive"} onClick={() => removeVariant(variant.key)}>
                                        {variant.removed ? "Khôi phục" : "Xóa biến thể"}
                                    </Button>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">SKU</label>
                                        <Input
                                            value={variant.sku}
                                            onChange={(event) => updateVariant(variant.key, (item) => ({ ...item, sku: event.target.value }))}
                                            disabled={isPending || variant.removed}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Màu sắc</label>
                                        <Select
                                            value={variant.colorId}
                                            onValueChange={(value) => updateVariant(variant.key, (item) => ({ ...item, colorId: value }))}
                                            disabled={isPending || variant.removed}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn màu" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {colors.map((item) => (
                                                    <SelectItem key={item.id} value={`${item.id}`}>
                                                        {item.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Kích thước</label>
                                        <Select
                                            value={variant.sizeId}
                                            onValueChange={(value) => updateVariant(variant.key, (item) => ({ ...item, sizeId: value }))}
                                            disabled={isPending || variant.removed}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn size" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sizes.map((item) => (
                                                    <SelectItem key={item.id} value={`${item.id}`}>
                                                        {item.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Ảnh biến thể</label>
                                        <Select
                                            value={variant.imageMode}
                                            onValueChange={(value) => updateVariant(variant.key, (item) => ({ ...item, imageMode: value as VariantEditorState["imageMode"] }))}
                                            disabled={isPending || variant.removed}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Tùy chọn ảnh" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="keep">Giữ ảnh hiện tại</SelectItem>
                                                <SelectItem value="replace">Thay ảnh mới</SelectItem>
                                                <SelectItem value="remove">Xóa ảnh</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {variant.imageUrl && variant.imageMode === "keep" ? (
                                    <div className="rounded border p-2">
                                        <p className="mb-1 text-xs text-slate-500">Ảnh hiện tại</p>
                                        <img src={variant.imageUrl} alt={`variant-${variant.id ?? variant.key}`} className="h-24 w-24 rounded object-cover" />
                                    </div>
                                ) : null}

                                {variant.imageMode === "replace" ? (
                                    <ImageUpload
                                        value={variant.imageFile}
                                        onChange={(files) => updateVariant(variant.key, (item) => ({ ...item, imageFile: files }))}
                                        numOfImage={1}
                                        label="Ảnh mới cho biến thể"
                                        disabled={isPending || variant.removed}
                                    />
                                ) : null}

                            </div>
                        )) : (
                            <p className="text-sm text-slate-500">Sản phẩm hiện chưa có biến thể.</p>
                        )}

                        <p className="text-xs text-slate-500">Bạn có thể thêm, sửa, xóa mềm biến thể và thay đổi ảnh của từng biến thể ngay tại đây.</p>
                    </div>
                </div>

                <div className="space-y-4 rounded-md border p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold">AR Try-On assets</p>
                            <p className="text-xs text-slate-500">DeepAR effect URLs for glasses, hats, and accessories.</p>
                        </div>
                    </div>

                    <div className="grid gap-3 rounded-md border bg-slate-50/60 p-3 lg:grid-cols-[160px_1fr_1fr_1fr_140px_auto]">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-600">Type</label>
                            <Select
                                value={tryonDraft.assetType}
                                onValueChange={(value) => setTryonDraft((prev) => ({ ...prev, assetType: value as ProductTryonAssetType }))}
                                disabled={isTryonPending}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tryonAssetTypes.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-600">Display name</label>
                            <Input
                                value={tryonDraft.displayName}
                                onChange={(event) => setTryonDraft((prev) => ({ ...prev, displayName: event.target.value }))}
                                disabled={isTryonPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-600">DeepAR effect URL</label>
                            <Input
                                value={tryonDraft.deeparEffectUrl}
                                onChange={(event) => setTryonDraft((prev) => ({ ...prev, deeparEffectUrl: event.target.value }))}
                                disabled={isTryonPending}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-600">Thumbnail URL</label>
                            <Input
                                value={tryonDraft.thumbnailUrl}
                                onChange={(event) => setTryonDraft((prev) => ({ ...prev, thumbnailUrl: event.target.value }))}
                                disabled={isTryonPending}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-600">Variant</label>
                            <Select
                                value={tryonDraft.variantId || "none"}
                                onValueChange={(value) => setTryonDraft((prev) => ({ ...prev, variantId: value === "none" ? "" : value }))}
                                disabled={isTryonPending}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Variant" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Product</SelectItem>
                                    {activeVariantOptions.map((variant) => (
                                        <SelectItem key={variant.id} value={String(variant.id)}>
                                            #{variant.id} {variant.sku || ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <Button type="button" className="w-full" disabled={isTryonPending} onClick={submitTryonDraft}>
                                Add
                            </Button>
                        </div>
                    </div>

                    {tryonAssetsQuery.isLoading ? (
                        <div className="flex items-center text-sm text-slate-500">
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Loading AR assets...
                        </div>
                    ) : tryonEditors.length === 0 ? (
                        <p className="rounded-md border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                            No AR try-on assets yet.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {tryonEditors.map((asset) => (
                                <div key={asset.id} className="grid gap-3 rounded-md border p-3 lg:grid-cols-[160px_1fr_1fr_1fr_140px_120px]">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-600">Type</label>
                                        <Select
                                            value={asset.assetType}
                                            onValueChange={(value) => updateTryonEditor(asset.id, (item) => ({ ...item, assetType: value as ProductTryonAssetType }))}
                                            disabled={isTryonPending}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tryonAssetTypes.map((item) => (
                                                    <SelectItem key={item.value} value={item.value}>
                                                        {item.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-600">Display name</label>
                                        <Input
                                            value={asset.displayName}
                                            onChange={(event) => updateTryonEditor(asset.id, (item) => ({ ...item, displayName: event.target.value }))}
                                            disabled={isTryonPending}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-600">DeepAR effect URL</label>
                                        <Input
                                            value={asset.deeparEffectUrl}
                                            onChange={(event) => updateTryonEditor(asset.id, (item) => ({ ...item, deeparEffectUrl: event.target.value }))}
                                            disabled={isTryonPending}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-slate-600">Thumbnail URL</label>
                                        <Input
                                            value={asset.thumbnailUrl}
                                            onChange={(event) => updateTryonEditor(asset.id, (item) => ({ ...item, thumbnailUrl: event.target.value }))}
                                            disabled={isTryonPending}
                                        />
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-slate-600">Variant</label>
                                            <Select
                                                value={asset.variantId || "none"}
                                                onValueChange={(value) => updateTryonEditor(asset.id, (item) => ({ ...item, variantId: value === "none" ? "" : value }))}
                                                disabled={isTryonPending}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Variant" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Product</SelectItem>
                                                    {activeVariantOptions.map((variant) => (
                                                        <SelectItem key={variant.id} value={String(variant.id)}>
                                                            #{variant.id} {variant.sku || ""}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-slate-600">Status</label>
                                            <Select
                                                value={asset.isActive}
                                                onValueChange={(value) => updateTryonEditor(asset.id, (item) => ({ ...item, isActive: value as "true" | "false" }))}
                                                disabled={isTryonPending}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="true">Active</SelectItem>
                                                    <SelectItem value="false">Hidden</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-end gap-2">
                                        <Button type="button" disabled={isTryonPending} onClick={() => submitTryonEditor(asset)}>
                                            Save
                                        </Button>
                                        <Button type="button" variant="destructive" disabled={isTryonPending} onClick={() => removeTryonAsset(asset.id)}>
                                            Disable
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Button type="button" disabled={isPending} onClick={submit} className="w-full">
                        {isPending ? "Đang cập nhật..." : "Lưu thay đổi"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={isPending}
                        onClick={() => navigate("/admin/products")}
                    >
                        Hủy
                    </Button>
                </div>
            </div>
        </div>
    );
}
