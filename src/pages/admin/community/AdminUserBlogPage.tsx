import { useLocation, useNavigate, useParams, Link } from "react-router";
import { ArrowLeft, Loader2, User as UserIcon, Heart, MessageCircle, Eye, EyeOff } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { usePosts, useUpdatePostStatus, useTogglePostLike } from "@/hooks/usePosts";
import { getUserById } from "@/services/users";
import { formatRelativeTime } from "@/lib/utils";
import type { User } from "@/types/user";
import type { Post } from "@/types/post";
import PostDetailPage from "@/pages/shop/community/PostDetailPage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Dedicated admin-themed post card (looks exactly like client card but with blue colors replaced by black)
const AdminPostCard = ({
  post,
  onToggleStatus,
  onViewDetails,
}: {
  post: Post;
  onToggleStatus: () => void;
  onViewDetails: () => void;
}) => {
  const { mutate: toggleLike, isPending: isLiking } = useTogglePostLike();
  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked));
  const [likesCount, setLikesCount] = useState(post.totalLikes || 0);

  useEffect(() => {
    setIsLiked(Boolean(post.isLiked));
    setLikesCount(post.totalLikes || 0);
  }, [post.isLiked, post.totalLikes]);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike(post.id, {
      onSuccess: (result) => {
        if (typeof result.isLiked === "boolean") {
          setIsLiked(result.isLiked);
        } else if (result.message === "Post liked") {
          setIsLiked(true);
        } else if (result.message === "Post unliked") {
          setIsLiked(false);
        }
        setLikesCount(result?.totalLikes ?? (isLiked ? likesCount - 1 : likesCount + 1));
      },
    });
  };

  const displayImages = useMemo(
    () => post.images?.filter((image) => Boolean(image.imageUrl)) ?? [],
    [post.images]
  );
  const gridImages = useMemo(() => displayImages.slice(0, 4), [displayImages]);
  const remainingImages = Math.max(0, displayImages.length - 4);

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white transition-shadow hover:shadow-sm flex flex-col justify-between">
      <div>
        {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
        <Link
          to={`/admin/community/user/${post.userId}`}
          className="flex items-center gap-3 hover:opacity-85 transition-opacity"
        >
          {post.user?.avatar ? (
            <img
              src={post.user.avatar}
              alt={post.user.fullName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <UserIcon className="h-5 w-5" />
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-slate-800">{post.user?.fullName}</p>
            <p className="text-xs text-slate-400">{formatRelativeTime(post.createdAt)}</p>
          </div>
        </Link>

        {/* Admin Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 px-2 text-[10px] font-medium rounded-xl hover:bg-slate-50 ${
              post.isActive ? "text-emerald-600 hover:text-emerald-700" : "text-slate-400 hover:text-slate-500"
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleStatus();
            }}
          >
            {post.isActive ? <Eye className="size-3 mr-1" /> : <EyeOff className="size-3 mr-1" />}
            {post.isActive ? "Đang hiện" : "Đã ẩn"}
          </Button>
        </div>
      </div>

      {/* Images Grid */}
      {gridImages.length > 0 && (
        <div
          className={`grid gap-px bg-[#F1F5F9] cursor-pointer ${
            gridImages.length === 1
              ? "grid-cols-1"
              : "grid-cols-2"
          }`}
          onClick={onViewDetails}
        >
          {gridImages.map((image, idx) => (
            <div
              key={image.id}
              className={`group relative overflow-hidden bg-slate-200 ${
                gridImages.length === 1 ? "aspect-[5/4]" : "aspect-[6/5]"
              }`}
            >
              <img
                src={image.imageUrl}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
              />
              {remainingImages > 0 && idx === 3 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-sm font-semibold text-white">+{remainingImages}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content and Interactions */}
      <div className="px-3 py-2.5 space-y-1.5">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className="text-slate-800 transition-colors hover:text-red-500 disabled:opacity-50"
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
          </button>
          <button
            type="button"
            className="text-slate-800 transition-colors hover:text-black"
            onClick={onViewDetails}
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-800">{likesCount.toLocaleString()} lượt thích</p>
          
          {post.content && (
            <p className="text-sm text-slate-800 leading-5">
              <span className="mr-1 font-bold">{post.user?.fullName}</span>
              {post.content}
            </p>
          )}

          {post.postHashtags && post.postHashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {post.postHashtags.map((ph) => (
                <span
                  key={ph.id}
                  className="text-xs font-semibold text-black hover:underline cursor-pointer"
                >
                  #{ph.hashtag?.name}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={onViewDetails}
            className="pt-0.5 text-sm text-slate-400 hover:text-slate-600 block text-left"
          >
            Xem tất cả {post.totalComments || 0} bình luận
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

const AdminUserBlogPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const targetUserId = Number(userId);

  const postsQuery = usePosts({
    page: 1,
    limit: 100,
    sortBy: "createdAt",
    sortOrder: "DESC",
  });

  const { mutate: updatePostStatus } = useUpdatePostStatus();

  const location = useLocation();
  const passedUser = location.state?.user;

  const [user, setUser] = useState<User | null>(passedUser || null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    if (targetUserId) {
      getUserById(targetUserId)
        .then((res) => {
          if (res.data) {
            setUser(res.data);
          }
        })
        .catch((err) => {
          console.error("Error fetching user profile:", err);
        });
    }
  }, [targetUserId]);

  const allPosts = postsQuery.data?.data ?? [];
  const userPosts = allPosts.filter((post) => post.userId === targetUserId);

  const handleToggleStatus = (post: Post) => {
    updatePostStatus(
      { id: post.id, isActive: !post.isActive },
      {
        onSuccess: () => {
          toast.success(post.isActive ? "Đã ẩn bài viết." : "Đã khôi phục bài viết.");
          void postsQuery.refetch();
        },
        onError: (mutationError) => {
          toast.error(
            mutationError instanceof Error ? mutationError.message : "Không thể cập nhật trạng thái bài viết."
          );
        },
      }
    );
  };

  if (postsQuery.isLoading || (!user && !postsQuery.isError)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
        <p className="text-sm text-slate-500">Đang tải trang cá nhân...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-slate-600">Không tìm thấy thông tin người dùng.</p>
        <Button onClick={() => navigate("/admin/community")}>Quay lại Cộng đồng</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="rounded-xl text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>

      {/* User profile header card */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        {/* Banner with gradient (Blue changed to Black) */}
        {user.coverImage ? (
          <img
            src={user.coverImage}
            alt="Cover"
            className="h-48 w-full object-cover sm:h-64"
          />
        ) : (
          <div className="h-48 bg-gradient-to-r from-zinc-900 via-neutral-800 to-black sm:h-64" />
        )}

        {/* Profile info section */}
        <div className="relative px-6 pb-6 pt-3 sm:px-8 sm:pb-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-6">
            {/* Big Avatar */}
            <div className="relative z-10 -mt-14 h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md sm:-mt-16 sm:h-28 sm:w-28">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName ?? "User avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                  <UserIcon className="h-10 w-10" />
                </div>
              )}
            </div>

            {/* User details */}
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
                {user.fullName}
              </h1>
              <p className="text-sm text-slate-500">{user.email}</p>
              {user.bio && (
                <p className="mt-1.5 text-sm text-slate-600 max-w-xl italic">
                  "{user.bio}"
                </p>
              )}
              
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-500">
                <span className="inline-flex items-center rounded-full bg-black px-2.5 py-0.5 text-xs font-semibold text-white">
                  {userPosts.length} bài viết
                </span>
                <span>
                  <strong className="font-bold text-slate-700">{user.followersCount ?? 0}</strong> người theo dõi
                </span>
                <span className="text-slate-300">•</span>
                <span>
                  <strong className="font-bold text-slate-700">{user.followingCount ?? 0}</strong> đang theo dõi
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800">
          Bài viết đã đăng
        </h2>

        {userPosts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center text-sm text-slate-500">
            Người dùng chưa đăng bài viết nào.
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {userPosts.map((post) => (
              <AdminPostCard
                key={post.id}
                post={post}
                onToggleStatus={() => handleToggleStatus(post)}
                onViewDetails={() => setSelectedPost(post)}
              />
            ))}
          </div>
        )}
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
        <DialogContent className="max-h-[92vh] overflow-hidden p-4 sm:max-w-5xl bg-white text-slate-800 [&>button]:hidden">
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
    </div>
  );
};

export default AdminUserBlogPage;
