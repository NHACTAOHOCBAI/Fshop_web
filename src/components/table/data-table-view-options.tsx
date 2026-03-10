import type { Table } from "@tanstack/react-table";
import { Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const columnLabelMap: Record<string, string> = {
    id: "ID",
    imageUrl: "Hình ảnh",
    avatar: "Ảnh đại diện",
    name: "Tên",
    fullName: "Họ và tên",
    email: "Email",
    role: "Vai trò",
    department: "Phân khu",
    description: "Mô tả",
    createdAt: "Ngày tạo",
    updatedAt: "Cập nhật lúc",
    isVerified: "Đã xác thực",
    brand: "Thương hiệu",
    category: "Danh mục",
    variantsCount: "Biến thể",
    imagesCount: "Hình ảnh",
    variantId: "Mã biến thể",
    quantity: "Số lượng",
    sizeType: "Loại kích thước",
    sortOrder: "Thứ tự",
    hexCode: "Mã HEX",
    swatch: "Màu",
};

const toReadableLabel = (value: string) =>
    value
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/_/g, " ")
        .trim();

export function DataTableViewOptions<TData>({
    table,
}: {
    table: Table<TData>;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2 h-8">
                    <Settings2 className="size-4" />
                    Hiển thị
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Bật/tắt cột</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                    .getAllColumns()
                    .filter(
                        (column) =>
                            typeof column.accessorFn !== "undefined" && column.getCanHide()
                    )
                    .map((column) => {
                        const metaLabel = (column.columnDef.meta as { label?: string } | undefined)?.label;
                        const displayLabel = metaLabel || columnLabelMap[column.id] || toReadableLabel(column.id);

                        return (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                checked={column.getIsVisible()}
                                onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                            >
                                {displayLabel}
                            </DropdownMenuCheckboxItem>
                        );
                    })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
