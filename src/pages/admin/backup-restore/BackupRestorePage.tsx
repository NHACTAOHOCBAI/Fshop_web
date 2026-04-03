import { Download, Loader2, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useBackups, useCreateBackup, useDeleteBackup, useRestoreBackup } from "@/hooks/useBackups";
import { getBackupInfo } from "@/services/backups";
import type { Backup, BackupStatus } from "@/types/backup";

const PAGE_SIZES = [5, 10, 20, 50];

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

const BackupRestorePage = () => {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<BackupStatus | "all">("all");
    const [sortBy, setSortBy] = useState<"createdAt" | "filename" | "size">("createdAt");
    const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [selectedDelete, setSelectedDelete] = useState<Backup | null>(null);
    const [selectedRestore, setSelectedRestore] = useState<Backup | null>(null);
    const [downloadingFilename, setDownloadingFilename] = useState<string | null>(null);

    const { data, isLoading, isFetching, isError, error, refetch } = useBackups();
    const { mutate: createBackupMutate, isPending: isCreatingBackup } = useCreateBackup();
    const { mutate: restoreBackupMutate, isPending: isRestoringBackup } = useRestoreBackup();
    const { mutate: deleteBackupMutate, isPending: isDeletingBackup } = useDeleteBackup();

    const backups = data?.data ?? [];

    const filteredSortedBackups = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        const filtered = backups.filter((backup) => {
            const matchSearch =
                keyword.length === 0 ||
                backup.filename.toLowerCase().includes(keyword);

            const matchStatus = statusFilter === "all" || backup.status === statusFilter;

            return matchSearch && matchStatus;
        });

        const sorted = [...filtered].sort((a, b) => {
            let compare = 0;

            if (sortBy === "filename") {
                compare = a.filename.localeCompare(b.filename);
            }

            if (sortBy === "size") {
                compare = a.size - b.size;
            }

            if (sortBy === "createdAt") {
                compare = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }

            return sortOrder === "ASC" ? compare : -compare;
        });

        return sorted;
    }, [backups, search, sortBy, sortOrder, statusFilter]);

    const totalItems = filteredSortedBackups.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    const pagedBackups = useMemo(() => {
        const startIndex = (page - 1) * pageSize;
        return filteredSortedBackups.slice(startIndex, startIndex + pageSize);
    }, [filteredSortedBackups, page, pageSize]);

    const resetToFirstPage = () => setPage(1);

    const handleCreateBackup = () => {
        createBackupMutate(undefined, {
            onSuccess: () => {
                toast.success("Đã tạo bản sao lưu thành công.");
            },
            onError: (createError) => {
                toast.error(`Tạo bản sao lưu thất bại: ${createError.message}`);
            },
        });
    };

    const handleRestore = () => {
        if (!selectedRestore) {
            return;
        }

        restoreBackupMutate(
            { filename: selectedRestore.filename },
            {
                onSuccess: () => {
                    toast.success(`Đã khôi phục từ ${selectedRestore.filename}.`);
                    setSelectedRestore(null);
                },
                onError: (restoreError) => {
                    toast.error(`Khôi phục thất bại: ${restoreError.message}`);
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
        <div className="space-y-4 w-full">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Sao lưu & Khôi phục</h1>
                    <p className="text-sm text-muted-foreground">
                        Quản lý bản sao lưu cơ sở dữ liệu, tải xuống hoặc khôi phục khi cần.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void refetch()}
                        disabled={isFetching || isCreatingBackup || isRestoringBackup || isDeletingBackup}
                    >
                        <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
                        Làm mới
                    </Button>
                    <Button
                        size="sm"
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

            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <Input
                    placeholder="Tìm theo tên file..."
                    value={search}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        resetToFirstPage();
                    }}
                />

                <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                        setStatusFilter(value as BackupStatus | "all");
                        resetToFirstPage();
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="success">Thành công</SelectItem>
                        <SelectItem value="error">Lỗi</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={sortBy}
                    onValueChange={(value) => {
                        setSortBy(value as "createdAt" | "filename" | "size");
                        resetToFirstPage();
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Sắp xếp theo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="createdAt">Ngày tạo</SelectItem>
                        <SelectItem value="filename">Tên file</SelectItem>
                        <SelectItem value="size">Dung lượng</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex gap-2">
                    <Select
                        value={sortOrder}
                        onValueChange={(value) => {
                            setSortOrder(value as "ASC" | "DESC");
                            resetToFirstPage();
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Thứ tự" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="DESC">Giảm dần</SelectItem>
                            <SelectItem value="ASC">Tăng dần</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={`${pageSize}`}
                        onValueChange={(value) => {
                            setPageSize(Number(value));
                            resetToFirstPage();
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Số dòng" />
                        </SelectTrigger>
                        <SelectContent>
                            {PAGE_SIZES.map((size) => (
                                <SelectItem key={size} value={`${size}`}>
                                    {size} / trang
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
                    <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                    Đang tải dữ liệu sao lưu...
                </div>
            ) : isError ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    Không thể tải dữ liệu sao lưu: {error?.message || "Đã có lỗi xảy ra."}
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="overflow-hidden rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tên file</TableHead>
                                    <TableHead>Dung lượng</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pagedBackups.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Không có bản sao lưu phù hợp.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pagedBackups.map((backup) => (
                                        <TableRow key={backup.filename}>
                                            <TableCell className="font-medium">{backup.filename}</TableCell>
                                            <TableCell>{formatBackupSize(backup.size)}</TableCell>
                                            <TableCell>{formatBackupDate(backup.createdAt)}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        backup.status === "success"
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {backup.status === "success" ? "Thành công" : "Lỗi"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
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
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                        <p className="text-sm text-muted-foreground">
                            Hiển thị {pagedBackups.length} / {totalItems} bản sao lưu
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((current) => Math.max(1, current - 1))}
                                disabled={page <= 1}
                            >
                                Trước
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Trang {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                disabled={page >= totalPages}
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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
                            Thao tác này sẽ ghi đè dữ liệu hiện tại bằng bản sao lưu
                            {" "}
                            <span className="font-medium">{selectedRestore?.filename}</span>.
                            Bạn chỉ nên thực hiện khi đã hiểu rõ rủi ro mất dữ liệu hiện tại.
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
                            Bản sao lưu
                            {" "}
                            <span className="font-medium">{selectedDelete?.filename}</span>
                            {" "}
                            sẽ bị xóa vĩnh viễn khỏi hệ thống lưu trữ.
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
