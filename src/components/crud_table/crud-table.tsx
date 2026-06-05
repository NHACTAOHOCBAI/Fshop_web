import type { UseQueryResult } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { Input } from "@/components/ui/input";
import CustomTable from "@/components/table/custom-table";
import { DataTablePagination } from "@/components/table/data-table-pagination";
import { DataTableViewOptions } from "@/components/table/data-table-view-options";
import useTable from "@/hooks/useTable";
import type { QueryParams } from "@/types/query";

interface CrudTableProps<T extends { id: number }> {
    columns: ColumnDef<T>[];
    useQuery: (params: QueryParams) => UseQueryResult<unknown, Error>;
    filterPlaceholder?: string;
    children?: React.ReactNode;
    renderCustomView?: (data: T[], isFetching: boolean) => React.ReactNode;
    dependencies?: any[];
    filterElement?: React.ReactNode;
}

export default function CrudTable<T extends { id: number }>({
    columns,
    useQuery,
    filterPlaceholder = "Tìm kiếm...",
    children,
    renderCustomView,
    dependencies,
    filterElement,
}: CrudTableProps<T>) {
    const { table, isFetching, filter, setFilter, setPagination } = useTable<T>({
        use: useQuery,
        columns,
        dependencies,
    });

    return (
        <div>
            <div className="flex flex-wrap items-center gap-2 py-4">
                <Input
                    placeholder={filterPlaceholder}
                    className="max-w-sm"
                    value={filter}
                    onChange={(event) => {
                        setFilter(event.target.value);
                        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                    }}
                />
                {filterElement}
                <div className="ml-auto flex items-center gap-2">
                    {!renderCustomView && <DataTableViewOptions table={table} />}
                    {children}
                </div>
            </div>

            <div>
                {renderCustomView ? (
                    renderCustomView(
                        table.getRowModel().rows.map((row) => row.original),
                        isFetching
                    )
                ) : (
                    <div className="overflow-hidden rounded-md border">
                        <CustomTable onLoading={isFetching} columns={columns} table={table} />
                    </div>
                )}
                <div className="space-x-2 py-4">
                    <DataTablePagination table={table} />
                </div>
            </div>
        </div>
    );
}
