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
import type { User } from "@/types/user";

const formatDate = (iso: string) => new Date(iso).toLocaleString();

export const userColumns = (
    handleUpdateBtn: (item: User) => void,
    handleDeleteItem: (id: number) => void
): ColumnDef<User>[] => [
        {
            accessorKey: "id",
            header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
        },
        {
            accessorKey: "avatar",
            header: "Ảnh đại diện",
            cell: ({ row }) => {
                const item = row.original;
                return (
                    <Avatar>
                        <AvatarImage src={item.avatar ?? undefined} />
                        <AvatarFallback>{toAlias(item.fullName || item.email)}</AvatarFallback>
                    </Avatar>
                );
            },
        },
        {
            accessorKey: "fullName",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Họ và tên" />,
            enableSorting: false,
            cell: ({ row }) => row.original.fullName || "-",
        },
        {
            accessorKey: "email",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
            enableSorting: false,
        },
        {
            accessorKey: "role",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Vai trò" />,
            cell: ({ row }) => row.original.role.toUpperCase(),
        },
        {
            accessorKey: "isVerified",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Đã xác thực" />,
            cell: ({ row }) => (row.original.isVerified ? "Có" : "Không"),
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
                                Cập nhật người dùng
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="focus:text-red-500"
                                onClick={() => handleDeleteItem(item.id)}
                            >
                                Xóa người dùng
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
