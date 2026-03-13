import { useEffect, useState } from "react";

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
    useColors,
    useCreateColor,
    useCreateSize,
    useCreateSizeType,
    useDeleteColor,
    useDeleteSize,
    useDeleteSizeType,
    useSizes,
    useSizeTypes,
    useUpdateColor,
    useUpdateSize,
    useUpdateSizeType,
} from "@/hooks/useAttributes";
import type { Color, Size, SizeType } from "@/types/attribute";

import { colorColumns, sizeColumns, sizeTypeColumns } from "./attribute-columns";

type Tab = "size-types" | "sizes" | "colors";

export default function AttributesPage() {
    const [tab, setTab] = useState<Tab>("size-types");

    const [openCreateSizeType, setOpenCreateSizeType] = useState(false);
    const [openUpdateSizeType, setOpenUpdateSizeType] = useState(false);
    const [editingSizeType, setEditingSizeType] = useState<SizeType>();

    const [openCreateSize, setOpenCreateSize] = useState(false);
    const [openUpdateSize, setOpenUpdateSize] = useState(false);
    const [editingSize, setEditingSize] = useState<Size>();

    const [openCreateColor, setOpenCreateColor] = useState(false);
    const [openUpdateColor, setOpenUpdateColor] = useState(false);
    const [editingColor, setEditingColor] = useState<Color>();

    const { mutate: deleteSizeType } = useDeleteSizeType();
    const { mutate: deleteSize } = useDeleteSize();
    const { mutate: deleteColor } = useDeleteColor();

    const { data: sizeTypeSelections } = useSizeTypes({ page: 1, limit: 100 });

    const onDeleteSizeType = (id: number) => {
        deleteSizeType(
            { id },
            {
                onSuccess: () => toast.success("Đã xóa loại kích thước"),
                onError: (error) => toast.error(`Xóa thất bại: ${error.message}`),
            }
        );
    };

    const onDeleteSize = (id: number) => {
        deleteSize(
            { id },
            {
                onSuccess: () => toast.success("Đã xóa kích thước"),
                onError: (error) => toast.error(`Xóa thất bại: ${error.message}`),
            }
        );
    };

    const onDeleteColor = (id: number) => {
        deleteColor(
            { id },
            {
                onSuccess: () => toast.success("Đã xóa màu sắc"),
                onError: (error) => toast.error(`Xóa thất bại: ${error.message}`),
            }
        );
    };

    return (
        <div className="space-y-4 w-full">
            <h1 className="text-2xl font-semibold">Thuộc tính</h1>

            <div className="flex flex-wrap gap-2">
                <Button variant={tab === "size-types" ? "default" : "outline"} onClick={() => setTab("size-types")}>Loại kích thước</Button>
                <Button variant={tab === "sizes" ? "default" : "outline"} onClick={() => setTab("sizes")}>Kích thước</Button>
                <Button variant={tab === "colors" ? "default" : "outline"} onClick={() => setTab("colors")}>Màu sắc</Button>
            </div>

            {tab === "size-types" && (
                <CrudTable<SizeType>
                    columns={sizeTypeColumns(
                        (item) => {
                            setEditingSizeType(item);
                            setOpenUpdateSizeType(true);
                        },
                        onDeleteSizeType
                    )}
                    useQuery={useSizeTypes}
                    filterPlaceholder="Lọc theo tên loại kích thước..."
                >
                    <Button variant="outline" size="sm" className="ml-2 h-8" onClick={() => setOpenCreateSizeType(true)}>
                        <Plus className="size-4" />
                        Thêm loại kích thước
                    </Button>
                </CrudTable>
            )}

            {tab === "sizes" && (
                <CrudTable<Size>
                    columns={sizeColumns(
                        (item) => {
                            setEditingSize(item);
                            setOpenUpdateSize(true);
                        },
                        onDeleteSize
                    )}
                    useQuery={useSizes}
                    filterPlaceholder="Lọc theo tên kích thước..."
                >
                    <Button variant="outline" size="sm" className="ml-2 h-8" onClick={() => setOpenCreateSize(true)}>
                        <Plus className="size-4" />
                        Thêm kích thước
                    </Button>
                </CrudTable>
            )}

            {tab === "colors" && (
                <CrudTable<Color>
                    columns={colorColumns(
                        (item) => {
                            setEditingColor(item);
                            setOpenUpdateColor(true);
                        },
                        onDeleteColor
                    )}
                    useQuery={useColors}
                    filterPlaceholder="Lọc theo tên màu sắc..."
                >
                    <Button variant="outline" size="sm" className="ml-2 h-8" onClick={() => setOpenCreateColor(true)}>
                        <Plus className="size-4" />
                        Thêm màu sắc
                    </Button>
                </CrudTable>
            )}

            <CreateSizeTypeDialog open={openCreateSizeType} setOpen={setOpenCreateSizeType} />
            <UpdateSizeTypeDialog
                open={openUpdateSizeType}
                setOpen={setOpenUpdateSizeType}
                item={editingSizeType}
                setItem={setEditingSizeType}
            />

            <CreateSizeDialog
                open={openCreateSize}
                setOpen={setOpenCreateSize}
                sizeTypeOptions={sizeTypeSelections?.data ?? []}
            />
            <UpdateSizeDialog
                open={openUpdateSize}
                setOpen={setOpenUpdateSize}
                item={editingSize}
                setItem={setEditingSize}
                sizeTypeOptions={sizeTypeSelections?.data ?? []}
            />

            <CreateColorDialog open={openCreateColor} setOpen={setOpenCreateColor} />
            <UpdateColorDialog
                open={openUpdateColor}
                setOpen={setOpenUpdateColor}
                item={editingColor}
                setItem={setEditingColor}
            />
        </div>
    );
}

