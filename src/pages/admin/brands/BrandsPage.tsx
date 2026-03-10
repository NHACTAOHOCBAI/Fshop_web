import { Plus } from "lucide-react";
import { toast } from "sonner";

import CrudTable from "@/components/crud_table/crud-table";
import { Button } from "@/components/ui/button";
import { useBrands, useDeleteBrand } from "@/hooks/useBrands";
import type { Brand } from "@/types/brand";

import { brandColumns } from "./brand-columns";

const BrandsPage = () => {
    const { mutate: deleteItem } = useDeleteBrand();

    const handleUpdateBtn = (_item: Brand) => {
        toast.info("Update brand dialog is not implemented yet");
    };

    const handleDeleteItem = (id: number) => {
        deleteItem(
            { id },
            {
                onSuccess: () => toast.success("Brand has been deleted"),
                onError: (error) => toast.error(`Delete failed: ${error.message}`),
            }
        );
    };

    return (
        <div className="space-y-4  w-full">
            <h1 className="text-2xl font-semibold">Brands</h1>

            <CrudTable<Brand>
                columns={brandColumns(handleUpdateBtn, handleDeleteItem)}
                useQuery={useBrands}
                filterPlaceholder="Filter brand name..."
            >
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 h-8"
                    onClick={() => toast.info("Create brand dialog is not implemented yet")}
                >
                    <Plus className="size-4" />
                    Add Brand
                </Button>
            </CrudTable>
        </div>
    );
};

export default BrandsPage;