import { Plus } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";

import CrudTable from "@/components/crud_table/crud-table";
import { Button } from "@/components/ui/button";
import { useDeleteProduct, useProducts } from "@/hooks/useProducts";
import type { Product } from "@/types/product";

import { productColumns } from "./product-columns";

const ProductsPage = () => {
    const { mutate: deleteItem } = useDeleteProduct();

    const handleDeleteItem = (id: number) => {
        deleteItem(
            { id },
            {
                onSuccess: () => toast.success("Product has been deleted"),
                onError: (error) => toast.error(`Delete failed: ${error.message}`),
            }
        );
    };

    return (
        <div className="space-y-4 w-full">
            <h1 className="text-2xl font-semibold">Products</h1>

            <CrudTable<Product>
                columns={productColumns(handleDeleteItem)}
                useQuery={useProducts}
                filterPlaceholder="Filter product name..."
            >
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 h-8"
                    asChild
                >
                    <Link to="/admin/products/create">
                        <Plus className="size-4" />
                        Add Product
                    </Link>
                </Button>
            </CrudTable>
        </div>
    );
};

export default ProductsPage;
