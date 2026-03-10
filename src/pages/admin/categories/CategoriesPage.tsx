import { useState } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import CrudTable from "@/components/crud_table/crud-table";
import { Button } from "@/components/ui/button";
import { useCategories, useDeleteCategory } from "@/hooks/useCategories";
import type { Category } from "@/types/category";

import { categoryColumns } from "./category-columns";
import { CreateCategoryDialog } from "./create-category/create-category-dialog";
import { UpdateCategoryDialog } from "./update-category/update-category-dialog";

const CategoriesPage = () => {
    const [openCreate, setOpenCreate] = useState(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [updatedItem, setUpdatedItem] = useState<Category>();
    const { mutate: deleteItem } = useDeleteCategory();

    const handleUpdateBtn = (item: Category) => {
        setUpdatedItem(item);
        setOpenUpdate(true);
    };

    const handleDeleteItem = (id: number) => {
        deleteItem(
            { id },
            {
                onSuccess: () => toast.success("Category has been deleted"),
                onError: (error) => toast.error(`Delete failed: ${error.message}`),
            }
        );
    };

    return (
        <div className="space-y-4 w-full">
            <h1 className="text-2xl font-semibold">Categories</h1>

            <CrudTable<Category>
                columns={categoryColumns(handleUpdateBtn, handleDeleteItem)}
                useQuery={useCategories}
                filterPlaceholder="Filter category name..."
            >
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 h-8"
                    onClick={() => setOpenCreate(true)}
                >
                    <Plus className="size-4" />
                    Add Category
                </Button>
            </CrudTable>

            <CreateCategoryDialog open={openCreate} setOpen={setOpenCreate} />
            <UpdateCategoryDialog
                open={openUpdate}
                setOpen={setOpenUpdate}
                updatedItem={updatedItem}
                setUpdatedItem={setUpdatedItem}
            />
        </div>
    );
};

export default CategoriesPage;
