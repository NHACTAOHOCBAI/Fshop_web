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
        header: "Avatar",
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Full Name" />,
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
        cell: ({ row }) => row.original.role.toUpperCase(),
    },
    {
        accessorKey: "isVerified",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Verified" />,
        cell: ({ row }) => (row.original.isVerified ? "Yes" : "No"),
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
        cell: ({ row }) => formatDate(row.original.createdAt),
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
                        <DropdownMenuItem onClick={() => handleUpdateBtn(item)}>
                            Update User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="focus:text-red-500"
                            onClick={() => handleDeleteItem(item.id)}
                        >
                            Delete User
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
