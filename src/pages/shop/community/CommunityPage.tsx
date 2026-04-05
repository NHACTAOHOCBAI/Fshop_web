import { Loader2, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useMatch, useNavigate, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ClientPagination from "@/components/pagination/ClientPagination";
import PostCard from "@/components/posts/PostCard";
import { usePosts } from "@/hooks/usePosts";
import type { Post } from "@/types/post";
import PostDetailPage from "./PostDetailPage";
import CreatePostPage from "./CreatePostPage";

const CommunityPage = () => {
    const navigate = useNavigate();
    const { postId } = useParams<{ postId: string }>();
    const createRouteMatch = useMatch("/community/create");
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedHashtag, setSelectedHashtag] = useState("");
    const limit = 10;
    const queryParams = useMemo(
        () => ({
            page,
            limit,
            sortBy: "createdAt",
            sortOrder: "DESC" as const,
            search: searchQuery || undefined,
            hashtag: selectedHashtag || undefined,
        }),
        [page, limit, searchQuery, selectedHashtag],
    );
    const postsQuery = usePosts(queryParams);
    const posts = postsQuery.data?.data ?? [];
    const total = postsQuery.data?.pagination?.total ?? 0;
    const totalPages = Math.ceil(total / limit);
    const selectedPostId = Number(postId);
    const isDetailOpen = Number.isFinite(selectedPostId) && selectedPostId > 0;
    const isCreateOpen = !!createRouteMatch;

    useEffect(() => {
        setPage(1);
    }, [searchQuery, selectedHashtag]);

    const hashtagOptions = useMemo(() => {
        const tagMap = new Map<string, number>();

        posts.forEach((post: Post) => {
            post.postHashtags.forEach((postHashtag) => {
                const tagName = postHashtag.hashtag.name.trim();
                if (!tagName) return;
                tagMap.set(tagName, (tagMap.get(tagName) ?? 0) + 1);
            });
        });

        return Array.from(tagMap.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    }, [posts]);

    const handleSearchSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSearchQuery(searchInput.trim());
    }, [searchInput]);

    const handleClearSearch = useCallback(() => {
        setSearchInput("");
        setSearchQuery("");
    }, []);

    const handleToggleHashtag = useCallback((tagName: string) => {
        setSelectedHashtag((current) => (current === tagName ? "" : tagName));
    }, []);

    const clearFilters = useCallback(() => {
        setSearchInput("");
        setSearchQuery("");
        setSelectedHashtag("");
    }, []);

    const handlePageChange = useCallback((nextPage: number) => {
        setPage(nextPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

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

    const handleCreateDialogChange = useCallback(
        (open: boolean) => {
            if (!open) {
                navigate("/community");
            }
        },
        [navigate],
    );

    return (
        <div>
            <div className="mb-6 rounded-2xl border border-[#EAF0FF] bg-slate-50/60 p-4 md:p-5">
                <div className="flex flex-col gap-4">
                    <form onSubmit={handleSearchSubmit} className="flex flex-1 flex-col gap-3 md:flex-row md:items-end">
                        <div className="flex-1">
                            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#223263]">
                                <Search className="h-4 w-4" />
                                Tìm bài viết
                            </div>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={searchInput}
                                    onChange={(event) => setSearchInput(event.target.value)}
                                    placeholder="Tìm theo nội dung hoặc hashtag..."
                                    className="h-11 rounded-xl border-[#E2E8F0] bg-white pl-10"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" className="h-11 rounded-xl px-4 font-semibold">
                                Tìm
                            </Button>
                            {(searchQuery || selectedHashtag) && (
                                <Button type="button" variant="outline" className="h-11 rounded-xl border-slate-300 px-4" onClick={clearFilters}>
                                    <X className="mr-2 h-4 w-4" />
                                    Xóa lọc
                                </Button>
                            )}
                        </div>
                    </form>
                </div>

                {(searchQuery || selectedHashtag) && (
                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                        {searchQuery ? (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-1.5 font-medium text-primary"
                            >
                                Từ khóa: {searchQuery}
                                <X className="h-3.5 w-3.5" />
                            </button>
                        ) : null}

                        {selectedHashtag ? (
                            <button
                                type="button"
                                onClick={() => setSelectedHashtag("")}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700"
                            >
                                #{selectedHashtag}
                                <X className="h-3.5 w-3.5" />
                            </button>
                        ) : null}
                    </div>
                )}
            </div>

            <main className="w-full flex justify-between">
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
                            <p className="text-base font-semibold text-[#223263]">Không tìm thấy bài viết phù hợp</p>
                            <p className="mt-2 text-sm text-slate-500">
                                Thử đổi từ khóa, hashtag hoặc cách sắp xếp để xem thêm nội dung.
                            </p>
                            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                                <Button variant="outline" onClick={clearFilters}>
                                    Xóa bộ lọc
                                </Button>
                                <Link to="/community/create">
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Tạo bài viết
                                    </Button>
                                </Link>
                            </div>
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

                            <ClientPagination
                                page={page}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                                disabled={postsQuery.isLoading}
                                className="mt-6"
                            />
                        </>
                    )}
                </section>

                <aside className="flex-2">
                    <div className="sticky top-24 space-y-4">


                        {hashtagOptions.length > 0 && (
                            <div className="rounded-2xl border border-[#EAF0FF] bg-white p-4 ">
                                <p className="text-sm font-semibold text-[#223263]">Hashtag nổi bật</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {hashtagOptions.slice(0, 8).map((tag) => (
                                        <button
                                            key={tag.name}
                                            type="button"
                                            onClick={() => handleToggleHashtag(tag.name)}
                                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                selectedHashtag === tag.name
                                                    ? "border-primary bg-primary text-white"
                                                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-primary hover:text-primary"
                                            }`}
                                        >
                                            #{tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

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
                className="fixed bottom-6 right-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-app-primary text-white md:hidden"
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

            <Dialog open={isCreateOpen} onOpenChange={handleCreateDialogChange}>
                <DialogContent className="max-h-[92vh] overflow-hidden p-4 sm:max-w-3xl [&>button]:hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Tao bai viet moi</DialogTitle>
                    </DialogHeader>
                    {isCreateOpen ? <CreatePostPage onClose={() => navigate("/community")} /> : null}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CommunityPage;
