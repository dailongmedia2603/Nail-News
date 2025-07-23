import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { PostCard, type Post } from "@/components/PostCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/utils/toast";
import { PostSearch } from "@/components/PostSearch";
import { PostFilters } from "@/components/PostFilters";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const categories = ["Tất cả", "Bán tiệm", "Cần thợ"];

const HomePage = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [filters, setFilters] = useState<{ stateId: number | null; cityId: number | null; tagIds: number[] }>({ stateId: null, cityId: null, tagIds: [] });
  const [favoritePostIds, setFavoritePostIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const fetchPosts = async () => {
    setLoading(true);
    
    const { data, error } = await supabase.rpc('filter_posts', {
      p_category: activeCategory === 'Tất cả' ? null : activeCategory,
      p_state_id: filters.stateId,
      p_city_id: filters.cityId,
      p_tag_ids: filters.tagIds.length > 0 ? filters.tagIds : null,
    });

    if (error) {
      console.error("Lỗi lọc tin đăng:", error);
      showError("Không thể tải tin đăng.");
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [activeCategory, filters]);

  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: favorites } = await supabase.from('favorites').select('post_id').eq('user_id', user.id);
        if (favorites) {
          setFavoritePostIds(new Set(favorites.map(f => f.post_id)));
        }
      }
    };
    fetchFavorites();
  }, []);

  const handleFavoriteToggle = async (postId: string, isCurrentlyFavorited: boolean) => {
    // ... implementation
  };
  
  const handleViewPost = async (postId: string) => {
    await supabase.rpc('increment_view_count', { post_id_to_update: postId });
    navigate(`/posts/${postId}`);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="text-center my-8">
        <h1 className="text-3xl md:text-4xl font-bold">{t('homePage.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('homePage.subtitle')}</p>
      </div>
      <div className="max-w-2xl mx-auto mb-8">
        <PostSearch />
      </div>
      <div className="flex justify-between items-center mb-4">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full md:w-auto">
          <TabsList>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="hidden md:block">
          <PostFilters onFiltersApply={setFilters} />
        </div>
      </div>
      <div className="md:hidden mb-4">
        <PostFilters onFiltersApply={setFilters} />
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
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">{t('homePage.noPosts')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;