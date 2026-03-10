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

const formatDate = (iso: string) => new Date(iso).toLocaleString();

export const productColumns = (
    handleDeleteItem: (id: number) => void
): ColumnDef<Product>[] => [
    {
        accessorKey: "id",
        header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
    },
    {
        accessorKey: "name",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        enableSorting: false,
    },
    {
        id: "brand",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Brand" />,
        cell: ({ row }) => row.original.brand?.name ?? `#${row.original.brandId}`,
        enableSorting: false,
    },
    {
        id: "category",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
        cell: ({ row }) => row.original.category?.name ?? `#${row.original.categoryId}`,
        enableSorting: false,
    },
    {
        id: "variantsCount",
        header: "Variants",
        cell: ({ row }) => row.original.variants?.length ?? 0,
    },
    {
        id: "imagesCount",
        header: "Images",
        cell: ({ row }) => row.original.images?.length ?? 0,
    },
    {
        accessorKey: "updatedAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Updated At" />,
        cell: ({ row }) => formatDate(row.original.updatedAt),
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const item = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            className="focus:text-red-500"
                            onClick={() => handleDeleteItem(item.id)}
                        >
                            Delete Product
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
