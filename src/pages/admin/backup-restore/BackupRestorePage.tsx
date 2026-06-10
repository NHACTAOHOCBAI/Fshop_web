import type { ColumnDef } from "@tanstack/react-table";
import { Download, Loader2, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import CustomTable from "@/components/table/custom-table";
import { DataTablePagination } from "@/components/table/data-table-pagination";
import { DataTableViewOptions } from "@/components/table/data-table-view-options";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBackups, useCreateBackup, useDeleteBackup, useRestoreBackup } from "@/hooks/useBackups";
import useTable from "@/hooks/useTable";
import { getBackupInfo } from "@/services/backups";
import type { Backup, BackupStatus } from "@/types/backup";
import type { QueryParams } from "@/types/query";

const formatBackupSize = (size: number) => {
    if (!Number.isFinite(size) || size < 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    if (size === 0) {
        return "0 B";
    }

    const power = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
    const value = size / 1024 ** power;

    return `${value.toFixed(power === 0 ? 0 : 2)} ${units[power]}`;
};

const formatBackupDate = (isoDate: string) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("vi-VN");
};

const isTimeoutError = (error: unknown) => {
    if (!(error instanceof Error)) return false;
    return error.message.toLowerCase().includes("timeout");
};

const getLongRunningErrorMessage = (error: unknown, fallback: string) => {
    if (isTimeoutError(error)) {
        return "Tác vụ vẫn có thể đang chạy trên server. Vui lòng tải lại danh sách sau ít phút.";
    }

    return error instanceof Error ? error.message : fallback;
};

