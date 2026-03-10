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
                onSuccess: () => toast.success("Inventory has been deleted"),
                onError: (error) => toast.error(`Delete failed: ${error.message}`),
            }
        );
    };

    return (
        <div className="space-y-4 w-full">
            <h1 className="text-2xl font-semibold">Inventory</h1>

            <div className="rounded-md border p-3 text-sm">
                Low stock items (&lt;=10): <strong>{lowStockData?.length ?? 0}</strong>
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
                filterPlaceholder="Filter by variant id..."
            >
                <Button variant="outline" size="sm" className="ml-2 h-8" onClick={() => setOpenCreate(true)}>
                    <Plus className="size-4" />
                    Add Inventory
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
                label: `${product.name} - ${variant.sku || `Variant #${variant.id}`}`,
            }))
        );
    }, [productsData?.data.data]);

    const submit = () => {
        if (!variantId) {
            toast.error("Variant is required");
            return;
        }

        mutate(
            { variantId: Number(variantId), quantity: Number(quantity) || 0 },
            {
                onSuccess: () => {
                    toast.success("Inventory created");
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
                    <DialogTitle>Create Inventory</DialogTitle>
                    <DialogDescription>Initialize inventory for a product variant</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Variant</label>
                        <Select value={variantId} onValueChange={setVariantId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select variant" />
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
                        <label className="text-sm font-medium">Quantity</label>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button onClick={submit} disabled={isPending || !variantId}>
                            {isPending ? "Creating..." : "Create"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancel
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
                    toast.success("Inventory updated");
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
                    <DialogTitle>Update Inventory</DialogTitle>
                    <DialogDescription>Update quantity for selected inventory</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Quantity</label>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button onClick={submit} disabled={isPending}>
                            {isPending ? "Updating..." : "Update"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancel
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
                    toast.success("Transaction created");
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
                    <DialogTitle>Create Inventory Transaction</DialogTitle>
                    <DialogDescription>Variant ID: {item?.variantId}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <Select value={type} onValueChange={(v) => setType(v as InventoryType)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="IMPORT">IMPORT</SelectItem>
                                <SelectItem value="EXPORT">EXPORT</SelectItem>
                                <SelectItem value="RETURN">RETURN</SelectItem>
                                <SelectItem value="ADJUSTMENT">ADJUSTMENT</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Quantity</label>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Note</label>
                        <Input value={note} onChange={(e) => setNote(e.target.value)} disabled={isPending} />
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button onClick={submit} disabled={isPending}>
                            {isPending ? "Creating..." : "Create"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Cancel
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
                    <DialogTitle>Inventory Transactions</DialogTitle>
                    <DialogDescription>Variant ID: {item?.variantId}</DialogDescription>
                </DialogHeader>

                {isFetching ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                ) : (
                    <div className="space-y-2">
                        {(data?.data ?? []).length === 0 ? (
                            <p className="text-sm text-muted-foreground">No transactions found</p>
                        ) : (
                            (data?.data ?? []).map((txn) => (
                                <div key={txn.id} className="rounded border p-2 text-sm">
                                    <div><strong>Type:</strong> {txn.type}</div>
                                    <div><strong>Qty:</strong> {txn.quantity}</div>
                                    <div><strong>Note:</strong> {txn.note || "-"}</div>
                                    <div><strong>At:</strong> {new Date(txn.createdAt).toLocaleString()}</div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
