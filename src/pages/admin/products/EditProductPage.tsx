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
import { useProductById, useUpdateProductFull } from "@/hooks/useProducts";

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
    const { mutate: updateProductFull, isPending } = useUpdateProductFull();

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