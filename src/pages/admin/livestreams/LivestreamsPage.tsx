import { useMemo, useState } from "react";
import { Loader2, Play, Plus, Radio, Square, Tv } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    useCreateLivestream,
    useEndLivestream,
    useIssueLivestreamAgoraToken,
    useLivestreamById,
    useLivestreams,
    usePinLivestreamProduct,
    useStartLivestream,
    useUnpinLivestreamProduct,
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

const toLocalInputDateTime = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const toIsoDateTime = (value: string) => {
    const date = new Date(value);
    return date.toISOString();
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
    const [scheduledStartAt, setScheduledStartAt] = useState(
        toLocalInputDateTime(initial?.scheduledStartAt),
    );
    const [coverImage, setCoverImage] = useState<File | undefined>();

    const canSubmit = title.trim().length > 0 && (mode === "update" || scheduledStartAt.trim().length > 0);

    const handleSubmit = () => {
        if (!canSubmit) {
            toast.error("Vui lòng nhập đủ thông tin bắt buộc.");
            return;
        }

        if (mode === "create") {
            onSubmit({
                title: title.trim(),
                description: description.trim() || undefined,
                scheduledStartAt: toIsoDateTime(scheduledStartAt),
                coverImage,
            });
            return;
        }

        onSubmit({
            title: title.trim(),
            description: description.trim() || undefined,
            scheduledStartAt: scheduledStartAt.trim() ? toIsoDateTime(scheduledStartAt) : undefined,
            coverImage,
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

            <div className="space-y-1.5">
                <p className="text-sm font-medium text-slate-800">Thời gian dự kiến</p>
                <Input
                    type="datetime-local"
                    value={scheduledStartAt}
                    onChange={(e) => setScheduledStartAt(e.target.value)}
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
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState<LivestreamStatus | "all">("all");
    const [search, setSearch] = useState("");
    const [openCreate, setOpenCreate] = useState(false);
    const [editing, setEditing] = useState<Livestream | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [pinProductId, setPinProductId] = useState("");
    const [pinPosition, setPinPosition] = useState("0");

    const livestreamsQuery = useLivestreams({
        page,
        limit: 8,
        search: search.trim() || undefined,
        status: status === "all" ? undefined : status,
        sortBy: "createdAt",
        sortOrder: "DESC",
    });

    const selectedLivestreamQuery = useLivestreamById(selectedId, Boolean(selectedId));
    const createMutation = useCreateLivestream();
    const updateMutation = useUpdateLivestream();
    const startMutation = useStartLivestream();
    const endMutation = useEndLivestream();
    const pinMutation = usePinLivestreamProduct();
    const unpinMutation = useUnpinLivestreamProduct();
    const tokenMutation = useIssueLivestreamAgoraToken();

    const livestreams = livestreamsQuery.data?.data ?? [];
    const total = livestreamsQuery.data?.meta?.pagination?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / 8));

    const selectedDetail = selectedLivestreamQuery.data?.data;

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

    const handlePinProduct = () => {
        if (!selectedId) return;
        const productId = Number(pinProductId);
        const position = Number(pinPosition);

        if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(position) || position < 0) {
            toast.error("Vui lòng nhập Product ID và Position hợp lệ");
            return;
        }

        pinMutation.mutate(
            {
                id: selectedId,
                payload: { productId, position },
            },
            {
                onSuccess: () => {
                    toast.success("Đã ghim sản phẩm");
                    setPinProductId("");
                },
                onError: (error) => toast.error(error.message),
            },
        );
    };

    const handleIssueToken = (id: number) => {
        tokenMutation.mutate(id, {
            onSuccess: ({ data }) => {
                toast.success(`Token ready: ${data.channel} (${data.role})`);
            },
            onError: (error) => toast.error(error.message),
        });
    };

    return (
        <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-900 p-6 text-white">
                <div className="absolute -right-14 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                            <Radio className="size-3.5" />
                            Livestream Control Center
                        </p>
                        <h1 className="mt-3 text-2xl font-bold">Quản trị livestream thời trang</h1>
                        <p className="mt-1 text-sm text-slate-200">Tạo lịch live, bật live tức thì, ghim sản phẩm và theo dõi phiên đang chạy.</p>
                    </div>

                    <Button className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => setOpenCreate(true)}>
                        <Plus className="size-4" />
                        Tạo livestream mới
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Scheduled</p>
                    <p className="mt-2 text-2xl font-bold text-amber-900">{statusCounters.scheduled}</p>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Live</p>
                    <p className="mt-2 text-2xl font-bold text-red-900">{statusCounters.live}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">Ended</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{statusCounters.ended}</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                <section className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo tiêu đề livestream..."
                            className="max-w-md"
                        />
                        <div className="flex gap-2">
                            {(["all", "scheduled", "live", "ended"] as const).map((item) => (
                                <Button
                                    key={item}
                                    variant={status === item ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                        setStatus(item);
                                        setPage(1);
                                    }}
                                >
                                    {item === "all" ? "Tất cả" : item.toUpperCase()}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {livestreamsQuery.isLoading ? (
                        <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                            <Loader2 className="size-6 animate-spin text-slate-500" />
                        </div>
                    ) : livestreams.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                            Không có livestream nào phù hợp.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {livestreams.map((item) => (
                                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>
                                                    {item.status.toUpperCase()}
                                                </span>
                                                <span className="text-xs text-slate-500">#{item.id}</span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                                            <p className="text-sm text-slate-500">{item.description || "Không có mô tả"}</p>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                                                <span>Lên lịch: {new Date(item.scheduledStartAt).toLocaleString("vi-VN")}</span>
                                                <span>Viewers: {item.viewerCount}</span>
                                                <span>Channel: {item.agoraChannel}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setSelectedId(item.id)}>
                                                <Tv className="size-4" />
                                                Quản lý
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => setEditing(item)}>
                                                Chỉnh sửa
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleIssueToken(item.id)}>
                                                Token
                                            </Button>
                                            {item.status !== "live" ? (
                                                <Button size="sm" onClick={() => handleGoLive(item.id)}>
                                                    <Play className="size-4" />
                                                    Go Live
                                                </Button>
                                            ) : (
                                                <Button size="sm" variant="destructive" onClick={() => handleEnd(item.id)}>
                                                    <Square className="size-4" />
                                                    End
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-center gap-3">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                            Trước
                        </Button>
                        <span className="text-sm text-slate-600">Trang {page} / {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                            Sau
                        </Button>
                    </div>
                </section>

                <aside className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-semibold text-slate-900">Bảng điều khiển phiên live</p>
                        {!selectedId ? (
                            <p className="mt-2 text-sm text-slate-500">Chọn một livestream để quản lý sản phẩm ghim.</p>
                        ) : selectedLivestreamQuery.isLoading ? (
                            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                                <Loader2 className="size-4 animate-spin" />
                                Đang tải chi tiết...
                            </div>
                        ) : !selectedDetail ? (
                            <p className="mt-2 text-sm text-slate-500">Không tải được dữ liệu livestream.</p>
                        ) : (
                            <div className="mt-3 space-y-3">
                                <div className="rounded-xl bg-slate-50 p-3">
                                    <p className="text-sm font-medium text-slate-800">{selectedDetail.title}</p>
                                    <p className="text-xs text-slate-500">Status: {selectedDetail.status.toUpperCase()}</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Pin sản phẩm mới</p>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <Input
                                            value={pinProductId}
                                            onChange={(e) => setPinProductId(e.target.value)}
                                            placeholder="Product ID"
                                        />
                                        <Input
                                            value={pinPosition}
                                            onChange={(e) => setPinPosition(e.target.value)}
                                            placeholder="Position"
                                        />
                                    </div>
                                    <Button size="sm" className="w-full" onClick={handlePinProduct}>
                                        Ghim sản phẩm
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Sản phẩm đang ghim</p>
                                    {selectedDetail.pinnedProducts.length === 0 ? (
                                        <p className="text-sm text-slate-500">Chưa có sản phẩm nào.</p>
                                    ) : (
                                        selectedDetail.pinnedProducts
                                            .slice()
                                            .sort((a, b) => a.position - b.position)
                                            .map((product) => (
                                                <div key={product.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2.5">
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-800">#{product.productId}</p>
                                                        <p className="text-xs text-slate-500">Vị trí: {product.position}</p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => unpinMutation.mutate({ id: selectedDetail.id, productId: product.productId })}
                                                    >
                                                        Bỏ ghim
                                                    </Button>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
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

