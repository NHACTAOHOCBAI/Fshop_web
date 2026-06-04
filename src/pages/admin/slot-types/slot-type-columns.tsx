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
import { formatDateTime } from "@/lib/utils";
import type { SlotType } from "@/types/category";

export const slotTypeColumns = (
    handleUpdateBtn: (item: SlotType) => void,
    handleDeleteItem: (id: number) => void
): ColumnDef<SlotType>[] => [
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
        accessorKey: "code",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
        enableSorting: false,
    },
    {
        accessorKey: "hint",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Gợi ý" />,
        enableSorting: false,
        cell: ({ row }) => row.original.hint ?? "-",
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Ngày tạo" />,
        cell: ({ row }) => formatDateTime(row.original.createdAt),
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
                        <DropdownMenuItem onClick={() => handleUpdateBtn(item)}>
                            Cập nhật
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="focus:text-red-500"
                            onClick={() => handleDeleteItem(item.id)}
                        >
                            Xóa
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
