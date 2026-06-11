import { useState } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import CrudTable from "@/components/crud_table/crud-table";
import { Button } from "@/components/ui/button";
import { useSlotTypes, useDeleteSlotType } from "@/hooks/useSlotTypes";
import type { SlotType } from "@/types/category";

import { slotTypeColumns } from "./slot-type-columns";
import { CreateSlotTypeDialog } from "./create-slot-type-dialog";
import { UpdateSlotTypeDialog } from "./update-slot-type-dialog";

const SlotTypesPage = () => {
    const [openCreate, setOpenCreate] = useState(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [updatedItem, setUpdatedItem] = useState<SlotType>();
    const { mutate: deleteItem } = useDeleteSlotType();

    const handleUpdateBtn = (item: SlotType) => {
        setUpdatedItem(item);
        setOpenUpdate(true);
    };

    const handleDeleteItem = (id: number) => {
        deleteItem(
            { id },
            {
                onSuccess: () => toast.success("Đã xóa vị trí phối đồ"),
                onError: (error) => toast.error(`Xóa thất bại: ${error.message}`),
            }
        );
    };

    return (
        <div className="space-y-4 w-full">
            <div>
                <h1 className="text-2xl font-semibold">Quản lý Vị trí phối đồ</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Cấu hình và định nghĩa các vùng/vị trí phối đồ trên cơ thể người mẫu cho tính năng thử đồ ảo (Try-On).
                </p>
            </div>

            <CrudTable<SlotType>
                columns={slotTypeColumns(handleUpdateBtn, handleDeleteItem)}
                useQuery={useSlotTypes}
                filterPlaceholder="Lọc theo tên hoặc code..."
            >
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 h-8"
                    onClick={() => setOpenCreate(true)}
                >
                    <Plus className="size-4" />
                    Thêm vị trí phối đồ
                </Button>
            </CrudTable>

            <CreateSlotTypeDialog open={openCreate} setOpen={setOpenCreate} />
            <UpdateSlotTypeDialog
                open={openUpdate}
                setOpen={setOpenUpdate}
                updatedItem={updatedItem}
                setUpdatedItem={setUpdatedItem}
            />
        </div>
    );
};

export default SlotTypesPage;
