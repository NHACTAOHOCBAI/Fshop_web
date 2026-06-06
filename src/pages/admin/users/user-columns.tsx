import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router";

import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime, toAlias } from "@/lib/utils";
import type { User } from "@/types/user";

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
            accessorKey: "isBlogActive",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Blogger" />,
            cell: ({ row }) => (
                row.original.isBlogActive ? (
                    <Badge className="bg-black text-white hover:bg-black/90 font-medium">Blogger</Badge>
                ) : (
                    <Badge variant="secondary" className="text-slate-400 bg-slate-100/80 font-normal">Thường</Badge>
                )
            ),
        },
        {
            accessorKey: "isVerified",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Đã xác thực" />,
            cell: ({ row }) => (row.original.isVerified ? "Có" : "Không"),
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Ngày tạo" />,
            cell: ({ row }) => formatDateTime(row.original.createdAt),
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
                    <div className="flex items-center gap-1.5">
                        {item.isBlogActive && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-black rounded-lg"
                                asChild
                            >
                                <Link to={`/admin/community/user/${item.id}`}>
                                    Xem Blog
                                </Link>
                            </Button>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Mở menu</span>
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 max-w-[calc(100vw-1rem)]">
                                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleUpdateBtn(item)}>
                                    Cập nhật người dùng
                                </DropdownMenuItem>
                                {item.isBlogActive && (
                                    <DropdownMenuItem asChild>
                                        <Link to={`/admin/community/user/${item.id}`} className="cursor-pointer">
                                            Xem trang blog
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    className="focus:text-red-500"
                                    onClick={() => handleDeleteItem(item.id)}
                                >
                                    Xóa người dùng
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];
