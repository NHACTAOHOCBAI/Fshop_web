import { useLocation, useNavigate, useParams } from "react-router";
import { ArrowLeft, Loader2, User as UserIcon, UserPlus, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { usePosts } from "@/hooks/usePosts";
import PostCard from "@/components/posts/PostCard";
import { getUserById, toggleFollowUser } from "@/services/users";
import { authStorage } from "@/lib/auth";
import type { User } from "@/types/user";

const UserBlogPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const targetUserId = Number(userId);

  const postsQuery = usePosts({
    page: 1,
    limit: 100,
    sortBy: "createdAt",
    sortOrder: "DESC",
  });

  const location = useLocation();
  const passedUser = location.state?.user;

  const [user, setUser] = useState<User | null>(passedUser || null);
  const currentUserId = authStorage.getUser<User>()?.id;

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
  }, [targetUserId, currentUserId]);

  const allPosts = postsQuery.data?.data ?? [];
  const userPosts = allPosts.filter((post) => post.userId === targetUserId);

  const handleToggleFollow = async () => {
    if (!currentUserId) {
      toast.error("Vui lòng đăng nhập để thực hiện thao tác này.");
      navigate("/login");
      return;
    }
    try {
      const res = await toggleFollowUser(targetUserId);
      setUser((prev) => {
        if (!prev) return prev;
        const isNowFollowing = res.followed;
        return {
          ...prev,
          isFollowing: isNowFollowing,
          followersCount: isNowFollowing
            ? prev.followersCount + 1
            : Math.max(0, prev.followersCount - 1),
        };
      });
      if (res.followed) {
        toast.success(`Đã theo dõi ${user?.fullName}`);
      } else {
        toast.success(`Đã hủy theo dõi ${user?.fullName}`);
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi thực hiện thao tác.");
    }
  };

  if (postsQuery.isLoading || (!user && !postsQuery.isError)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-slate-500">Đang tải trang cá nhân...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-slate-600">Không tìm thấy thông tin người dùng.</p>
        <Button onClick={() => navigate("/community")}>Quay lại Cộng đồng</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/community")}
          className="rounded-xl text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cộng đồng
        </Button>
      </div>

      {/* User profile header card */}
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        {/* Banner with gradient or cover image */}
        {user.coverImage ? (
          <img
            src={user.coverImage}
            alt="Cover"
            className="h-48 w-full object-cover sm:h-64"
          />
        ) : (
          <div className="h-48 bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 sm:h-64" />
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
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
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

            {/* Follow Action Button */}
            {currentUserId !== targetUserId && (
              <div className="shrink-0 w-full sm:w-auto mt-4 sm:mt-0 sm:self-center">
                <Button
                  onClick={handleToggleFollow}
                  variant={user.isFollowing ? "outline" : "default"}
                  className={`w-full sm:w-auto rounded-2xl px-6 py-5 font-semibold text-sm transition-all shadow-xs gap-1.5 flex items-center justify-center ${
                    user.isFollowing
                      ? "border-slate-200 bg-white text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                      : "bg-[#40BFFF] hover:bg-[#40BFFF]/90 text-white"
                  }`}
                >
                  {user.isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4" />
                      <span>Đang theo dõi</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Theo dõi</span>
                    </>
                  )}
                </Button>
              </div>
            )}
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
          <div className="space-y-5">
            {userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onPostDeleted={() => postsQuery.refetch()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserBlogPage;
