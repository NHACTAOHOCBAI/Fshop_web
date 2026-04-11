import { Eye, EyeOff, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import ClientPagination from "@/components/pagination/ClientPagination";
import PostCard from "@/components/posts/PostCard.tsx";
import PostDetailPage from "@/pages/shop/community/PostDetailPage";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminPosts, useUpdatePostStatus } from "@/hooks/usePosts";
import type { Post } from "@/types/post";

const PAGE_SIZE = 8;

type StatusFilter = "all" | "active" | "inactive";

const AdminCommunityPage = () => {
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [postToToggle, setPostToToggle] = useState<Post | null>(null);

    const { mutate: updatePostStatus, isPending: isUpdatingStatus } = useUpdatePostStatus();

    const queryParams = useMemo(
        () => ({
            page,
            limit: PAGE_SIZE,
            search: searchQuery || undefined,
            sortBy: "createdAt",
            sortOrder: "DESC" as const,
        }),
        [page, searchQuery]
    );

    const postsQuery = useAdminPosts(queryParams, statusFilter);
    const posts = postsQuery.data?.data ?? [];
    const total = postsQuery.data?.pagination?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    useEffect(() => {
        setPage(1);
    }, [searchQuery, statusFilter]);

    const handleSearchSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSearchQuery(searchInput.trim());
    }, [searchInput]);

    const clearSearch = useCallback(() => {
        setSearchInput("");
        setSearchQuery("");
    }, []);

    const handleRefresh = useCallback(() => {
        void postsQuery.refetch();
    }, [postsQuery]);

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
                    void postsQuery.refetch();
                },
                onError: (mutationError) => {
                    toast.error(
                        mutationError instanceof Error ? mutationError.message : "Không thể cập nhật trạng thái bài viết."
                    );
                },
            }
        );
    }, [postToToggle, postsQuery, updatePostStatus]);

    return (
        <div className="w-full space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Cộng đồng</h1>
                    <p className="text-sm text-muted-foreground">
                        Quản lý bài viết bằng dạng card giống trang cộng đồng bên client, đồng thời ẩn hoặc khôi phục khi cần.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <SlidersHorizontal className="size-4" />
                    {total.toLocaleString()} bài viết
                </div>
            </div>

            <div className="py-4">
                <form onSubmit={handleSearchSubmit} className="flex w-full flex-col gap-2 lg:flex-row lg:items-center">
                    <Input
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder="Tìm theo nội dung, người đăng hoặc hashtag..."
                        className="w-full lg:max-w-sm"
                    />

                    <Select
                        value={statusFilter}
                        onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                    >
                        <SelectTrigger className="w-full lg:w-44">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="active">Đang hiển thị</SelectItem>
                            <SelectItem value="inactive">Đã ẩn</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:justify-end">
                        <Button type="submit" variant="outline" size="sm" className="h-8">
                            <Search className="size-4" />
                            Tìm
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="h-8" onClick={clearSearch}>
                            Xóa lọc
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={handleRefresh}
                            disabled={postsQuery.isFetching || isUpdatingStatus}
                        >
                            <RefreshCw className={`size-4 ${postsQuery.isFetching ? "animate-spin" : ""}`} />
                            Làm mới
                        </Button>
                    </div>
                </form>
            </div>

            <div className="mx-auto w-full max-w-5xl">
                {postsQuery.isError ? (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                        Không thể tải dữ liệu cộng đồng: {postsQuery.error?.message || "Đã có lỗi xảy ra."}
                    </div>
                ) : posts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed bg-white p-12 text-center">
                        <p className="text-base font-semibold text-[#223263]">Không tìm thấy bài viết phù hợp</p>
                        <p className="mt-2 text-sm text-slate-500">
                            Hãy thử đổi từ khóa hoặc lọc trạng thái để xem thêm nội dung.
                        </p>
                        <div className="mt-5 flex justify-center">
                            <Button variant="outline" onClick={clearSearch}>
                                Xóa bộ lọc
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-5">
                            {posts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    disableLink
                                    showOwnerActions={false}
                                    rightActions={
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setSelectedPost(post)}>
                                                Xem
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={post.isActive ? "destructive" : "outline"}
                                                onClick={() => setPostToToggle(post)}
                                                disabled={isUpdatingStatus}
                                            >
                                                {post.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                                {post.isActive ? "Ẩn" : "Hiện"}
                                            </Button>
                                        </div>
                                    }
                                />
                            ))}
                        </div>

                        <ClientPagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            disabled={postsQuery.isFetching || isUpdatingStatus}
                            className="mt-6"
                        />
                    </>
                )}
            </div>

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
                        <DialogTitle>Chi tiet bai viet cong dong</DialogTitle>
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
                        <Button variant="outline" onClick={() => setPostToToggle(null)} disabled={isUpdatingStatus}>
                            Hủy
                        </Button>
                        <Button onClick={handleToggleStatus} disabled={isUpdatingStatus} variant={postToToggle?.isActive ? "destructive" : "default"}>
                            {isUpdatingStatus ? "Đang cập nhật..." : postToToggle?.isActive ? "Xác nhận ẩn" : "Xác nhận khôi phục"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminCommunityPage;
