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
            header: ({ column }) => <DataTableColumnHeader column={column} title="Mã biến thể" />,
        },
        {
            accessorKey: "quantity",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Số lượng" />,
        },
        {
            accessorKey: "updatedAt",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Cập nhật lúc" />,
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
                                <span className="sr-only">Mở menu</span>
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleUpdate(item)}>Cập nhật số lượng</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCreateTransaction(item)}>Tạo giao dịch mới</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewHistory(item)}>Xem lịch sử</DropdownMenuItem>
                            <DropdownMenuItem className="focus:text-red-500" onClick={() => handleDelete(item.id)}>
                                Xóa tồn kho
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
