import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toAlias } from "@/lib/utils";
import type { Category } from "@/types/category";

const formatDate = (iso: string) => new Date(iso).toLocaleString();

export const categoryColumns = (
    handleUpdateBtn: (item: Category) => void,
    handleDeleteItem: (id: number) => void
): ColumnDef<Category>[] => [
        {
            accessorKey: "id",
            header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
        },
        {
            accessorKey: "imageUrl",
            header: "Hình ảnh",
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <Avatar>
                        <AvatarImage src={item.imageUrl ?? undefined} />
                        <AvatarFallback>{toAlias(item.name)}</AvatarFallback>
                    </Avatar>
                );
            },
        },
        {
            accessorKey: "name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Tên" />,
            enableSorting: false,
        },
        {
            accessorKey: "department",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Phân khu" />,
            cell: ({ row }) => row.original.department.toUpperCase(),
            enableSorting: false,
        },
        {
            accessorKey: "description",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Mô tả" />,
            enableSorting: false,
            cell: ({ row }) => row.original.description ?? "-",
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Ngày tạo" />,
            cell: ({ row }) => formatDate(row.original.createdAt),
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
                            <DropdownMenuItem onClick={() => handleUpdateBtn(item)}>
                                Cập nhật danh mục
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="focus:text-red-500"
                                onClick={() => handleDeleteItem(item.id)}
                            >
                                Xóa danh mục
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
