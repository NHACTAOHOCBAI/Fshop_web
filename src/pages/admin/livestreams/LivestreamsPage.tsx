import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { BarChart2, Loader2, Play, Plus, Radio, Search, Square, Tv } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Checkbox } from "@/components/ui/checkbox";
import {
    useCreateLivestream,
    useEndLivestream,
    useLivestreams,
    useStartLivestream,
    useUpdateLivestream,
} from "@/hooks/useLivestreams";
import type {
    CreateLivestreamPayload,
    Livestream,
    LivestreamStatus,
    UpdateLivestreamPayload,
} from "@/types/livestream";

const statusStyles: Record<LivestreamStatus, string> = {
    scheduled: "bg-amber-50 text-amber-700 border border-amber-200",
    live: "bg-red-50 text-red-700 border border-red-200",
    ended: "bg-slate-50 text-slate-700 border border-slate-200",
};

const statusLabels: Record<LivestreamStatus | "all", string> = {
    all: "Tất cả",
    scheduled: "Chưa diễn ra",
    live: "Đang phát",
    ended: "Đã kết thúc",
};

const LivestreamForm = ({
    mode,
    initial,
    onSubmit,
    loading,
}: {
    mode: "create" | "update";
    initial?: Livestream;
    onSubmit: (payload: CreateLivestreamPayload | UpdateLivestreamPayload) => void;
    loading: boolean;
}) => {
    const [title, setTitle] = useState(initial?.title ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [scheduledStartAt, setScheduledStartAt] = useState<Date | undefined>(
        initial?.scheduledStartAt ? new Date(initial.scheduledStartAt) : undefined
    );
    const [coverImage, setCoverImage] = useState<File | undefined>();
    const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);

    const isNotScheduled = initial && initial.status !== "scheduled";
    const canSubmit = title.trim().length > 0 && (mode === "update" || !!scheduledStartAt);

    const handleSubmit = () => {
        if (!canSubmit) {
            toast.error("Vui lòng nhập đủ thông tin bắt buộc.");
            return;
        }

        if (mode === "create") {
            onSubmit({
                title: title.trim(),
                description: description.trim() || undefined,
                scheduledStartAt: scheduledStartAt!.toISOString(),
                coverImage,
            });
            return;
        }

        onSubmit({
            title: title.trim(),
            description: description.trim() || undefined,
            scheduledStartAt: isNotScheduled ? undefined : (scheduledStartAt ? scheduledStartAt.toISOString() : undefined),
            coverImage,
            isActive,
        });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <p className="text-sm font-medium text-slate-800">Tiêu đề livestream</p>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Flash Sale cuối tuần" />
            </div>

            <div className="space-y-1.5">
                <p className="text-sm font-medium text-slate-800">Mô tả</p>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Nội dung livestream, ưu đãi nổi bật..."
                    rows={3}
                />
            </div>

            <div className="space-y-1.5 flex flex-col">
                <p className="text-sm font-medium text-slate-800 mb-0.5">Thời gian dự kiến</p>
                <DateTimePicker
                    value={scheduledStartAt}
                    onChange={(value) => setScheduledStartAt(value || undefined)}
                    placeholder="Chọn thời gian bắt đầu"
                    disabled={isNotScheduled}
                />
            </div>

            <div className="space-y-1.5">
                <p className="text-sm font-medium text-slate-800">Cover image</p>
                <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverImage(e.target.files?.[0])}
                />
            </div>

            {mode === "update" && (
                <div className="flex items-center gap-2 pt-2">
                    <Checkbox
                        id="isActive"
                        checked={isActive}
                        onCheckedChange={(checked) => setIsActive(checked === true)}
                    />
                    <label
                        htmlFor="isActive"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-800 cursor-pointer"
                    >
                        Kích hoạt hiển thị (isActive)
                    </label>
                </div>
            )}

            <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={loading || !canSubmit}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                    {mode === "create" ? "Tạo livestream" : "Lưu cập nhật"}
                </Button>
            </div>
        </div>
    );
};



