import { useState } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import CrudTable from "@/components/crud_table/crud-table";
import { Button } from "@/components/ui/button";
import { useBrands, useDeleteBrand } from "@/hooks/useBrands";
import type { Brand } from "@/types/brand";

import { brandColumns } from "./brand-columns";
import { CreateBrandDialog } from "./create-brand/create-brand-dialog";
import { UpdateBrandDialog } from "./update-brand/update-brand-dialog";

const BrandsPage = () => {
    const [openCreate, setOpenCreate] = useState(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [updatedItem, setUpdatedItem] = useState<Brand>();
    const { mutate: deleteItem } = useDeleteBrand();

    const handleUpdateBtn = (item: Brand) => {
        setUpdatedItem(item);
        setOpenUpdate(true);
    };

    const handleDeleteItem = (id: number) => {
        deleteItem(
            { id },
            {
                onSuccess: () => toast.success("Đã xóa thương hiệu"),
                onError: (error) => toast.error(`Xóa thất bại: ${error.message}`),
            }
        );
    };

    return (
        <div className="space-y-4  w-full">
            <h1 className="text-2xl font-semibold">Thương hiệu</h1>

            <CrudTable<Brand>
                columns={brandColumns(handleUpdateBtn, handleDeleteItem)}
                useQuery={useBrands}
                filterPlaceholder="Lọc theo tên thương hiệu..."
            >
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 h-8"
                    onClick={() => setOpenCreate(true)}
                >
                    <Plus className="size-4" />
                    Thêm thương hiệu
                </Button>
            </CrudTable>

            <CreateBrandDialog open={openCreate} setOpen={setOpenCreate} />
            <UpdateBrandDialog
                open={openUpdate}
                setOpen={setOpenUpdate}
                updatedItem={updatedItem}
                setUpdatedItem={setUpdatedItem}
            />
        </div>
    );
};

export default BrandsPage;