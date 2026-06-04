import { Loader2, Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useMatch, useNavigate, useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ClientPagination from "@/components/pagination/ClientPagination";
import { usePosts } from "@/hooks/usePosts";
import type { Post } from "@/types/post";
import PostDetailPage from "./PostDetailPage";
import CreatePostPage from "./CreatePostPage";
import PostCard from "@/components/posts/PostCard";
import { cn } from "@/lib/utils";
import { authStorage } from "@/lib/auth";
import type { User } from "@/types/user";
import { toast } from "sonner";
import ActivateBlogModal from "@/components/community/ActivateBlogModal";

const CommunityPage = () => {
    const navigate = useNavigate();
    const { postId } = useParams<{ postId: string }>();
    const createRouteMatch = useMatch("/community/create");
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedHashtag, setSelectedHashtag] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [filterTab, setFilterTab] = useState<"all" | "my-posts">("all");
    const [sortOption, setSortOption] = useState<"newest" | "popular">("newest");
    const [recentSearches, setRecentSearches] = useState<string[]>(() => {
        try {
            return JSON.parse(localStorage.getItem("fshop_recent_community_searches") || "[]");
        } catch {
            return [];
        }
    });
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
    const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);

    useEffect(() => {
        if (isCreateOpen) {
            const currentUser = authStorage.getUser<User>();
            if (!currentUser) {
                toast.error("Vui lòng đăng nhập để viết bài đăng.");
                navigate("/login");
            } else if (!currentUser.isBlogActive) {
                navigate("/community");
                setIsActivateModalOpen(true);
            }
        }
    }, [isCreateOpen, navigate]);

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

    const currentUserId = authStorage.getUser<User>()?.id;
    const processedPosts = useMemo(() => {
        let result = [...posts];

        if (filterTab === "my-posts" && currentUserId) {
            result = result.filter((post) => post.userId === currentUserId);
        }

        if (sortOption === "popular") {
            result.sort((a, b) => b.totalLikes - a.totalLikes);
        } else {
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return result;
    }, [posts, filterTab, sortOption, currentUserId]);

    const handleSearchSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = searchInput.trim();
        setSearchQuery(trimmed);
        if (trimmed) {
            setRecentSearches((prev) => {
                const next = [trimmed, ...prev.filter((q) => q !== trimmed)].slice(0, 5);
                localStorage.setItem("fshop_recent_community_searches", JSON.stringify(next));
                return next;
            });
        }
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
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={searchInput}
                                    onChange={(event) => setSearchInput(event.target.value)}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                                    placeholder="Tìm theo nội dung hoặc hashtag..."
                                    className="h-11 rounded-xl border-[#E2E8F0] bg-white pl-10 pr-16 focus-visible:ring-[#40BFFF]"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
                                >
                                    Tìm
                                </button>

                                {isFocused && (
                                    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-slate-100 bg-white p-3 shadow-lg">
                                        {recentSearches.length > 0 && !searchInput && (
                                            <div className="mb-3">
                                                <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Tìm kiếm gần đây</p>
                                                <div className="mt-1.5 flex flex-col gap-1">
                                                    {recentSearches.map((item) => (
                                                        <div
                                                            key={item}
                                                            onClick={() => {
                                                                setSearchInput(item);
                                                                setSearchQuery(item);
                                                                setRecentSearches((prev) => {
                                                                    const next = [item, ...prev.filter((q) => q !== item)].slice(0, 5);
                                                                    localStorage.setItem("fshop_recent_community_searches", JSON.stringify(next));
                                                                    return next;
                                                                });
                                                            }}
                                                            className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50"
                                                        >
                                                            <span className="text-xs text-slate-700">{item}</span>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setRecentSearches((prev) => {
                                                                        const next = prev.filter((q) => q !== item);
                                                                        localStorage.setItem("fshop_recent_community_searches", JSON.stringify(next));
                                                                        return next;
                                                                    });
                                                                }}
                                                                className="text-slate-400 hover:text-slate-600 text-xs"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                                                {searchInput ? "Hashtag phù hợp" : "Hashtag phổ biến"}
                                            </p>
                                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                {(searchInput
                                                    ? hashtagOptions.filter(tag => tag.name.toLowerCase().includes(searchInput.toLowerCase().replace("#", "")))
                                                    : hashtagOptions
                                                ).slice(0, 6).map((tag) => (
                                                    <button
                                                        key={tag.name}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedHashtag(tag.name);
                                                            setIsFocused(false);
                                                        }}
                                                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:bg-primary/5 hover:text-primary hover:border-primary/20"
                                                    >
                                                        #{tag.name}
                                                    </button>
                                                ))}
                                                {(searchInput
                                                    ? hashtagOptions.filter(tag => tag.name.toLowerCase().includes(searchInput.toLowerCase().replace("#", "")))
                                                    : hashtagOptions
                                                ).length === 0 && (
                                                    <p className="text-xs text-slate-400">Không tìm thấy hashtag nào</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[#EAF0FF]/60 pt-3.5">
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setFilterTab("all")}
                                className={cn(
                                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                                    filterTab === "all"
                                        ? "bg-primary text-white"
                                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                Tất cả bài viết
                            </button>
                            {currentUserId && (
                                <button
                                    type="button"
                                    onClick={() => setFilterTab("my-posts")}
                                    className={cn(
                                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                                        filterTab === "my-posts"
                                            ? "bg-primary text-white"
                                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                    )}
                                >
                                    Bài viết của tôi
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-400">Sắp xếp:</span>
                            <button
                                type="button"
                                onClick={() => setSortOption("newest")}
                                className={cn(
                                    "text-xs font-semibold transition-colors",
                                    sortOption === "newest"
                                        ? "text-primary"
                                        : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                Mới nhất
                            </button>
                            <span className="text-slate-300 text-xs">|</span>
                            <button
                                type="button"
                                onClick={() => setSortOption("popular")}
                                className={cn(
                                    "text-xs font-semibold transition-colors",
                                    sortOption === "popular"
                                        ? "text-primary"
                                        : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                Nổi bật
                            </button>
                        </div>
                    </div>
                </div>

                {(searchQuery || selectedHashtag) && (
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        {searchQuery ? (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-primary/5 backdrop-blur-xs px-3 py-1 font-medium text-primary hover:bg-primary/10 transition-colors"
                            >
                                Từ khóa: {searchQuery}
                                <X className="h-3 w-3" />
                            </button>
                        ) : null}

                        {selectedHashtag ? (
                            <button
                                type="button"
                                onClick={() => setSelectedHashtag("")}
                                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100/50 backdrop-blur-xs px-3 py-1 font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                #{selectedHashtag}
                                <X className="h-3 w-3" />
                            </button>
                        ) : null}
                    </div>
                )}
            </div>

            <main className="grid w-full gap-6 lg:grid-cols-[1fr_300px]">
                <section className="min-w-0">
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
                                {processedPosts.map((post) => (
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

                <aside className="min-w-0">
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

            <ActivateBlogModal
                isOpen={isActivateModalOpen}
                onOpenChange={setIsActivateModalOpen}
                onSuccess={() => {
                    navigate("/community/create");
                }}
            />
        </div>
    );
};

export default CommunityPage;
