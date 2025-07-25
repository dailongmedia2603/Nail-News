import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostCard, type Post } from "@/components/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";

const FeaturedPostsPage = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritePostIds, setFavoritePostIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .in('tier', ['vip', 'urgent'])
        .gt('expires_at', new Date().toISOString())
        .order('tier', { ascending: false }) // 'vip' comes before 'urgent'
        .order('created_at', { ascending: false });

      if (error) {
        showError("Không thể tải tin nổi bật.");
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    };

    const fetchFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: favorites } = await supabase.from('favorites').select('post_id').eq('user_id', user.id);
        if (favorites) {
          setFavoritePostIds(new Set(favorites.map(f => f.post_id)));
        }
      }
    };

    fetchFeaturedPosts();
    fetchFavorites();
  }, []);

  const handleFavoriteToggle = async (postId: string, isCurrentlyFavorited: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Bạn cần đăng nhập để thực hiện hành động này.");
      return;
    }

    if (isCurrentlyFavorited) {
      setFavoritePostIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
      const { error } = await supabase.from('favorites').delete().match({ user_id: user.id, post_id: postId });
      if (error) {
        showError("Bỏ yêu thích thất bại.");
        setFavoritePostIds(prev => new Set(prev).add(postId));
      }
    } else {
      setFavoritePostIds(prev => new Set(prev).add(postId));
      const { error } = await supabase.from('favorites').insert({ user_id: user.id, post_id: postId });
      if (error) {
        showError("Yêu thích thất bại.");
        setFavoritePostIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
    }
  };

  const handleViewPost = (postId: string) => {
    navigate(`/posts/${postId}`);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="my-8">
        <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center">
          <Star className="mr-3 h-8 w-8 text-yellow-500" />
          {t('featuredPostsPage.title')}
        </h1>
        <p className="text-muted-foreground mt-2 text-center">{t('featuredPostsPage.subtitle')}</p>
      </div>
      
      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[220px] w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    isFavorited={favoritePostIds.has(post.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                    onView={handleViewPost}
                    isFeatured={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">{t('featuredPostsPage.noPosts')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FeaturedPostsPage;