const BackupRestorePage = () => {
    const [statusFilter, setStatusFilter] = useState<BackupStatus | "all">("all");
    const [selectedDelete, setSelectedDelete] = useState<Backup | null>(null);
    const [selectedRestore, setSelectedRestore] = useState<Backup | null>(null);
    const [downloadingFilename, setDownloadingFilename] = useState<string | null>(null);

    const { mutate: createBackupMutate, isPending: isCreatingBackup } = useCreateBackup();
    const { mutate: restoreBackupMutate, isPending: isRestoringBackup } = useRestoreBackup();
    const { mutate: deleteBackupMutate, isPending: isDeletingBackup } = useDeleteBackup();

    const columns = useMemo<ColumnDef<Backup>[]>(
        () => [
            {
                accessorKey: "filename",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Tên file" />,
                cell: ({ row }) => <span className="font-medium">{row.original.filename}</span>,
            },
            {
                accessorKey: "size",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Dung lượng" />,
                cell: ({ row }) => formatBackupSize(row.original.size),
            },
            {
                accessorKey: "createdAt",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Ngày tạo" />,
                cell: ({ row }) => formatBackupDate(row.original.createdAt),
            },
            {
                accessorKey: "status",
                header: "Trạng thái",
                enableSorting: false,
                cell: ({ row }) => (
                    <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.original.status === "success"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                        }`}
                    >
                        {row.original.status === "success" ? "Thành công" : "Lỗi"}
                    </span>
                ),
            },
            {
                id: "actions",
                header: () => <div className="text-right">Hành động</div>,
                enableSorting: false,
                enableHiding: false,
                cell: ({ row }) => {
                    const backup = row.original;

                    return (
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void handleDownload(backup.filename)}
                                disabled={Boolean(downloadingFilename) || isRestoringBackup || isDeletingBackup}
                            >
                                {downloadingFilename === backup.filename ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Download className="size-4" />
                                )}
                                Tải xuống
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedRestore(backup)}
                                disabled={isRestoringBackup || isDeletingBackup || isCreatingBackup}
                            >
                                <RotateCcw className="size-4" />
                                Khôi phục
                            </Button>

                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setSelectedDelete(backup)}
                                disabled={isDeletingBackup || isRestoringBackup || isCreatingBackup}
                            >
                                <Trash2 className="size-4" />
                                Xóa
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [downloadingFilename, isCreatingBackup, isDeletingBackup, isRestoringBackup]
    );

    const useBackupsQuery = (params: QueryParams) => useBackups(params, statusFilter);

    const { table, filter, setFilter, setPagination, isFetching, isError, error, refetch } = useTable<Backup>({
        use: useBackupsQuery,
        columns,
    });

    const handleCreateBackup = () => {
        toast.loading("Đang tạo bản sao lưu, quá trình có thể mất vài phút...", {
            id: "backup-create",
        });

        createBackupMutate(undefined, {
            onSuccess: () => {
                toast.success("Đã tạo bản sao lưu thành công.", { id: "backup-create" });
            },
            onError: (createError) => {
                if (isTimeoutError(createError)) {
                    toast.error(
                        `Tạo bản sao lưu thất bại: ${getLongRunningErrorMessage(
                            createError,
                            "Đã có lỗi xảy ra khi tạo bản sao lưu.",
                        )}`,
                        { id: "backup-create" },
                    );
                    return;
                }
                toast.error(`Tạo bản sao lưu thất bại: ${createError.message}`, {
                    id: "backup-create",
                });
            },
        });
    };

    const handleRestore = () => {
        if (!selectedRestore) {
            return;
        }

        toast.loading("Đang khôi phục dữ liệu, vui lòng không đóng trang...", {
            id: "backup-restore",
        });

        restoreBackupMutate(
            { filename: selectedRestore.filename },
            {
                onSuccess: () => {
                    toast.success(`Đã khôi phục từ ${selectedRestore.filename}.`, {
                        id: "backup-restore",
                    });
                    setSelectedRestore(null);
                },
                onError: (restoreError) => {
                    if (isTimeoutError(restoreError)) {
                        toast.error(
                            `Khôi phục thất bại: ${getLongRunningErrorMessage(
                                restoreError,
                                "Đã có lỗi xảy ra khi khôi phục dữ liệu.",
                            )}`,
                            { id: "backup-restore" },
                        );
                        return;
                    }
                    toast.error(`Khôi phục thất bại: ${restoreError.message}`, {
                        id: "backup-restore",
                    });
                },
            }
        );
    };

    const handleDelete = () => {
        if (!selectedDelete) {
            return;
        }

        deleteBackupMutate(
            { filename: selectedDelete.filename },
            {
                onSuccess: () => {
                    toast.success(`Đã xóa bản sao lưu ${selectedDelete.filename}.`);
                    setSelectedDelete(null);
                },
                onError: (deleteError) => {
                    toast.error(`Xóa bản sao lưu thất bại: ${deleteError.message}`);
                },
            }
        );
    };

    const handleDownload = async (filename: string) => {
        setDownloadingFilename(filename);
        try {
            const response = await getBackupInfo(filename);
            const downloadUrl = response.data.downloadUrl;

            if (!downloadUrl) {
                toast.error("Không thể lấy đường dẫn tải file.");
                return;
            }

            window.open(downloadUrl, "_blank", "noopener,noreferrer");
            toast.success("Đã mở liên kết tải bản sao lưu.");
        } catch (downloadError) {
            const message = downloadError instanceof Error ? downloadError.message : "Đã xảy ra lỗi khi tải file.";
            toast.error(message);
        } finally {
            setDownloadingFilename(null);
        }
    };

    return (
        <div className="space-y-4  w-full">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Sao lưu & Khôi phục</h1>
                    <p className="text-sm text-muted-foreground">
                        Quản lý bản sao lưu cơ sở dữ liệu, tải xuống hoặc khôi phục khi cần.
                    </p>
                </div>
            </div>

            <div>
                <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
                    <Input
                        placeholder="Tìm theo tên file..."
                        className="w-full md:max-w-sm"
                        value={filter}
                        onChange={(event) => {
                            setFilter(event.target.value);
                            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                        }}
                    />

                    <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                            setStatusFilter(value as BackupStatus | "all");
                            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                        }}
                    >
                        <SelectTrigger className="h-8 w-full md:ml-2 md:w-44">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="success">Thành công</SelectItem>
                            <SelectItem value="error">Lỗi</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex flex-wrap items-center gap-2 md:ml-auto md:justify-end">
                        <DataTableViewOptions table={table} />
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => {
                                void refetch();
                            }}
                            disabled={isFetching || isCreatingBackup || isRestoringBackup || isDeletingBackup}
                        >
                            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
                            Làm mới
                        </Button>
                        <Button
                            size="sm"
                            className="h-8"
                            onClick={handleCreateBackup}
                            disabled={isCreatingBackup || isRestoringBackup || isDeletingBackup}
                        >
                            {isCreatingBackup ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Đang sao lưu...
                                </>
                            ) : (
                                "Tạo bản sao lưu"
                            )}
                        </Button>
                    </div>
                </div>

                {isError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                        Không thể tải dữ liệu sao lưu: {error?.message || "Đã có lỗi xảy ra."}
                    </div>
                ) : (
                    <>
                        <div className="overflow-hidden rounded-md border">
                            <CustomTable onLoading={isFetching} columns={columns} table={table} />
                        </div>
                        <div className="space-x-2 py-4">
                            <DataTablePagination table={table} />
                        </div>
                    </>
                )}
            </div>

            <AlertDialog
                open={Boolean(selectedRestore)}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedRestore(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận khôi phục cơ sở dữ liệu</AlertDialogTitle>
                        <AlertDialogDescription>
                            Thao tác này sẽ ghi đè dữ liệu hiện tại bằng bản sao lưu {" "}
                            <span className="font-medium">{selectedRestore?.filename}</span>. Bạn chỉ nên thực hiện khi đã hiểu
                            rõ rủi ro mất dữ liệu hiện tại.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isRestoringBackup}>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRestore}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isRestoringBackup}
                        >
                            {isRestoringBackup ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Đang khôi phục...
                                </>
                            ) : (
                                "Xác nhận khôi phục"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={Boolean(selectedDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedDelete(null);
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa bản sao lưu</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bản sao lưu <span className="font-medium">{selectedDelete?.filename}</span> sẽ bị xóa vĩnh viễn khỏi hệ
                            thống lưu trữ.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingBackup}>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeletingBackup}
                        >
                            {isDeletingBackup ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Đang xóa...
                                </>
                            ) : (
                                "Xóa bản sao lưu"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default BackupRestorePage;
