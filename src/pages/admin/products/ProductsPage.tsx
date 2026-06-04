import { Loader2, Plus, LayoutGrid, LayoutList } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import ProductCard from "@/pages/shop/products/components/ProductCard";

import CrudTable from "@/components/crud_table/crud-table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteProduct, useProducts } from "@/hooks/useProducts";
import type { Product } from "@/types/product";

import { productColumns } from "./product-columns";

const ProductsPage = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<"table" | "card">("table");
    const [pendingDeleteProductId, setPendingDeleteProductId] = useState<number | null>(null);
    const { mutate: deleteItem, isPending: isDeleting } = useDeleteProduct();

    const handleDeleteItem = (id: number) => {
        setPendingDeleteProductId(id);
    };

    const confirmDeleteItem = () => {
        if (!pendingDeleteProductId) {
            return;
        }

        deleteItem(
            { id: pendingDeleteProductId },
            {
                onSuccess: () => {
                    toast.success("Đã xóa sản phẩm");
                    setPendingDeleteProductId(null);
                },
                onError: (error) => toast.error(`Xóa thất bại: ${error.message}`),
            }
        );
    };

    const handleViewItem = (id: number) => {
        navigate(`/admin/products/${id}`);
    };

    const handleEditItem = (id: number) => {
        navigate(`/admin/products/${id}/edit`);
    };

    return (
        <>
            <div className="space-y-4 w-full">
                <h1 className="text-2xl font-semibold">Sản phẩm</h1>

                <CrudTable<Product>
                    columns={productColumns(handleViewItem, handleEditItem, handleDeleteItem)}
                    useQuery={useProducts}
                    filterPlaceholder="Lọc theo tên sản phẩm..."
                    renderCustomView={viewMode === "card" ? (data, isFetching) => {
                        if (isFetching) {
                            return (
                                <div className="flex h-[200px] w-full items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#40BFFF]" />
                                </div>
                            );
                        }
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4">
                                {data.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product as any}
                                        actionSlot={
                                            <div className="flex gap-2 justify-end w-full pt-2 border-t mt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs px-2"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleViewItem(product.id);
                                                    }}
                                                >
                                                    Chi tiết
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs px-2"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleEditItem(product.id);
                                                    }}
                                                >
                                                    Sửa
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    className="h-7 text-xs px-2"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDeleteItem(product.id);
                                                    }}
                                                >
                                                    Xóa
                                                </Button>
                                            </div>
                                        }
                                    />
                                ))}
                                {data.length === 0 && (
                                    <div className="col-span-full py-8 text-center text-sm text-slate-500">
                                        Không tìm thấy sản phẩm nào.
                                    </div>
                                )}
                            </div>
                        );
                    } : undefined}
                >
                    <div className="flex items-center gap-1 border rounded-lg p-0.5 ml-2 h-8">
                        <Button
                            variant={viewMode === "table" ? "secondary" : "ghost"}
                            size="icon"
                            className="size-7"
                            onClick={() => setViewMode("table")}
                        >
                            <LayoutList className="size-4" />
                        </Button>
                        <Button
                            variant={viewMode === "card" ? "secondary" : "ghost"}
                            size="icon"
                            className="size-7"
                            onClick={() => setViewMode("card")}
                        >
                            <LayoutGrid className="size-4" />
                        </Button>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-2 h-8"
                        asChild
                    >
                        <Link to="/admin/products/create">
                            <Plus className="size-4" />
                            Thêm sản phẩm
                        </Link>
                    </Button>
                </CrudTable>
            </div>


            <AlertDialog
                open={Boolean(pendingDeleteProductId)}
                onOpenChange={(open) => {
                    if (!open && !isDeleting) {
                        setPendingDeleteProductId(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa sản phẩm</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa sản phẩm
                            {pendingDeleteProductId ? ` #${pendingDeleteProductId}` : " này"}?
                            Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isDeleting}
                            onClick={(event) => {
                                event.preventDefault();
                                confirmDeleteItem();
                            }}
                        >
                            {isDeleting ? "Đang xóa..." : "Xóa"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default ProductsPage;
