import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router";

import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Coupon } from "@/types/coupon";

const typeLabel: Record<Coupon["type"], string> = {
    fixed: "Giảm cố định",
    percent: "Giảm %",
    shipping: "Free ship",
};

const statusLabel: Record<Coupon["status"], string> = {
    active: "Hoạt động",
    expired: "Hết hạn",
    inactive: "Tạm tắt",
};

export const couponColumns = (
    handleDeleteItem: (id: number) => void
): ColumnDef<Coupon>[] => [
        {
            accessorKey: "id",
            header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
        },
        {
            accessorKey: "code",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Mã" />,
        },
        {
            accessorKey: "name",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Tên" />,
            cell: ({ row }) => row.original.name ?? "-",
            enableSorting: false,
        },
        {
            accessorKey: "type",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Loại" />,
            cell: ({ row }) => typeLabel[row.original.type],
            enableSorting: false,
        },
        {
            accessorKey: "value",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Giá trị" />,
            cell: ({ row }) => {
                const coupon = row.original;
                if (coupon.type === "percent") {
                    return `${coupon.value}%`;
                }
                return formatCurrency(coupon.value);
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Trạng thái" />,
            cell: ({ row }) => statusLabel[row.original.status],
            enableSorting: false,
        },
        {
            accessorKey: "isPublic",
            header: "Public",
            cell: ({ row }) => (row.original.isPublic ? "Có" : "Không"),
            enableSorting: false,
        },
        {
            accessorKey: "startDate",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Bắt đầu" />,
            cell: ({ row }) => formatDateTime(row.original.startDate),
        },
        {
            accessorKey: "endDate",
            header: ({ column }) => <DataTableColumnHeader column={column} title="Kết thúc" />,
            cell: ({ row }) => formatDateTime(row.original.endDate),
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
                            <DropdownMenuItem asChild>
                                <Link to={`/admin/coupons/${item.id}/edit`}>
                                    Cập nhật mã giảm giá
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="focus:text-red-500"
                                onClick={() => handleDeleteItem(item.id)}
                            >
                                Xóa mã giảm giá
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
