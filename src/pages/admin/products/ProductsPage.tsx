import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteProduct, useProductById, useProducts } from "@/hooks/useProducts";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Product } from "@/types/product";

import { productColumns } from "./product-columns";

const ProductsPage = () => {
    const navigate = useNavigate();
    const [detailProductId, setDetailProductId] = useState<number | null>(null);
    const [pendingDeleteProductId, setPendingDeleteProductId] = useState<number | null>(null);
    const { mutate: deleteItem, isPending: isDeleting } = useDeleteProduct();
    const detailQuery = useProductById(detailProductId ?? 0, Boolean(detailProductId));
    const detailProduct = detailQuery.data?.data;

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
        setDetailProductId(id);
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
                >
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

            <Dialog open={Boolean(detailProductId)} onOpenChange={(open) => !open && setDetailProductId(null)}>
                <DialogContent className="w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto sm:max-w-2xl sm:w-full">
                    <DialogHeader>
                        <DialogTitle>Chi tiết sản phẩm</DialogTitle>
                    </DialogHeader>

                    {detailQuery.isLoading ? (
                        <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Đang tải chi tiết sản phẩm...
                        </div>
                    ) : detailQuery.isError ? (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                            Không thể tải chi tiết sản phẩm.
                        </div>
                    ) : detailProduct ? (
                        <div className="space-y-3 text-sm">
                            <p><span className="font-medium">ID:</span> #{detailProduct.id}</p>
                            <p><span className="font-medium">Tên:</span> {detailProduct.name}</p>
                            <p><span className="font-medium">Giá:</span> {formatCurrency(Number(detailProduct.price || 0))}</p>
                            <p><span className="font-medium">Thương hiệu:</span> {detailProduct.brand?.name ?? `#${detailProduct.brandId}`}</p>
                            <p><span className="font-medium">Danh mục:</span> {detailProduct.category?.name ?? `#${detailProduct.categoryId}`}</p>
                            <p><span className="font-medium">Trạng thái:</span> {detailProduct.isActive ? "Đang hoạt động" : "Tạm ẩn"}</p>
                            <p><span className="font-medium">Cập nhật:</span> {formatDateTime(detailProduct.updatedAt)}</p>
                            {detailProduct.description ? (
                                <p><span className="font-medium">Mô tả:</span> {detailProduct.description}</p>
                            ) : null}
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

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
