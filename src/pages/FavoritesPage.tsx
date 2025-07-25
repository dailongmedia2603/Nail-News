import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostCard, type Post } from "@/components/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/utils/toast";
import ProfileLayout from "@/components/ProfileLayout";
import { useNavigate } from "react-router-dom";

type FavoritePost = {
    id: number;
    created_at: string;
    user_id: string;
    post_id: string;
    posts: Post;
}

const FavoritesPage = () => {
  const [favoritePosts, setFavoritePosts] = useState<FavoritePost[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFavorites = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('*, posts(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Lỗi tải tin yêu thích:", error);
      showError("Không thể tải danh sách yêu thích.");
    } else {
      setFavoritePosts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleFavoriteToggle = async (postId: string, isCurrentlyFavorited: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isCurrentlyFavorited) return;

    // In favorites page, we only handle un-favoriting
    const originalFavorites = [...favoritePosts];
    setFavoritePosts(prev => prev.filter(p => p.posts.id !== postId));

    const { error } = await supabase.from('favorites').delete().match({ user_id: user.id, post_id: postId });
    if (error) {
      showError("Bỏ yêu thích thất bại.");
      setFavoritePosts(originalFavorites);
    }
  };

  const handleViewPost = (postId: string) => {
    navigate(`/posts/${postId}`);
  };

  return (
    <ProfileLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Tin đã yêu thích</h3>
          <p className="text-sm text-muted-foreground">
            Đây là danh sách các tin đăng bạn đã lưu.
          </p>
        </div>
        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-[125px] w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {favoritePosts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {favoritePosts.map(({ posts }) => (
                    <PostCard
                      key={posts.id}
                      post={posts}
                      isFavorited={true} // Always true on this page
                      onFavoriteToggle={handleFavoriteToggle}
                      onView={handleViewPost}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">Bạn chưa yêu thích tin đăng nào.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProfileLayout>
  );
};

export default FavoritesPage;