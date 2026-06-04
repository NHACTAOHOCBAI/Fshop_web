import type { DragEvent } from "react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Loader2, Plus, Save, Shirt, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddOutfitToCart, useCreateOutfit, useDeleteOutfit, useMyOutfits, useUpdateOutfit } from "@/hooks/useOutfits";
import { useProducts } from "@/hooks/useProducts";
import { useSlotTypes } from "@/hooks/useSlotTypes";
import { authStorage } from "@/lib/auth";
import { cn, formatCurrency } from "@/lib/utils";
import type { Outfit, OutfitItemPayload, OutfitSlot } from "@/types/outfit";
import type { Product, ProductVariant } from "@/types/product";

type DraftItem = OutfitItemPayload & {
    product: Product;
    variant: ProductVariant;
};

const DEFAULT_SLOT_LAYOUT: Record<string, { x: number; y: number; scale: number; zIndex: number }> = {
    top: { x: 50, y: 18, scale: 1, zIndex: 4 },
    bottom: { x: 50, y: 48, scale: 1, zIndex: 3 },
    shoes: { x: 50, y: 76, scale: 0.92, zIndex: 2 },
    accessory: { x: 77, y: 34, scale: 0.82, zIndex: 5 },
};

const getSlotLayout = (slotCode: string) =>
    DEFAULT_SLOT_LAYOUT[slotCode] || { x: 50, y: 50, scale: 1, zIndex: 1 };

const getProductImage = (product: Product, variant?: ProductVariant) =>
    variant?.imageUrl || product.images?.[0]?.imageUrl || "";

const getDefaultVariant = (product: Product) =>
    product.variants?.find((variant) => variant.isActive) ?? product.variants?.[0] ?? null;

const toDraftItems = (outfit: Outfit): Partial<Record<OutfitSlot, DraftItem>> => {
    return outfit.items.reduce<Partial<Record<OutfitSlot, DraftItem>>>((acc, item) => {
        acc[item.slot] = {
            slot: item.slot,
            productId: item.product.id,
            variantId: item.variant.id,
            quantity: item.quantity || 1,
            layout: item.layout || getSlotLayout(item.slot),
            product: item.product,
            variant: item.variant,
        };
        return acc;
    }, {});
};

