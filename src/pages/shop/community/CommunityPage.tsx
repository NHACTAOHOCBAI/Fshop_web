import { Loader2, Plus } from "lucide-react";
import { useState, useCallback } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import PostCard from "@/components/posts/PostCard";
import { usePosts } from "@/hooks/usePosts";
const CommunityPage = () => {
    const [page, setPage] = useState(1);
    const limit = 10;

    const postsQuery = usePosts({ page, limit, sortBy: "createdAt", sortOrder: "DESC" });
    const posts = postsQuery.data?.data ?? [];
    const total = postsQuery.data?.pagination?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

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

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900">Cộng đồng</h1>
                        <p className="text-slate-600 mt-1">
                            {total > 0 ? `${total} bài viết` : "Chưa có bài viết nào"}
                        </p>
                    </div>
                    <Link to="/community/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Tạo bài viết
                        </Button>
                    </Link>
                </div>

                {/* Posts List */}
                {postsQuery.isLoading && page === 1 ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-3" />
                            <p className="text-slate-600">Đang tải bài viết...</p>
                        </div>
                    </div>
                ) : postsQuery.isError ? (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                        <p className="text-slate-600 mb-4">Đã xảy ra lỗi khi tải bài viết</p>
                        <Button onClick={() => postsQuery.refetch()}>Thử lại</Button>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <p className="text-slate-600 mb-4">Chưa có bài viết nào. Hãy làm cái đầu tiên!</p>
                        <Link to="/community/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Tạo bài viết
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {posts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    onPostDeleted={handlePostDeleted}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-8 pt-8 border-t border-slate-200">
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
            </div>
        </div>
    );
};

export default CommunityPage;
