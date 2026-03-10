import type { Table } from "@tanstack/react-table";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface DataTablePaginationProps<TData> {
    table: Table<TData>;
}

export function DataTablePagination<TData>({
    table,
}: DataTablePaginationProps<TData>) {
    return (
        <div className="flex flex-col items-start justify-between gap-3 px-2 sm:flex-row sm:items-center">
            <div className="text-sm text-muted-foreground">
                {table.getFilteredRowModel().rows.length} dòng
            </div>
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Số dòng mỗi trang</p>
                    <Select
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(value) => {
                            table.setPageSize(Number(value));
                        }}
                    >
                        <SelectTrigger className="h-8 w-19">
                            <SelectValue placeholder="Dòng" />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[2, 4, 10, 20, 25, 30, 40, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="min-w-28 text-sm font-medium">
                    Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Về trang đầu</span>
                        <ChevronsLeft className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        <span className="sr-only">Về trang trước</span>
                        <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Tới trang sau</span>
                        <ChevronRight className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => table.setPageIndex(Math.max(table.getPageCount() - 1, 0))}
                        disabled={!table.getCanNextPage()}
                    >
                        <span className="sr-only">Tới trang cuối</span>
                        <ChevronsRight className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
