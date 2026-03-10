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
import type { Inventory } from "@/types/inventory";

const formatDate = (iso: string) => new Date(iso).toLocaleString();

export const inventoryColumns = (
    handleUpdate: (item: Inventory) => void,
    handleCreateTransaction: (item: Inventory) => void,
    handleViewHistory: (item: Inventory) => void,
    handleDelete: (id: number) => void
): ColumnDef<Inventory>[] => [
        {
            accessorKey: "id",
            header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
        },
        {
            accessorKey: "variantId",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Variant ID" />,
        },
        {
            accessorKey: "quantity",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Quantity" />,
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
                            <DropdownMenuItem onClick={() => handleUpdate(item)}>Update Quantity</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateTransaction(item)}>New Transaction</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewHistory(item)}>View History</DropdownMenuItem>
                            <DropdownMenuItem className="focus:text-red-500" onClick={() => handleDelete(item.id)}>
                                Delete Inventory
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