const MixMatchPage = () => {
    const navigate = useNavigate();
    const isAuthenticated = Boolean(authStorage.getAccessToken());
    const [activeSlot, setActiveSlot] = useState<OutfitSlot>("top");
    const [outfitName, setOutfitName] = useState("Outfit đi chơi cuối tuần");
    const [editingOutfitId, setEditingOutfitId] = useState<number | null>(null);
    const [draftItems, setDraftItems] = useState<Partial<Record<OutfitSlot, DraftItem>>>({});
    const [searchTerm, setSearchTerm] = useState("");
    const [draggedSlot, setDraggedSlot] = useState<OutfitSlot | null>(null);

    const productsQuery = useProducts({ page: 1, limit: 80, search: searchTerm || undefined });
    const slotTypesQuery = useSlotTypes();
    const outfitsQuery = useMyOutfits(isAuthenticated);
    const createOutfit = useCreateOutfit();
    const updateOutfit = useUpdateOutfit();
    const deleteOutfit = useDeleteOutfit();
    const addOutfitToCart = useAddOutfitToCart();

    const slotTypes = slotTypesQuery.data?.data ?? [];
    const slotMeta = useMemo(
        () =>
            slotTypes.map((st) => ({
                slot: st.code as OutfitSlot,
                label: st.name,
                hint: st.hint || "",
                slotTypeId: st.id,
            })),
        [slotTypes],
    );

    const products = productsQuery.data?.data ?? [];
    const draftList = Object.values(draftItems).filter(Boolean) as DraftItem[];
    const totalPrice = draftList.reduce((sum, item) => sum + Number(item.variant.price || item.product.price || 0), 0);

    const railProducts = useMemo(
        () =>
            products.filter((product) => {
                if (!searchTerm.trim()) return true;
                return product.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
            }),
        [products, searchTerm],
    );

    const isProductValidForSlot = (product: Product, slotCode: string): boolean => {
        const targetSlotType = slotTypes.find((st) => st.code === slotCode);
        if (!targetSlotType) return true;
        const categorySlotTypeId = product.category?.slotTypeId;
        if (!categorySlotTypeId) return true;
        return categorySlotTypeId === targetSlotType.id;
    };

    const getSlotLabelForProduct = (product: Product): string | null => {
        const categorySlotTypeId = product.category?.slotTypeId;
        if (!categorySlotTypeId) return null;
        const st = slotTypes.find((s) => s.id === categorySlotTypeId);
        return st?.name || null;
    };

    const assignProductToSlot = (product: Product, slot: OutfitSlot = activeSlot) => {
        const variant = getDefaultVariant(product);
        if (!variant) {
            toast.error("Sản phẩm này chưa có biến thể để thêm vào outfit.");
            return;
        }
        if (!isProductValidForSlot(product, slot)) {
            const correctLabel = getSlotLabelForProduct(product);
            const targetMeta = slotMeta.find((m) => m.slot === slot);
            toast.error(`Sản phẩm không phù hợp với ô "${targetMeta?.label || slot}".${correctLabel ? ` Sản phẩm này thuộc ô "${correctLabel}".` : ""}`);
            return;
        }
        setDraftItems((current) => ({
            ...current,
            [slot]: {
                slot,
                productId: product.id,
                variantId: variant.id,
                quantity: 1,
                layout: getSlotLayout(slot),
                product,
                variant,
            },
        }));
        setActiveSlot(slot);
    };

    const handleProductDrop = (slot: OutfitSlot, event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (draggedSlot) {
            const source = draftItems[draggedSlot];
            if (source && !isProductValidForSlot(source.product, slot)) {
                const targetMeta = slotMeta.find((m) => m.slot === slot);
                toast.error(`Không thể di chuyển sản phẩm vào ô "${targetMeta?.label || slot}".`);
                setDraggedSlot(null);
                return;
            }
            setDraftItems((current) => {
                const s = current[draggedSlot];
                if (!s) return current;
                const next = { ...current };
                delete next[draggedSlot];
                next[slot] = { ...s, slot, layout: getSlotLayout(slot) };
                return next;
            });
            setDraggedSlot(null);
            setActiveSlot(slot);
            return;
        }

        const productId = Number(event.dataTransfer.getData("product-id"));
        const product = products.find((item) => item.id === productId);
        if (product) assignProductToSlot(product, slot);
    };

    const clearBoard = () => {
        setDraftItems({});
        setEditingOutfitId(null);
        setOutfitName("Outfit đi chơi cuối tuần");
    };

    const loadOutfit = (outfit: Outfit) => {
        setEditingOutfitId(outfit.id);
        setOutfitName(outfit.name);
        setDraftItems(toDraftItems(outfit));
    };

    const buildPayload = () => ({
        name: outfitName.trim() || "Outfit của tôi",
        items: draftList.map(({ slot, productId, variantId, quantity, layout }) => ({
            slot,
            productId,
            variantId,
            quantity: quantity || 1,
            layout: layout || getSlotLayout(slot),
        })),
    });

    const saveOutfit = () => {
        if (!isAuthenticated) {
            toast.info("Vui lòng đăng nhập để lưu outfit.");
            navigate("/login");
            return;
        }
        if (draftList.length === 0) {
            toast.error("Hãy chọn ít nhất một sản phẩm cho outfit.");
            return;
        }

        const payload = buildPayload();
        if (editingOutfitId) {
            updateOutfit.mutate(
                { id: editingOutfitId, payload },
                { onSuccess: () => toast.success("Đã cập nhật outfit.") },
            );
            return;
        }

        createOutfit.mutate(payload, {
            onSuccess: (response) => {
                setEditingOutfitId(response.data.id);
                toast.success("Đã lưu outfit.");
            },
        });
    };

    const addCurrentOutfitToCart = () => {
        if (!editingOutfitId) {
            toast.info("Hãy lưu outfit trước khi thêm cả set vào giỏ.");
            return;
        }
        addOutfitToCart.mutate(editingOutfitId, {
            onSuccess: () => toast.success("Đã thêm outfit vào giỏ hàng."),
        });
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Mix & Match</p>
                    <h1 className="text-2xl font-bold text-slate-900">Phối outfit bằng kéo thả</h1>
                    <p className="mt-1 text-sm text-slate-500">Kéo sản phẩm vào từng vị trí, lưu lại outfit và thêm cả set vào giỏ.</p>
                </div>
                <Button type="button" variant="outline" onClick={clearBoard}>
                    <Plus className="size-4" />
                    Outfit mới
                </Button>
            </div>

            <div className="grid gap-5 xl:grid-cols-[280px_1fr_280px]">
                <aside className="space-y-3 xl:sticky xl:top-28 xl:h-fit">
                    <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm sản phẩm để phối..." />
                    <div className="max-h-[34rem] space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
                        {productsQuery.isLoading ? (
                            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                                <Loader2 className="size-4 animate-spin" />
                                Đang tải sản phẩm...
                            </div>
                        ) : railProducts.length === 0 ? (
                            <p className="py-8 text-center text-sm text-slate-500">Không có sản phẩm phù hợp.</p>
                        ) : (
                            railProducts.map((product) => {
                                const variant = getDefaultVariant(product);
                                const imageUrl = getProductImage(product, variant || undefined);
                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        draggable={Boolean(variant)}
                                        onDragStart={(event) => event.dataTransfer.setData("product-id", String(product.id))}
                                        onClick={() => assignProductToSlot(product)}
                                        className="flex w-full gap-3 rounded-lg border border-slate-100 bg-white p-2 text-left transition-colors hover:border-primary/40 hover:bg-sky-50/40"
                                    >
                                        <div className="size-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                                            {imageUrl ? <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" /> : null}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="line-clamp-2 text-sm font-semibold text-slate-800">{product.name}</p>
                                            <p className="mt-1 text-xs text-slate-500">{product.category?.name || "Sản phẩm"}</p>
                                            <p className="mt-1 text-xs font-semibold text-primary">{formatCurrency(Number(variant?.price || product.price || 0))}</p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </aside>

                <section className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                            <Input value={outfitName} onChange={(event) => setOutfitName(event.target.value)} />
                            <div className="flex gap-2">
                                <Button type="button" onClick={saveOutfit} disabled={createOutfit.isPending || updateOutfit.isPending}>
                                    <Save className="size-4" />
                                    Lưu outfit
                                </Button>
                                <Button type="button" variant="outline" onClick={addCurrentOutfitToCart} disabled={addOutfitToCart.isPending}>
                                    <ShoppingBag className="size-4" />
                                    Thêm set
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="relative min-h-[34rem] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-white to-transparent" />
                        <div className="relative grid min-h-[31rem] grid-cols-1 gap-3 sm:grid-cols-2">
                            {slotMeta.map((meta) => {
                                const item = draftItems[meta.slot];
                                const imageUrl = item ? getProductImage(item.product, item.variant) : "";
                                return (
                                    <div
                                        key={meta.slot}
                                        onClick={() => setActiveSlot(meta.slot)}
                                        onDragOver={(event) => event.preventDefault()}
                                        onDrop={(event) => handleProductDrop(meta.slot, event)}
                                        className={cn(
                                            "flex min-h-60 flex-col justify-between rounded-xl border-2 border-dashed bg-white/80 p-3 transition-colors",
                                            activeSlot === meta.slot ? "border-primary shadow-sm" : "border-slate-200",
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{meta.label}</p>
                                                <p className="text-xs text-slate-500">{meta.hint}</p>
                                            </div>
                                            {item ? (
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setDraftItems((current) => {
                                                            const next = { ...current };
                                                            delete next[meta.slot];
                                                            return next;
                                                        });
                                                    }}
                                                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            ) : null}
                                        </div>

                                        {item ? (
                                            <div
                                                draggable
                                                onDragStart={() => setDraggedSlot(meta.slot)}
                                                onDragEnd={() => setDraggedSlot(null)}
                                                className="mt-3 cursor-grab rounded-lg border border-slate-100 bg-white p-3 shadow-sm active:cursor-grabbing"
                                            >
                                                <div className="mx-auto h-36 max-w-44 overflow-hidden rounded-lg bg-slate-100">
                                                    {imageUrl ? <img src={imageUrl} alt={item.product.name} className="h-full w-full object-cover" /> : null}
                                                </div>
                                                <p className="mt-2 line-clamp-2 text-center text-sm font-semibold text-slate-800">{item.product.name}</p>
                                                <p className="text-center text-xs font-semibold text-primary">
                                                    {formatCurrency(Number(item.variant.price || item.product.price || 0))}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-slate-400">
                                                <Shirt className="size-8" />
                                                Kéo sản phẩm vào đây hoặc bấm sản phẩm bên trái
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <aside className="space-y-3 xl:sticky xl:top-28 xl:h-fit">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-bold text-slate-900">Outfit hiện tại</p>
                        <p className="mt-1 text-xs text-slate-500">{draftList.length}/4 món đã chọn</p>
                        <p className="mt-3 text-lg font-bold text-primary">{formatCurrency(totalPrice)}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-bold text-slate-900">Outfit đã lưu</p>
                        {!isAuthenticated ? (
                            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                                <p>Đăng nhập để lưu và xem lại outfit.</p>
                                <Button asChild className="mt-3 w-full" size="sm">
                                    <Link to="/login">Đăng nhập</Link>
                                </Button>
                            </div>
                        ) : outfitsQuery.isLoading ? (
                            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                                <Loader2 className="size-4 animate-spin" />
                                Đang tải...
                            </div>
                        ) : (outfitsQuery.data?.data ?? []).length === 0 ? (
                            <p className="mt-3 text-sm text-slate-500">Chưa có outfit nào.</p>
                        ) : (
                            <div className="mt-3 space-y-2">
                                {(outfitsQuery.data?.data ?? []).map((outfit) => (
                                    <div key={outfit.id} className="rounded-lg border border-slate-100 p-2">
                                        <button type="button" onClick={() => loadOutfit(outfit)} className="w-full text-left">
                                            <p className="line-clamp-1 text-sm font-semibold text-slate-800">{outfit.name}</p>
                                            <p className="text-xs text-slate-500">{outfit.items.length} món</p>
                                        </button>
                                        <div className="mt-2 flex gap-2">
                                            <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => loadOutfit(outfit)}>
                                                Mở
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => deleteOutfit.mutate(outfit.id, { onSuccess: () => toast.success("Đã xóa outfit.") })}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default MixMatchPage;
