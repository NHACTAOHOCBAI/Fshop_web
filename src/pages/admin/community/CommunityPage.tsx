import {
    BookOpen,
    Eye,
    EyeOff,
    Grid,
    Heart,
    List,
    MessageSquare,
    TrendingUp,
    User,
    Users,
    X
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import PostCard from "@/components/posts/PostCard.tsx";
import PostDetailPage from "@/pages/shop/community/PostDetailPage";
import CrudTable from "@/components/crud_table/crud-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminPosts, useUpdatePostStatus } from "@/hooks/usePosts";
import { formatDateTime } from "@/lib/utils";
import type { Post } from "@/types/post";

type StatusFilter = "all" | "active" | "inactive";
type ViewMode = "table" | "card";

const AdminCommunityPage = () => {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>("table");
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [postToToggle, setPostToToggle] = useState<Post | null>(null);

    const { mutate: updatePostStatus, isPending: isUpdatingStatus } = useUpdatePostStatus();

    // Query wrapper matching useTable QueryParams signature
    const useQueryWrapper = useCallback(
        (queryParams: any) => {
            return useAdminPosts(
                {
                    ...queryParams,
                    hashtag: selectedHashtag || undefined,
                },
                statusFilter
            );
        },
        [statusFilter, selectedHashtag]
    );

    // Fetch all posts (up to 1000) for client-side KPI and sidebar aggregation
    const allPostsQuery = useAdminPosts({ limit: 1000 }, "all");
    const allPosts = allPostsQuery.data?.data ?? [];

    const handleToggleStatus = useCallback(() => {
        if (!postToToggle) {
            return;
        }

        updatePostStatus(
            { id: postToToggle.id, isActive: !postToToggle.isActive },
            {
                onSuccess: () => {
                    toast.success(postToToggle.isActive ? "Đã ẩn bài viết." : "Đã khôi phục bài viết.");
                    setPostToToggle(null);
                    void allPostsQuery.refetch();
                },
                onError: (mutationError) => {
                    toast.error(
                        mutationError instanceof Error ? mutationError.message : "Không thể cập nhật trạng thái bài viết."
                    );
                },
            }
        );
    }, [postToToggle, allPostsQuery, updatePostStatus]);

    // KPI Metrics calculation
    const kpiMetrics = useMemo(() => {
        const totalPosts = allPosts.length;
        const activePosts = allPosts.filter((p) => p.isActive).length;
        const inactivePosts = allPosts.filter((p) => !p.isActive).length;
        const totalInteractions = allPosts.reduce(
            (acc, p) => acc + (p.totalLikes || 0) + (p.totalComments || 0),
            0
        );

        return {
            totalPosts,
            activePosts,
            inactivePosts,
            totalInteractions,
        };
    }, [allPosts]);

    // Sidebar aggregation: Popular Hashtags
    const trendingHashtags = useMemo(() => {
        const counts: Record<string, number> = {};
        allPosts.forEach((post) => {
            post.postHashtags?.forEach((ph) => {
                const name = ph.hashtag?.name;
                if (name) {
                    counts[name] = (counts[name] || 0) + 1;
                }
            });
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }, [allPosts]);

    // Sidebar aggregation: Top Contributors
    const topPosters = useMemo(() => {
        const contributors: Record<number, { user: Post["user"]; count: number }> = {};
        allPosts.forEach((post) => {
            const user = post.user;
            if (user) {
                if (!contributors[user.id]) {
                    contributors[user.id] = { user, count: 0 };
                }
                contributors[user.id].count += 1;
            }
        });
        return Object.values(contributors)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [allPosts]);

    // React Table column definitions
    const columns = useMemo<ColumnDef<Post>[]>(
        () => [
            {
                accessorKey: "user",
                header: "Người đăng",
                cell: ({ row }) => {
                    const post = row.original;
                    return (
                        <div className="flex items-center gap-2.5">
                            {post.user?.avatar ? (
                                <img
                                    src={post.user.avatar}
                                    className="size-8 rounded-full object-cover border border-slate-100 shrink-0"
                                    alt={post.user.fullName}
                                />
                            ) : (
                                <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shrink-0">
                                    <User className="size-4" />
                                </div>
                            )}
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-semibold text-slate-900 truncate">
                                    {post.user?.fullName}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate">
                                    {post.user?.email}
                                </span>
                            </div>
                        </div>
                    );
                },
            },
            {
                accessorKey: "content",
                header: "Nội dung",
                cell: ({ row }) => {
                    const post = row.original;
                    return (
                        <div className="flex items-center gap-2">
                            {post.images && post.images.length > 0 && (
                                <img
                                    src={post.images[0].imageUrl}
                                    className="size-8 rounded-md object-cover border border-slate-100 shrink-0"
                                    alt=""
                                />
                            )}
                            <div className="flex flex-col min-w-0">
                                <p className="text-xs text-slate-700 line-clamp-2 max-w-[280px] md:max-w-[360px]">
                                    {post.content || (
                                        <span className="text-slate-400 italic">Không có nội dung chữ</span>
                                    )}
                                </p>
                                {post.postHashtags && post.postHashtags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {post.postHashtags.slice(0, 3).map((ph) => (
                                            <span
                                                key={ph.id}
                                                className="text-[9px] text-app-primary font-medium"
                                            >
                                                #{ph.hashtag?.name}
                                            </span>
                                        ))}
                                        {post.postHashtags.length > 3 && (
                                            <span className="text-[9px] text-slate-400">
                                                +{post.postHashtags.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: "interactions",
                header: "Tương tác",
                cell: ({ row }) => {
                    const post = row.original;
                    return (
                        <div className="flex flex-col text-[11px] text-slate-600 gap-0.5">
                            <span className="inline-flex items-center gap-1">
                                <Heart className="size-3 text-rose-500 fill-rose-500" />{" "}
                                {post.totalLikes}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <MessageSquare className="size-3 text-blue-500" />{" "}
                                {post.totalComments}
                            </span>
                        </div>
                    );
                },
            },
            {
                accessorKey: "createdAt",
                header: ({ column }) => <DataTableColumnHeader column={column} title="Ngày tạo" />,
                cell: ({ row }) => (
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(row.original.createdAt)}
                    </span>
                ),
            },
            {
                accessorKey: "isActive",
                header: "Trạng thái",
                cell: ({ row }) => {
                    const post = row.original;
                    return (
                        <Badge
                            variant={post.isActive ? "default" : "destructive"}
                            className="text-[10px] px-2 py-0.5 font-medium whitespace-nowrap"
                        >
                            {post.isActive ? "Đang hiện" : "Đã ẩn"}
                        </Badge>
                    );
                },
            },
            {
                id: "actions",
                header: () => <div className="text-right pr-4">Hành động</div>,
                cell: ({ row }) => {
                    const post = row.original;
                    return (
                        <div className="flex items-center justify-end gap-1.5 pr-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => setSelectedPost(post)}
                            >
                                Xem
                            </Button>
                            <Button
                                size="sm"
                                className="h-7 px-2 text-xs"
                                variant={post.isActive ? "destructive" : "outline"}
                                onClick={() => setPostToToggle(post)}
                                disabled={isUpdatingStatus}
                            >
                                {post.isActive ? (
                                    <EyeOff className="size-3 mr-1" />
                                ) : (
                                    <Eye className="size-3 mr-1" />
                                )}
                                {post.isActive ? "Ẩn" : "Hiện"}
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [isUpdatingStatus]
    );

    // Filter elements rendered on the left of toolbar, next to search input
    const filterElement = useMemo(
        () => (
            <div className="flex items-center gap-2">
                <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                >
                    <SelectTrigger className="w-40 h-8">
                        <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="active">Đang hiển thị</SelectItem>
                        <SelectItem value="inactive">Đã ẩn</SelectItem>
                    </SelectContent>
                </Select>

                {selectedHashtag && (
                    <Badge variant="secondary" className="h-8 gap-1 pl-2.5 pr-1.5 text-xs">
                        Hashtag: #{selectedHashtag}
                        <button
                            type="button"
                            onClick={() => setSelectedHashtag(null)}
                            className="rounded-full outline-none hover:bg-slate-200 p-0.5 shrink-0 ml-1"
                        >
                            <X className="size-3 text-slate-500" />
                        </button>
                    </Badge>
                )}
            </div>
        ),
        [statusFilter, selectedHashtag]
    );

    const renderCardView = useCallback(
        (data: Post[]) => (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {data.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        disableLink
                        showOwnerActions={false}
                        compact
                        className="w-full min-w-0"
                        rightActions={
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2.5 text-xs"
                                    onClick={() => setSelectedPost(post)}
                                >
                                    Xem
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-7 px-2.5 text-xs"
                                    variant={post.isActive ? "destructive" : "outline"}
                                    onClick={() => setPostToToggle(post)}
                                    disabled={isUpdatingStatus}
                                >
                                    {post.isActive ? (
                                        <EyeOff className="size-3 mr-1" />
                                    ) : (
                                        <Eye className="size-3 mr-1" />
                                    )}
                                    {post.isActive ? "Ẩn" : "Hiện"}
                                </Button>
                            </div>
                        }
                    />
                ))}
            </div>
        ),
        [isUpdatingStatus]
    );

    return (
        <div className="space-y-4 w-full">
            {/* Header section (flat, matches brand management) */}
            <div>
                <h1 className="text-2xl font-semibold">Cộng đồng</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Quản lý bài viết bằng dạng card giống trang cộng đồng bên client, đồng thời ẩn hoặc khôi phục khi cần.
                </p>
            </div>

            {/* KPI Cards Grid (flat, no shadow) */}
            <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
                    <div className="mb-5 flex items-start justify-between">
                        <span className="text-sm font-medium text-slate-500">Tổng bài viết</span>
                        <div className="rounded-xl bg-slate-900 p-2 text-white transition-colors group-hover:bg-sky-500">
                            <MessageSquare className="size-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                        {allPostsQuery.isLoading ? "..." : kpiMetrics.totalPosts}
                    </p>
                </article>

                <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
                    <div className="mb-5 flex items-start justify-between">
                        <span className="text-sm font-medium text-slate-500">Đang hiển thị</span>
                        <div className="rounded-xl bg-slate-900 p-2 text-white transition-colors group-hover:bg-sky-500">
                            <Eye className="size-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                        {allPostsQuery.isLoading ? "..." : kpiMetrics.activePosts}
                    </p>
                </article>

                <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
                    <div className="mb-5 flex items-start justify-between">
                        <span className="text-sm font-medium text-slate-500">Đã ẩn</span>
                        <div className="rounded-xl bg-slate-900 p-2 text-white transition-colors group-hover:bg-sky-500">
                            <EyeOff className="size-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                        {allPostsQuery.isLoading ? "..." : kpiMetrics.inactivePosts}
                    </p>
                </article>

                <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5">
                    <div className="mb-5 flex items-start justify-between">
                        <span className="text-sm font-medium text-slate-500">Tổng tương tác</span>
                        <div className="rounded-xl bg-slate-900 p-2 text-white transition-colors group-hover:bg-sky-500">
                            <Heart className="size-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                        {allPostsQuery.isLoading ? "..." : kpiMetrics.totalInteractions.toLocaleString()}
                    </p>
                </article>
            </section>

            {/* Split Grid Layout */}
            <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {/* Main Content Area */}
                <div className="lg:col-span-2 xl:col-span-3 space-y-4">
                    <CrudTable<Post>
                        columns={columns}
                        useQuery={useQueryWrapper}
                        filterPlaceholder="Tìm kiếm bài viết..."
                        dependencies={[statusFilter, selectedHashtag]}
                        filterElement={filterElement}
                        renderCustomView={viewMode === "card" ? renderCardView : undefined}
                    >
                        {/* Right side items in the CrudTable filter row */}
                        <div className="flex items-center gap-2">
                            <Tabs
                                value={viewMode}
                                onValueChange={(val) => setViewMode(val as ViewMode)}
                                className="h-8"
                            >
                                <TabsList className="h-8">
                                    <TabsTrigger value="table" className="h-7">
                                        <List className="size-4 mr-1" /> Bảng
                                    </TabsTrigger>
                                    <TabsTrigger value="card" className="h-7">
                                        <Grid className="size-4 mr-1" /> Thẻ
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CrudTable>
                </div>

                {/* Sidebar Widget Area (flat, no shadow) */}
                <div className="space-y-4 pt-4 lg:pt-14">
                    {/* Hashtags aggregation widget */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-5">
                        <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2 mb-3">
                            <TrendingUp className="size-4 text-primary" /> Hashtag phổ biến
                        </h3>

                        {selectedHashtag && (
                            <div className="mb-3 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-1.5">
                                <span className="text-xs text-blue-700 font-semibold truncate">
                                    Lọc: #{selectedHashtag}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedHashtag(null)}
                                    className="text-blue-500 hover:text-blue-700 text-xs font-medium shrink-0 ml-2"
                                >
                                    Xóa
                                </button>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-1.5">
                            {allPostsQuery.isLoading ? (
                                <div className="space-y-1.5 w-full">
                                    <div className="h-6 bg-slate-100 rounded-full w-20 animate-pulse inline-block mr-1.5" />
                                    <div className="h-6 bg-slate-100 rounded-full w-24 animate-pulse inline-block mr-1.5" />
                                    <div className="h-6 bg-slate-100 rounded-full w-16 animate-pulse inline-block mr-1.5" />
                                </div>
                            ) : trendingHashtags.length === 0 ? (
                                <p className="text-xs text-slate-400 py-1">Không có hashtag nào</p>
                            ) : (
                                trendingHashtags.map((tag) => {
                                    const isSelected = selectedHashtag === tag.name;
                                    return (
                                        <button
                                            key={tag.name}
                                            type="button"
                                            onClick={() => setSelectedHashtag(isSelected ? null : tag.name)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                                                isSelected
                                                    ? "bg-primary text-primary-foreground border-transparent"
                                                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                                            }`}
                                        >
                                            #{tag.name}
                                            <span
                                                className={`text-[9px] ${
                                                    isSelected ? "text-primary-foreground/85" : "text-slate-400"
                                                }`}
                                            >
                                                ({tag.count})
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Top Contributors aggregation widget */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-5">
                        <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2 mb-3">
                            <Users className="size-4 text-primary" /> Thành viên tích cực
                        </h3>

                        <div className="space-y-3">
                            {allPostsQuery.isLoading ? (
                                Array.from({ length: 3 }).map((_, idx) => (
                                    <div key={idx} className="flex items-center gap-2 py-1">
                                        <div className="size-7 rounded-full bg-slate-100 animate-pulse shrink-0" />
                                        <div className="space-y-1 w-full">
                                            <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse" />
                                            <div className="h-2 bg-slate-100 rounded w-1/2 animate-pulse" />
                                        </div>
                                    </div>
                                ))
                            ) : topPosters.length === 0 ? (
                                <p className="text-xs text-slate-400 py-1">Chưa có bài đăng nào</p>
                            ) : (
                                topPosters.map(({ user, count }) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between border-b border-slate-50 pb-2.5 last:border-0 last:pb-0"
                                    >
                                        <Link
                                            to={`/admin/community/user/${user.id}`}
                                            className="flex items-center gap-2 min-w-0 hover:opacity-80 group cursor-pointer"
                                        >
                                            {user.avatar ? (
                                                <img
                                                    src={user.avatar}
                                                    className="size-7 rounded-full object-cover shrink-0 border border-slate-100"
                                                    alt=""
                                                />
                                            ) : (
                                                <div className="size-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                                                    <User className="size-3.5" />
                                                </div>
                                            )}
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-primary transition-colors">
                                                    {user.fullName}
                                                </span>
                                                <span className="text-[9px] text-slate-400 truncate">
                                                    {user.email}
                                                </span>
                                            </div>
                                        </Link>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-600 whitespace-nowrap ml-2 shrink-0">
                                            {count} bài
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Moderation instructions block */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-5">
                        <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2 mb-3">
                            <BookOpen className="size-4 text-primary" /> Quy tắc kiểm duyệt
                        </h3>
                        <ul className="text-xs space-y-2 text-slate-600 list-disc list-inside">
                            <li>Ẩn ngay các bài viết vi phạm chuẩn mực văn hóa hoặc quảng cáo rác.</li>
                            <li>Khôi phục bài viết bị ẩn nhầm khi người dùng kiến nghị hợp lệ.</li>
                            <li>Chỉ xóa hoàn toàn bài viết qua trang chi tiết nếu vi phạm luật pháp.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Post Detail Dialog */}
            <Dialog
                open={Boolean(selectedPost)}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedPost(null);
                    }
                }}
            >
                <DialogContent className="max-h-[92vh] overflow-hidden p-4 sm:max-w-5xl [&>button]:hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Chi tiết bài viết cộng đồng</DialogTitle>
                    </DialogHeader>
                    {selectedPost ? (
                        <PostDetailPage
                            isModal
                            postId={selectedPost.id}
                            allowAdminDelete
                            onClose={() => setSelectedPost(null)}
                        />
                    ) : null}
                </DialogContent>
            </Dialog>

            {/* Toggle Status Confirmation Dialog */}
            <Dialog
                open={Boolean(postToToggle)}
                onOpenChange={(open) => {
                    if (!open) {
                        setPostToToggle(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {postToToggle?.isActive ? "Ẩn bài viết" : "Khôi phục bài viết"}
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        {postToToggle?.isActive
                            ? "Bài viết này sẽ bị ẩn khỏi cộng đồng cho đến khi bạn khôi phục lại."
                            : "Bài viết này sẽ được hiển thị trở lại trong cộng đồng."}
                    </p>
                    <div className="mt-6 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPostToToggle(null)}
                            disabled={isUpdatingStatus}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleToggleStatus}
                            disabled={isUpdatingStatus}
                            variant={postToToggle?.isActive ? "destructive" : "default"}
                        >
                            {isUpdatingStatus
                                ? "Đang cập nhật..."
                                : postToToggle?.isActive
                                  ? "Xác nhận ẩn"
                                  : "Xác nhận khôi phục"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminCommunityPage;


