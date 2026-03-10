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
import type { Color, Size, SizeType } from "@/types/attribute";

const formatDate = (iso: string) => new Date(iso).toLocaleString();

export const sizeTypeColumns = (
    handleUpdateBtn: (item: SizeType) => void,
    handleDeleteItem: (id: number) => void
): ColumnDef<SizeType>[] => [
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
            accessorKey: "description",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Mô tả" />,
            enableSorting: false,
            cell: ({ row }) => row.original.description || "-",
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
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleUpdateBtn(item)}>Cập nhật</DropdownMenuItem>
                            <DropdownMenuItem className="focus:text-red-500" onClick={() => handleDeleteItem(item.id)}>
                                Xóa
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

export const sizeColumns = (
    handleUpdateBtn: (item: Size) => void,
    handleDeleteItem: (id: number) => void
): ColumnDef<Size>[] => [
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
            accessorKey: "sizeType",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Loại kích thước" />,
            cell: ({ row }) => row.original.sizeType?.name || `#${row.original.sizeTypeId}`,
            enableSorting: false,
        },
        {
            accessorKey: "sortOrder",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Thứ tự" />,
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
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleUpdateBtn(item)}>Cập nhật</DropdownMenuItem>
                            <DropdownMenuItem className="focus:text-red-500" onClick={() => handleDeleteItem(item.id)}>
                                Xóa
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

export const colorColumns = (
    handleUpdateBtn: (item: Color) => void,
    handleDeleteItem: (id: number) => void
): ColumnDef<Color>[] => [
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
            accessorKey: "hexCode",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Hex" />,
            cell: ({ row }) => row.original.hexCode || "-",
        },
        {
            id: "swatch",
            header: "Màu",
            cell: ({ row }) => {
                const code = row.original.hexCode;
                if (!code) {
                    return "-";
                }
                return <span className="inline-block size-5 rounded border" style={{ backgroundColor: code }} />;
            },
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
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleUpdateBtn(item)}>Cập nhật</DropdownMenuItem>
                            <DropdownMenuItem className="focus:text-red-500" onClick={() => handleDeleteItem(item.id)}>
                                Xóa
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