function CreateSizeTypeDialog({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
    const { mutate, isPending } = useCreateSizeType();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const submit = () => {
        mutate(
            { name, description: description || undefined },
            {
                onSuccess: () => {
                    toast.success("Đã tạo loại kích thước");
                    setName("");
                    setDescription("");
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
                    <DialogTitle>Tạo loại kích thước</DialogTitle>
                    <DialogDescription>Tạo mới một loại kích thước</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tên</label>
                        <Input placeholder="Tên" value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mô tả</label>
                        <Input
                            placeholder="Mô tả (không bắt buộc)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button className="w-full" onClick={submit} disabled={isPending || !name.trim()}>
                            {isPending ? "Đang tạo..." : "Tạo"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={isPending}
                            onClick={() => {
                                setName("");
                                setDescription("");
                                setOpen(false);
                            }}
                        >
                            Hủy
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function UpdateSizeTypeDialog({
    open,
    setOpen,
    item,
    setItem,
}: {
    open: boolean;
    setOpen: (v: boolean) => void;
    item: SizeType | undefined;
    setItem: (item: SizeType | undefined) => void;
}) {
    const { mutate, isPending } = useUpdateSizeType();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (item) {
            setName(item.name);
            setDescription(item.description || "");
        }
    }, [item]);

    const submit = () => {
        if (!item) return;
        mutate(
            { id: item.id, data: { name, description: description || undefined } },
            {
                onSuccess: () => {
                    toast.success("Đã cập nhật loại kích thước");
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
                    <DialogTitle>Cập nhật loại kích thước</DialogTitle>
                    <DialogDescription>Cập nhật loại kích thước đã chọn</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tên</label>
                        <Input placeholder="Tên" value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mô tả</label>
                        <Input
                            placeholder="Mô tả (không bắt buộc)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button className="w-full" onClick={submit} disabled={isPending || !name.trim()}>
                            {isPending ? "Đang cập nhật..." : "Cập nhật"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={isPending}
                            onClick={() => {
                                setOpen(false);
                                setItem(undefined);
                            }}
                        >
                            Hủy
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CreateSizeDialog({
    open,
    setOpen,
    sizeTypeOptions,
}: {
    open: boolean;
    setOpen: (v: boolean) => void;
    sizeTypeOptions: SizeType[];
}) {
    const { mutate, isPending } = useCreateSize();
    const [name, setName] = useState("");
    const [sizeTypeId, setSizeTypeId] = useState("");
    const [sortOrder, setSortOrder] = useState("0");

    const submit = () => {
        mutate(
            {
                name,
                sizeTypeId: Number(sizeTypeId),
                sortOrder: Number(sortOrder) || 0,
            },
            {
                onSuccess: () => {
                    toast.success("Đã tạo kích thước");
                    setName("");
                    setSizeTypeId("");
                    setSortOrder("0");
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
                    <DialogTitle>Tạo kích thước</DialogTitle>
                    <DialogDescription>Tạo mới một kích thước</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tên</label>
                        <Input placeholder="Tên" value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Loại kích thước</label>
                        <Select value={sizeTypeId} onValueChange={setSizeTypeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn loại kích thước" />
                            </SelectTrigger>
                            <SelectContent>
                                {sizeTypeOptions.map((sizeType) => (
                                    <SelectItem key={sizeType.id} value={`${sizeType.id}`}>
                                        {sizeType.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Thứ tự sắp xếp</label>
                        <Input
                            type="number"
                            placeholder="Thứ tự sắp xếp"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button className="w-full" onClick={submit} disabled={isPending || !name.trim() || !sizeTypeId}>
                            {isPending ? "Đang tạo..." : "Tạo"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={isPending}
                            onClick={() => {
                                setName("");
                                setSizeTypeId("");
                                setSortOrder("0");
                                setOpen(false);
                            }}
                        >
                            Hủy
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function UpdateSizeDialog({
    open,
    setOpen,
    item,
    setItem,
    sizeTypeOptions,
}: {
    open: boolean;
    setOpen: (v: boolean) => void;
    item: Size | undefined;
    setItem: (item: Size | undefined) => void;
    sizeTypeOptions: SizeType[];
}) {
    const { mutate, isPending } = useUpdateSize();
    const [name, setName] = useState("");
    const [sizeTypeId, setSizeTypeId] = useState("");
    const [sortOrder, setSortOrder] = useState("0");

    useEffect(() => {
        if (item) {
            setName(item.name);
            setSizeTypeId(`${item.sizeTypeId}`);
            setSortOrder(`${item.sortOrder}`);
        }
    }, [item]);

    const submit = () => {
        if (!item) return;
        mutate(
            {
                id: item.id,
                data: {
                    name,
                    sizeTypeId: Number(sizeTypeId),
                    sortOrder: Number(sortOrder) || 0,
                },
            },
            {
                onSuccess: () => {
                    toast.success("Đã cập nhật kích thước");
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
                    <DialogTitle>Cập nhật kích thước</DialogTitle>
                    <DialogDescription>Cập nhật kích thước đã chọn</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tên</label>
                        <Input placeholder="Tên" value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Loại kích thước</label>
                        <Select value={sizeTypeId} onValueChange={setSizeTypeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn loại kích thước" />
                            </SelectTrigger>
                            <SelectContent>
                                {sizeTypeOptions.map((sizeType) => (
                                    <SelectItem key={sizeType.id} value={`${sizeType.id}`}>
                                        {sizeType.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Thứ tự sắp xếp</label>
                        <Input
                            type="number"
                            placeholder="Thứ tự sắp xếp"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button className="w-full" onClick={submit} disabled={isPending || !name.trim() || !sizeTypeId}>
                            {isPending ? "Đang cập nhật..." : "Cập nhật"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={isPending}
                            onClick={() => {
                                setOpen(false);
                                setItem(undefined);
                            }}
                        >
                            Hủy
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CreateColorDialog({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
    const { mutate, isPending } = useCreateColor();
    const [name, setName] = useState("");
    const [hexCode, setHexCode] = useState("");

    const submit = () => {
        mutate(
            { name, hexCode: hexCode || undefined },
            {
                onSuccess: () => {
                    toast.success("Đã tạo màu sắc");
                    setName("");
                    setHexCode("");
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
                    <DialogTitle>Tạo màu sắc</DialogTitle>
                    <DialogDescription>Tạo mới một màu sắc</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tên</label>
                        <Input placeholder="Tên" value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mã HEX</label>
                        <Input
                            placeholder="#FFFFFF"
                            value={hexCode}
                            onChange={(e) => setHexCode(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button className="w-full" onClick={submit} disabled={isPending || !name.trim()}>
                            {isPending ? "Đang tạo..." : "Tạo"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={isPending}
                            onClick={() => {
                                setName("");
                                setHexCode("");
                                setOpen(false);
                            }}
                        >
                            Hủy
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function UpdateColorDialog({
    open,
    setOpen,
    item,
    setItem,
}: {
    open: boolean;
    setOpen: (v: boolean) => void;
    item: Color | undefined;
    setItem: (item: Color | undefined) => void;
}) {
    const { mutate, isPending } = useUpdateColor();
    const [name, setName] = useState("");
    const [hexCode, setHexCode] = useState("");

    useEffect(() => {
        if (item) {
            setName(item.name);
            setHexCode(item.hexCode || "");
        }
    }, [item]);

    const submit = () => {
        if (!item) return;
        mutate(
            { id: item.id, data: { name, hexCode: hexCode || undefined } },
            {
                onSuccess: () => {
                    toast.success("Đã cập nhật màu sắc");
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
                    <DialogTitle>Cập nhật màu sắc</DialogTitle>
                    <DialogDescription>Cập nhật màu sắc đã chọn</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tên</label>
                        <Input placeholder="Tên" value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mã HEX</label>
                        <Input
                            placeholder="#FFFFFF"
                            value={hexCode}
                            onChange={(e) => setHexCode(e.target.value)}
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button className="w-full" onClick={submit} disabled={isPending || !name.trim()}>
                            {isPending ? "Đang cập nhật..." : "Cập nhật"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={isPending}
                            onClick={() => {
                                setOpen(false);
                                setItem(undefined);
                            }}
                        >
                            Hủy
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
