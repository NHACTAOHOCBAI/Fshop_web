import { useMemo, useState } from "react";

import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ImageUpload } from "@/components/image-upload/image-upload";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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

interface CreateProductDialogProps {
    open: boolean;
    setOpen: (value: boolean) => void;
}

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

export function CreateProductDialog({ open, setOpen }: CreateProductDialogProps) {
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

    const brands = brandsData?.data ?? [];
    const categories = categoriesData?.data ?? [];
    const colors = colorsData?.data ?? [];
    const sizes = sizesData?.data ?? [];

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
            toast.error("Product name is required");
            return;
        }

        if (!brandId || !categoryId) {
            toast.error("Brand and category are required");
            return;
        }

        if (!variantPayload || variantPayload.length === 0) {
            toast.error("Please fill all variant fields and images");
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
                    toast.success("Product has been created");
                    resetForm();
                    setOpen(false);
                },
                onError: (error) => {
                    toast.error(`Create failed: ${error.message}`);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-h-[96vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Product</DialogTitle>
                    <DialogDescription>
                        Enter product information below to add a new product.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={isPending} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Brand</label>
                            <Select value={brandId} onValueChange={setBrandId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select brand" />
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
                            <label className="text-sm font-medium">Category</label>
                            <Select value={categoryId} onValueChange={setCategoryId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
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
                        label="Product Gallery Images"
                        disabled={isPending}
                    />

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">Variants</p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setVariants((prev) => [...prev, emptyVariant()])}
                                disabled={isPending}
                            >
                                <Plus className="size-4" />
                                Add Variant
                            </Button>
                        </div>

                        {variants.map((variant, index) => (
                            <div key={index} className="space-y-3 rounded-md border p-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium">Variant {index + 1}</p>
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
                                        <label className="text-sm font-medium">Price</label>
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
                                        <label className="text-sm font-medium">Color</label>
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
                                                <SelectValue placeholder="Select color" />
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
                                        <label className="text-sm font-medium">Size</label>
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
                                                <SelectValue placeholder="Select size" />
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
                                    label="Variant Image"
                                    disabled={isPending}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button type="button" disabled={isPending} onClick={submit} className="w-full">
                            {isPending ? "Creating..." : "Create"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={isPending}
                            onClick={() => {
                                resetForm();
                                setOpen(false);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
