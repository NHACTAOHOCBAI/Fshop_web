import { useMemo, useState } from "react";

import { Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
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
import { useCreateProduct } from "@/hooks/useProducts";
import type { CreateProductVariantPayload } from "@/types/product";

type VariantDraft = {
    sku: string;
    colorId: string;
    sizeId: string;
    price: string;
    image: File[];
};

const emptyVariant = (): VariantDraft => ({
    sku: "",
    colorId: "",
    sizeId: "",
    price: "",
    image: [],
});

export default function CreateProductPage() {
    const navigate = useNavigate();
    const { mutate: createItem, isPending } = useCreateProduct();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [brandId, setBrandId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [productImages, setProductImages] = useState<File[]>([]);
    const [variants, setVariants] = useState<VariantDraft[]>([emptyVariant()]);

    const { data: brandsData } = useBrands({ page: 1, limit: 100 });
    const { data: categoriesData } = useCategories({ page: 1, limit: 100 });
    const { data: colorsData } = useColors({ page: 1, limit: 200 });
    const { data: sizesData } = useSizes({ page: 1, limit: 200 });

    const brands = brandsData?.data.data ?? [];
    const categories = categoriesData?.data.data ?? [];
    const colors = colorsData?.data.data ?? [];
    const sizes = sizesData?.data.data ?? [];

    const variantPayload = useMemo(() => {
        const payload: CreateProductVariantPayload[] = [];

        for (const variant of variants) {
            if (!variant.colorId || !variant.sizeId || !variant.price || variant.image.length === 0) {
                return null;
            }

            payload.push({
                sku: variant.sku || undefined,
                colorId: Number(variant.colorId),
                sizeId: Number(variant.sizeId),
                price: Number(variant.price),
                image: variant.image[0],
            });
        }

        return payload;
    }, [variants]);

    const resetForm = () => {
        setName("");
        setDescription("");
        setBrandId("");
        setCategoryId("");
        setProductImages([]);
        setVariants([emptyVariant()]);
    };

    const submit = () => {
        if (!name.trim()) {
            toast.error("Tên sản phẩm là bắt buộc");
            return;
        }

        if (!brandId || !categoryId) {
            toast.error("Thương hiệu và danh mục là bắt buộc");
            return;
        }

        if (!variantPayload || variantPayload.length === 0) {
            toast.error("Vui lòng điền đầy đủ thông tin và ảnh cho biến thể");
            return;
        }

        createItem(
            {
                name,
                description: description || undefined,
                brandId: Number(brandId),
                categoryId: Number(categoryId),
                productImages,
                variants: variantPayload,
            },
            {
                onSuccess: () => {
                    toast.success("Đã tạo sản phẩm");
                    resetForm();
                    navigate("/admin/products");
                },
                onError: (error) => {
                    toast.error(`Tạo thất bại: ${error.message}`);
                },
            }
        );
    };

    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Tạo sản phẩm</h1>
                <Button type="button" variant="outline" onClick={() => navigate("/admin/products")}>Quay lại danh sách sản phẩm</Button>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
                <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
                    <div className="space-y-4 rounded-md border p-4">
                        <p className="text-sm font-semibold">Thông tin sản phẩm</p>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tên</label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mô tả</label>
                            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={isPending} />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
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

                        <ImageUpload
                            value={productImages}
                            onChange={setProductImages}
                            numOfImage={10}
                            label="Ảnh thư viện sản phẩm"
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-3 rounded-md border p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Biến thể</p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setVariants((prev) => [...prev, emptyVariant()])}
                                disabled={isPending}
                            >
                                <Plus className="size-4" />
                                Thêm biến thể
                            </Button>
                        </div>

                        {variants.map((variant, index) => (
                            <div key={index} className="space-y-3 rounded-md border p-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">Biến thể {index + 1}</p>
                                    {variants.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() =>
                                                setVariants((prev) => prev.filter((_, idx) => idx !== index))
                                            }
                                            disabled={isPending}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">SKU</label>
                                        <Input
                                            value={variant.sku}
                                            onChange={(e) =>
                                                setVariants((prev) => {
                                                    const next = [...prev];
                                                    next[index].sku = e.target.value;
                                                    return next;
                                                })
                                            }
                                            disabled={isPending}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Giá</label>
                                        <Input
                                            type="number"
                                            value={variant.price}
                                            onChange={(e) =>
                                                setVariants((prev) => {
                                                    const next = [...prev];
                                                    next[index].price = e.target.value;
                                                    return next;
                                                })
                                            }
                                            disabled={isPending}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Màu sắc</label>
                                        <Select
                                            value={variant.colorId}
                                            onValueChange={(value) =>
                                                setVariants((prev) => {
                                                    const next = [...prev];
                                                    next[index].colorId = value;
                                                    return next;
                                                })
                                            }
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
                                            onValueChange={(value) =>
                                                setVariants((prev) => {
                                                    const next = [...prev];
                                                    next[index].sizeId = value;
                                                    return next;
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn kích thước" />
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
                                </div>

                                <ImageUpload
                                    value={variant.image}
                                    onChange={(files) =>
                                        setVariants((prev) => {
                                            const next = [...prev];
                                            next[index].image = files;
                                            return next;
                                        })
                                    }
                                    numOfImage={1}
                                    label="Ảnh biến thể"
                                    disabled={isPending}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Button type="button" disabled={isPending} onClick={submit} className="w-full">
                        {isPending ? "Đang tạo..." : "Tạo"}
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
