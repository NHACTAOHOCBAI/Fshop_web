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
    const [viewMode, setViewMode] = useState<"table" | "card">("table");
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
