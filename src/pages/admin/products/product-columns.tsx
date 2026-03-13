import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Product } from "@/types/product";
import { formatDateTime } from "@/lib/utils";

export const productColumns = (
    handleDeleteItem: (id: number) => void
): ColumnDef<Product>[] => [
        {
            accessorKey: "id",
            header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
        },
        {
            accessorKey: "name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Tên" />,
            enableSorting: false,
        },
        {
            id: "brand",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Thương hiệu" />,
            cell: ({ row }) => row.original.brand?.name ?? `#${row.original.brandId}`,
            enableSorting: false,
        },
        {
            id: "category",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Danh mục" />,
            cell: ({ row }) => row.original.category?.name ?? `#${row.original.categoryId}`,
            enableSorting: false,
        },
        {
            id: "variantsCount",
            header: "Biến thể",
            cell: ({ row }) => row.original.variants?.length ?? 0,
        },
        {
            id: "imagesCount",
            header: "Hình ảnh",
            cell: ({ row }) => row.original.images?.length ?? 0,
        },
        {
            accessorKey: "updatedAt",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Cập nhật lúc" />,
            cell: ({ row }) => formatDateTime(row.original.updatedAt),
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const item = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Mở menu</span>
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                            <DropdownMenuItem
                                className="focus:text-red-500"
                                onClick={() => handleDeleteItem(item.id)}
                            >
                                Xóa sản phẩm
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
