import { useMemo, useState } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

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
import type { Inventory, InventoryType } from "@/types/inventory";

import { inventoryColumns } from "./inventory-columns";

export default function StocksPage() {
    const [openCreate, setOpenCreate] = useState(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [openTxn, setOpenTxn] = useState(false);
    const [openHistory, setOpenHistory] = useState(false);

    const [selectedInventory, setSelectedInventory] = useState<Inventory>();

    const { mutate: deleteItem } = useDeleteInventory();
    const { data: lowStockData } = useLowStockInventories(10);

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
        <div className="space-y-4 w-full">
            <h1 className="text-2xl font-semibold">Tồn kho</h1>

            <div className="rounded-md border p-3 text-sm">
                Sản phẩm sắp hết hàng (&lt;=10): <strong>{lowStockData?.length ?? 0}</strong>
            </div>

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
        const products = productsData?.data.data ?? [];
        return products.flatMap((product) =>
            (product.variants ?? []).map((variant) => ({
                id: variant.id,
                label: `${product.name} - ${variant.sku || `Biến thể #${variant.id}`}`,
            }))
        );
    }, [productsData?.data.data]);

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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Tạo tồn kho</DialogTitle>
                    <DialogDescription>Khởi tạo tồn kho cho một biến thể sản phẩm</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Biến thể</label>
                        <Select value={variantId} onValueChange={setVariantId}>
                            <SelectTrigger>
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
