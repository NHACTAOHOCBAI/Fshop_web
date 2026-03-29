import { Loader2, Plus } from "lucide-react";
import { useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PostCard from "@/components/posts/PostCard";
import { usePosts } from "@/hooks/usePosts";
import PostDetailPage from "./PostDetailPage";
const CommunityPage = () => {
    const navigate = useNavigate();
    const { postId } = useParams<{ postId: string }>();
    const [page, setPage] = useState(1);
    const limit = 10;
    const postsQuery = usePosts({
        page,
        limit,
        sortBy: "createdAt",
        sortOrder: "DESC",
    });
    const posts = postsQuery.data?.data ?? [];
    const total = postsQuery.data?.pagination?.total ?? 0;
    const totalPages = Math.ceil(total / limit);
    const selectedPostId = Number(postId);
    const isDetailOpen = Number.isFinite(selectedPostId) && selectedPostId > 0;

    const handlePreviousPage = useCallback(() => {
        setPage((p) => Math.max(1, p - 1));
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleNextPage = useCallback(() => {
        setPage((p) => (p < totalPages ? p + 1 : p));
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [totalPages]);

    const handlePostDeleted = useCallback(() => {
        // Refetch posts when post is deleted
        postsQuery.refetch();
    }, [postsQuery]);

    const handleDetailDialogChange = useCallback(
        (open: boolean) => {
            if (!open) {
                navigate("/community");
            }
        },
        [navigate],
    );

    return (
        <div >

            <main className="w-full gap-8 flex justify-between">
                <section className="flex-5">
                    {postsQuery.isLoading && page === 1 ? (
                        <div className="rounded-2xl border border-[#EAF0FF] bg-white px-6 py-20 text-center ">
                            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-slate-400" />
                            <p className="text-slate-600">Đang tải bài viết...</p>
                        </div>
                    ) : postsQuery.isError ? (
                        <div className="rounded-2xl border border-[#EAF0FF] bg-white p-8 text-center ">
                            <p className="mb-4 text-slate-600">Đã xảy ra lỗi khi tải bài viết</p>
                            <Button onClick={() => postsQuery.refetch()}>Thử lại</Button>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="rounded-2xl border border-[#EAF0FF] bg-white p-12 text-center ">
                            <Link to="/community/create">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tạo bài viết
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-5">
                                {posts.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onPostDeleted={handlePostDeleted}
                                    />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-[#EAF0FF] bg-white px-4 py-4 shadow-sm">
                                    <Button
                                        variant="outline"
                                        onClick={handlePreviousPage}
                                        disabled={page === 1 || postsQuery.isLoading}
                                    >
                                        Trước
                                    </Button>

                                    <div className="text-sm text-slate-600">
                                        Trang <span className="font-semibold">{page}</span> / {totalPages}
                                    </div>

                                    <Button
                                        variant="outline"
                                        onClick={handleNextPage}
                                        disabled={page >= totalPages || postsQuery.isLoading}
                                    >
                                        Sau
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </section>

                <aside className="flex-2">
                    <div className="sticky top-24 space-y-4">
                        <div className="rounded-2xl border border-[#EAF0FF] bg-white p-4 ">
                            <p className="text-base font-bold text-[#223263]">Cộng đồng FShop</p>
                            <p className="mt-1 text-sm text-[#9098B1]">
                                {total > 0 ? `${total} bài viết đang hoạt động` : "Chưa có bài viết nào"}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#EAF0FF] bg-white p-4 ">
                            <p className="text-sm font-semibold text-[#223263]">Mẹo nhanh</p>
                            <p className="mt-2 text-sm leading-6 text-[#64748B]">
                                Đăng ảnh rõ nét, thêm hashtag ngắn gọn để bài viết dễ được khám phá hơn.
                            </p>
                            <Link
                                to="/community/create"
                                className="mt-3 inline-flex rounded-lg bg-app-primary px-3 py-2 text-sm font-semibold text-white hover:bg-app-primary/90"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                Tạo bài viết mới
                            </Link>
                        </div>
                    </div>
                </aside>
            </main>

            <Link
                to="/community/create"
                className="fixed bottom-6 right-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-app-primary text-white shadow-lg shadow-sky-300/50 md:hidden"
            >
                <Plus className="h-7 w-7" />
            </Link>

            <Dialog open={isDetailOpen} onOpenChange={handleDetailDialogChange}>
                <DialogContent className="max-h-[92vh] overflow-hidden p-4 sm:max-w-5xl [&>button]:hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Chi tiet bai viet cong dong</DialogTitle>
                    </DialogHeader>
                    {isDetailOpen ? <PostDetailPage /> : null}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CommunityPage;
