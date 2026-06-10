import { useMemo, useState } from "react";

import { AlertCircle, AlertTriangle, Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

import CrudTable from "@/components/crud_table/crud-table";
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
import {
    useCreateInventory,
    useCreateInventoryTransaction,
    useDeleteInventory,
    useInventories,
    useInventoryTransactionHistory,
    useLowStockInventories,
    useUpdateInventory,
} from "@/hooks/useInventories";
import { useProducts } from "@/hooks/useProducts";
import { getSystemSettings } from "@/services/settings";
import type { Inventory, InventoryType } from "@/types/inventory";

import { inventoryColumns } from "./inventory-columns";

export default function StocksPage() {
    const [openCreate, setOpenCreate] = useState(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [openTxn, setOpenTxn] = useState(false);
    const [openHistory, setOpenHistory] = useState(false);

    const [selectedInventory, setSelectedInventory] = useState<Inventory>();

    const { mutate: deleteItem } = useDeleteInventory();

    const { data: settingsData } = useQuery({
        queryKey: ["system-settings"],
        queryFn: getSystemSettings,
    });

    const stockThreshold = useMemo(() => {
        const setting = settingsData?.data?.find((s) => s.key === "STOCK_LOW_THRESHOLD");
        return setting ? parseInt(setting.value, 10) : 10;
    }, [settingsData]);

    const { data: lowStockData } = useLowStockInventories(stockThreshold);
    const { data: allInventoriesData } = useInventories({ page: 1, limit: 1 });
    const totalSKUs = allInventoriesData?.pagination?.total ?? 0;

    const handleDeleteItem = (id: number) => {
        deleteItem(
            { id },
            {
                onSuccess: () => toast.success("Đã xóa tồn kho"),
                onError: (error) => toast.error(`Xóa thất bại: ${error.message}`),
            }
        );
    };

    return (
        <div className="space-y-6 w-full">
            <div>
                <h1 className="text-2xl font-semibold">Kho hàng</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Theo dõi số lượng hàng hóa trong kho, cảnh báo các mặt hàng sắp hết và quản lý các giao dịch nhập xuất kho.
                </p>
            </div>

            {/* KPI Metrics Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                {/* Total SKUs */}
                <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
                    <div className="mb-5 flex items-start justify-between">
                        <span className="text-sm font-medium text-slate-500">Tổng mặt hàng (SKU)</span>
                        <div className="rounded-xl bg-slate-900 p-2 text-white transition-colors group-hover:bg-sky-500">
                            <Package className="size-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{totalSKUs}</p>
                </article>

                {/* Low Stock Warning */}
                <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
                    <div className="mb-5 flex items-start justify-between">
                        <span className="text-sm font-medium text-slate-500">Sắp hết hàng (&le;{stockThreshold})</span>
                        <div className="rounded-xl bg-slate-900 p-2 text-white transition-colors group-hover:bg-sky-500">
                            <AlertTriangle className="size-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{lowStockData?.length ?? 0}</p>
                </article>

                {/* Out of Stock Warning */}
                <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
                    <div className="mb-5 flex items-start justify-between">
                        <span className="text-sm font-medium text-slate-500">Đã hết hàng (0)</span>
                        <div className="rounded-xl bg-slate-900 p-2 text-white transition-colors group-hover:bg-sky-500">
                            <AlertCircle className="size-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                        {lowStockData?.filter((item) => item.quantity === 0).length ?? 0}
                    </p>
                </article>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {/* Main Table */}
                <div className="lg:col-span-2 xl:col-span-3 space-y-4">
                    <CrudTable<Inventory>
                        columns={inventoryColumns(
                            (item) => {
                                setSelectedInventory(item);
                                setOpenUpdate(true);
                            },
                            (item) => {
                                setSelectedInventory(item);
                                setOpenTxn(true);
                            },
                            (item) => {
                                setSelectedInventory(item);
                                setOpenHistory(true);
                            },
                            handleDeleteItem
                        )}
                        useQuery={useInventories}
                        filterPlaceholder="Lọc theo mã biến thể..."
                    >
                        <Button variant="outline" size="sm" className="ml-2 h-8" onClick={() => setOpenCreate(true)}>
                            <Plus className="size-4" />
                            Thêm tồn kho
                        </Button>
                    </CrudTable>
                </div>

                {/* Sidebar Alerts */}
                <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200/80 bg-white">
                        <div className="flex flex-col space-y-1.5 p-5 border-b pb-4">
                            <h3 className="font-semibold text-base leading-none text-slate-900">Cảnh báo nhập kho</h3>
                            <p className="text-xs text-muted-foreground">Sản phẩm sắp hết hoặc đã hết hàng</p>
                        </div>
                        <div className="p-5 pt-4 space-y-4 max-h-[500px] overflow-y-auto">
                            {!lowStockData || lowStockData.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4">Tất cả sản phẩm đều đủ hàng</p>
                            ) : (
                                lowStockData.slice(0, 5).map((item) => {
                                    const productName = item.variant?.product?.name ?? `Biến thể #${item.variantId}`;
                                    const sku = item.variant?.sku ?? `ID: ${item.variantId}`;
                                    const isOutOfStock = item.quantity === 0;

                                    return (
                                        <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                            <div className="space-y-1 max-w-[65%]">
                                                <p className="text-xs font-semibold truncate text-slate-700" title={productName}>
                                                    {productName}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground font-mono">
                                                    SKU: {sku}
                                                </p>
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${isOutOfStock ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                                                    }`}>
                                                    Tồn: {item.quantity}
                                                </span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-[11px] px-2 text-slate-700 hover:text-slate-900"
                                                onClick={() => {
                                                    setSelectedInventory(item);
                                                    setOpenTxn(true);
                                                }}
                                            >
                                                Nhập nhanh
                                            </Button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <CreateInventoryDialog open={openCreate} setOpen={setOpenCreate} />
            <UpdateInventoryDialog
                open={openUpdate}
                setOpen={setOpenUpdate}
                item={selectedInventory}
                setItem={setSelectedInventory}
            />
            <CreateInventoryTransactionDialog
                open={openTxn}
                setOpen={setOpenTxn}
                item={selectedInventory}
                setItem={setSelectedInventory}
            />
            <InventoryHistoryDialog
                open={openHistory}
                setOpen={setOpenHistory}
                item={selectedInventory}
                setItem={setSelectedInventory}
            />
        </div>
    );
}

function CreateInventoryDialog({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
    const { mutate, isPending } = useCreateInventory();
    const { data: productsData } = useProducts({ page: 1, limit: 100 });

    const [variantId, setVariantId] = useState("");
    const [quantity, setQuantity] = useState("0");

    const variantOptions = useMemo(() => {
        const products = productsData?.data ?? [];
        return products.flatMap((product) =>
            (product.variants ?? []).map((variant) => ({
                id: variant.id,
                label: `${product.name} - ${variant.sku || `Biến thể #${variant.id}`}`,
            }))
        );
    }, [productsData?.data]);

    const submit = () => {
        if (!variantId) {
            toast.error("Biến thể là bắt buộc");
            return;
        }

        mutate(
            { variantId: Number(variantId), quantity: Number(quantity) || 0 },
            {
                onSuccess: () => {
                    toast.success("Đã tạo tồn kho");
                    setVariantId("");
                    setQuantity("0");
                    setOpen(false);
                },
                onError: (error) => toast.error(error.message),
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Tạo tồn kho</DialogTitle>
                    <DialogDescription>Khởi tạo tồn kho cho một biến thể sản phẩm</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 min-w-0 w-full">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Biến thể</label>
                        <Select value={variantId} onValueChange={setVariantId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Chọn biến thể" />
                            </SelectTrigger>
                            <SelectContent>
                                {variantOptions.map((item) => (
                                    <SelectItem key={item.id} value={`${item.id}`}>
                                        {item.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Số lượng</label>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button onClick={submit} disabled={isPending || !variantId}>
                            {isPending ? "Đang tạo..." : "Tạo"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Hủy
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function UpdateInventoryDialog({
    open,
    setOpen,
    item,
    setItem,
}: {
    open: boolean;
    setOpen: (v: boolean) => void;
    item: Inventory | undefined;
    setItem: (item: Inventory | undefined) => void;
}) {
    const { mutate, isPending } = useUpdateInventory();
    const [quantity, setQuantity] = useState("0");

    useMemo(() => {
        if (item) {
            setQuantity(`${item.quantity}`);
        }
    }, [item]);

    const submit = () => {
        if (!item) return;

        mutate(
            { id: item.id, data: { quantity: Number(quantity) || 0 } },
            {
                onSuccess: () => {
                    toast.success("Đã cập nhật tồn kho");
                    setOpen(false);
                    setItem(undefined);
                },
                onError: (error) => toast.error(error.message),
            }
        );
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (!v) setItem(undefined);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cập nhật tồn kho</DialogTitle>
                    <DialogDescription>Cập nhật số lượng cho tồn kho đã chọn</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Số lượng</label>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button onClick={submit} disabled={isPending}>
                            {isPending ? "Đang cập nhật..." : "Cập nhật"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Hủy
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CreateInventoryTransactionDialog({
    open,
    setOpen,
    item,
    setItem,
}: {
    open: boolean;
    setOpen: (v: boolean) => void;
    item: Inventory | undefined;
    setItem: (item: Inventory | undefined) => void;
}) {
    const { mutate, isPending } = useCreateInventoryTransaction();
    const [type, setType] = useState<InventoryType>("IMPORT");
    const [quantity, setQuantity] = useState("0");
    const [note, setNote] = useState("");

    const submit = () => {
        if (!item) return;

        mutate(
            {
                variantId: item.variantId,
                type,
                quantity: Number(quantity),
                note: note || undefined,
            },
            {
                onSuccess: () => {
                    toast.success("Đã tạo giao dịch");
                    setType("IMPORT");
                    setQuantity("0");
                    setNote("");
                    setOpen(false);
                    setItem(undefined);
                },
                onError: (error) => toast.error(error.message),
            }
        );
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (!v) setItem(undefined);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tạo giao dịch kho</DialogTitle>
                    <DialogDescription>Mã biến thể: {item?.variantId}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Loại giao dịch</label>
                        <Select value={type} onValueChange={(v) => setType(v as InventoryType)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn loại giao dịch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="IMPORT">Nhập kho</SelectItem>
                                <SelectItem value="EXPORT">Xuất kho</SelectItem>
                                <SelectItem value="RETURN">Hoàn kho</SelectItem>
                                <SelectItem value="ADJUSTMENT">Điều chỉnh</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Số lượng</label>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Ghi chú</label>
                        <Input value={note} onChange={(e) => setNote(e.target.value)} disabled={isPending} />
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button onClick={submit} disabled={isPending}>
                            {isPending ? "Đang tạo..." : "Tạo"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Hủy
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function InventoryHistoryDialog({
    open,
    setOpen,
    item,
    setItem,
}: {
    open: boolean;
    setOpen: (v: boolean) => void;
    item: Inventory | undefined;
    setItem: (item: Inventory | undefined) => void;
}) {
    const { data, isFetching } = useInventoryTransactionHistory(item?.variantId, 1, 20);

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (!v) setItem(undefined);
            }}
        >
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Lịch sử giao dịch kho</DialogTitle>
                    <DialogDescription>Mã biến thể: {item?.variantId}</DialogDescription>
                </DialogHeader>

                {isFetching ? (
                    <p className="text-sm text-muted-foreground">Đang tải...</p>
                ) : (
                    <div className="space-y-2">
                        {(data?.data ?? []).length === 0 ? (
                            <p className="text-sm text-muted-foreground">Không có giao dịch</p>
                        ) : (
                            (data?.data ?? []).map((txn) => (
                                <div key={txn.id} className="rounded border p-2 text-sm">
                                    <div><strong>Loại:</strong> {txn.type}</div>
                                    <div><strong>SL:</strong> {txn.quantity}</div>
                                    <div><strong>Ghi chú:</strong> {txn.note || "-"}</div>
                                    <div><strong>Thời gian:</strong> {new Date(txn.createdAt).toLocaleString()}</div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