const LivestreamsPage = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState<LivestreamStatus | "all">("all");
    const [search, setSearch] = useState("");
    const [openCreate, setOpenCreate] = useState(false);
    const [editing, setEditing] = useState<Livestream | null>(null);

    const livestreamsQuery = useLivestreams({
        page,
        limit: 8,
        search: search.trim() || undefined,
        status: status === "all" ? undefined : status,
        sortBy: "createdAt",
        sortOrder: "DESC",
    });

    const createMutation = useCreateLivestream();
    const updateMutation = useUpdateLivestream();
    const startMutation = useStartLivestream();
    const endMutation = useEndLivestream();

    const livestreams = livestreamsQuery.data?.data ?? [];
    const total = livestreamsQuery.data?.meta?.pagination?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / 8));

    const statusCounters = useMemo(() => {
        return livestreams.reduce(
            (acc, item) => {
                acc[item.status] += 1;
                return acc;
            },
            { scheduled: 0, live: 0, ended: 0 },
        );
    }, [livestreams]);

    const handleCreate = (payload: CreateLivestreamPayload | UpdateLivestreamPayload) => {
        createMutation.mutate(payload as CreateLivestreamPayload, {
            onSuccess: () => {
                toast.success("Đã tạo livestream thành công");
                setOpenCreate(false);
            },
            onError: (error) => toast.error(error.message),
        });
    };

    const handleUpdate = (payload: CreateLivestreamPayload | UpdateLivestreamPayload) => {
        if (!editing) return;
        updateMutation.mutate(
            { id: editing.id, payload },
            {
                onSuccess: () => {
                    toast.success("Đã cập nhật livestream");
                    setEditing(null);
                },
                onError: (error) => toast.error(error.message),
            },
        );
    };

    const handleGoLive = (id: number) => {
        startMutation.mutate(id, {
            onSuccess: () => toast.success("Livestream đã bắt đầu"),
            onError: (error) => toast.error(error.message),
        });
    };

    const handleEnd = (id: number) => {
        endMutation.mutate(id, {
            onSuccess: () => toast.success("Livestream đã kết thúc"),
            onError: (error) => toast.error(error.message),
        });
    };

    return (
        <div className="space-y-6 w-full">
            {/* Flat Header section - matching other admin pages */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Livestreams</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Quản lý các phiên livestream, lên lịch phát sóng, ghim sản phẩm nổi bật và theo dõi tương tác trực tiếp của người xem.
                    </p>
                </div>
                <Button variant="outline" size="sm" className="h-8 md:self-end" onClick={() => setOpenCreate(true)}>
                    <Plus className="size-4 mr-1" />
                    Tạo livestream mới
                </Button>
            </div>

            {/* KPI Cards Grid - flat, modern, hover transition */}
            <div className="grid gap-4 sm:grid-cols-3">
                {/* Scheduled */}
                <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
                    <div className="mb-5 flex items-start justify-between">
                        <span className="text-sm font-medium text-slate-500">Chưa diễn ra (Scheduled)</span>
                        <div className="rounded-xl bg-slate-900 p-2 text-white transition-colors group-hover:bg-amber-500">
                            <Radio className="size-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{statusCounters.scheduled}</p>
                </article>

                {/* Live */}
                <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
                    <div className="mb-5 flex items-start justify-between">
                        <span className="text-sm font-medium text-slate-500">Đang phát (Live)</span>
                        <div className="rounded-xl bg-slate-900 p-2 text-white transition-colors group-hover:bg-red-500">
                            <Play className="size-4 animate-pulse" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{statusCounters.live}</p>
                </article>

                {/* Ended */}
                <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
                    <div className="mb-5 flex items-start justify-between">
                        <span className="text-sm font-medium text-slate-500">Đã kết thúc (Ended)</span>
                        <div className="rounded-xl bg-slate-900 p-2 text-white transition-colors group-hover:bg-sky-500">
                            <BarChart2 className="size-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{statusCounters.ended}</p>
                </article>
            </div>

            {/* Split Grid Layout */}
            <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {/* Main Content Area */}
                <div className="lg:col-span-2 xl:col-span-3 space-y-4">
                    {/* Toolbar section */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 md:flex-row md:items-center md:justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm theo tiêu đề livestream..."
                                className="pl-8 h-9"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(["all", "scheduled", "live", "ended"] as const).map((item) => (
                                <Button
                                    key={item}
                                    variant={status === item ? "default" : "outline"}
                                    size="sm"
                                    className="h-8 text-xs font-semibold px-3"
                                    onClick={() => {
                                        setStatus(item);
                                        setPage(1);
                                    }}
                                >
                                    {statusLabels[item]}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Livestream List */}
                    {livestreamsQuery.isLoading ? (
                        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                            <Loader2 className="size-6 animate-spin text-slate-500" />
                        </div>
                    ) : livestreams.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 text-sm">
                            Không có livestream nào phù hợp.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {livestreams.map((item) => (
                                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-slate-300">
                                    <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                                        <div className="space-y-2 min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyles[item.status]}`}>
                                                    {statusLabels[item.status].toUpperCase()}
                                                </span>
                                                <span className="text-xs text-slate-400 font-mono">#{item.id}</span>
                                            </div>
                                            <h3 className="text-base font-semibold text-slate-900 truncate">{item.title}</h3>
                                            <p className="text-xs text-slate-500 line-clamp-2">{item.description || "Không có mô tả"}</p>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-1">
                                                <span className="flex items-center gap-1">
                                                    <span className="font-semibold text-slate-700">Lên lịch:</span> {new Date(item.scheduledStartAt).toLocaleString("vi-VN")}
                                                </span>
                                                {item.startedAt && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="font-semibold text-slate-700">Bắt đầu:</span> {new Date(item.startedAt).toLocaleString("vi-VN")}
                                                    </span>
                                                )}
                                                {item.endedAt && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="font-semibold text-slate-700">Kết thúc:</span> {new Date(item.endedAt).toLocaleString("vi-VN")}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <span className="font-semibold text-slate-700">Người xem:</span> {item.viewerCount}
                                                </span>
                                                <span className="flex items-center gap-1 font-mono text-[11px]">
                                                    <span className="font-semibold text-slate-700 font-sans">Kênh:</span> {item.agoraChannel}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5 shrink-0 md:self-center">
                                            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate(`/admin/livestreams/${item.id}`)}>
                                                <Tv className="size-3.5 mr-1" />
                                                Quản lý
                                            </Button>
                                            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setEditing(item)}>
                                                Chỉnh sửa
                                            </Button>
                                            {item.status === "ended" ? (
                                                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => navigate(`/admin/livestreams/${item.id}/summary`)}>
                                                    <BarChart2 className="size-3.5 mr-1" />
                                                    Tổng kết
                                                </Button>
                                            ) : item.status !== "live" ? (
                                                <Button size="sm" className="h-8 text-xs" onClick={() => handleGoLive(item.id)}>
                                                    <Play className="size-3.5 mr-1 fill-current" />
                                                    Go Live
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => handleEnd(item.id)}>
                                                    <Square className="size-3.5 mr-1" />
                                                    End
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <Button variant="outline" size="sm" className="h-8" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                            Trước
                        </Button>
                        <span className="text-xs text-slate-500 font-medium">Trang {page} / {totalPages}</span>
                        <Button variant="outline" size="sm" className="h-8" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                            Sau
                        </Button>
                    </div>
                </div>

                {/* Sidebar Guidelines Widget Area */}
                <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200/80 bg-white p-5">
                        <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2 mb-3">
                            <Tv className="size-4 text-primary" /> Hướng dẫn vận hành
                        </h3>
                        <ul className="text-xs space-y-3 text-slate-600 list-disc list-inside">
                            <li><strong>Lên lịch:</strong> Tạo phiên livestream và gán thời gian dự kiến phát sóng.</li>
                            <li><strong>Phát sóng:</strong> Nhấn nút <strong>Quản lý</strong> trên phiên live để truy cập vào bảng phát sóng riêng, kết nối camera và trò chuyện thời gian thực với khách hàng.</li>
                            <li><strong>Bật Live:</strong> Khởi động buổi phát từ bảng điều khiển để người dùng có thể bắt đầu xem trên giao diện mua sắm.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tạo livestream mới</DialogTitle>
                    </DialogHeader>
                    <LivestreamForm mode="create" onSubmit={handleCreate} loading={createMutation.isPending} />
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cập nhật livestream</DialogTitle>
                    </DialogHeader>
                    {editing ? (
                        <LivestreamForm
                            mode="update"
                            initial={editing}
                            onSubmit={handleUpdate}
                            loading={updateMutation.isPending}
                        />
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
};
export default LivestreamsPage;
