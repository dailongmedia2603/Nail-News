import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { PostCard, type Post } from "@/components/PostCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/utils/toast";
import { PostSearch } from "@/components/PostSearch";
import { PostFilters } from "@/components/PostFilters";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { saveActiveCategory, loadActiveCategory, saveFilters, loadFilters } from '@/lib/search-storage';
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Session } from "@supabase/supabase-js";

const categories = [
  { value: "Tất cả", key: "postCategories.all" },
  { value: "Bán tiệm", key: "postCategories.sellSalon" },
  { value: "Cần thợ", key: "postCategories.needTech" },
  { value: "Dịch vụ", key: "postCategories.services" },
  { value: "Tiệm nail", key: "postCategories.nailSalons", slug: "nail-salons", isDirectory: true },
  { value: "Nail supply", key: "postCategories.nailSupply", slug: "nail-supply", isDirectory: true },
  { value: "Renew license", key: "postCategories.renewLicense", slug: "/renew-license", isDirectory: true },
  { value: "Photo, video", key: "postCategories.photoVideo", slug: "/photo-video", isDirectory: true },
  { value: "Beauty school", key: "postCategories.beautySchool", slug: "beauty-school", isDirectory: true },
];

const HomePage = () => {
  const { t } = useTranslation();
  const [paidPosts, setPaidPosts] = useState<Post[]>([]);
  const [regularPosts, setRegularPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>(loadActiveCategory);
  const [filters, setFilters] = useState<{ stateId: number | null; cityId: number | null; tagIds: number[] }>(loadFilters);
  const [favoritePostIds, setFavoritePostIds] = useState<Set<string>>(new Set());
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    
    let query = supabase.from('posts').select('*');

    if (activeCategory !== 'Tất cả') {
      query = query.eq('category', activeCategory);
    } else {
      query = query.in('category', ['Bán tiệm', 'Cần thợ', 'Dịch vụ']);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Lỗi lọc tin đăng:", error);
      showError("Không thể tải tin đăng.");
      setPaidPosts([]);
      setRegularPosts([]);
    } else {
      const fetchedPosts = data || [];
      const now = new Date();

      const allPaidPosts = fetchedPosts.filter(p => 
          (p.tier === 'vip' || p.tier === 'urgent') && 
          p.expires_at && 
          new Date(p.expires_at) > now
      ).sort((a, b) => {
          if (a.tier === 'vip' && b.tier !== 'vip') return -1;
          if (a.tier !== 'vip' && b.tier === 'vip') return 1;
          return 0;
      });

      const paidPostIds = new Set(allPaidPosts.map(p => p.id));
      const allRegularPosts = fetchedPosts.filter(p => !paidPostIds.has(p.id));

      setPaidPosts(allPaidPosts);
      setRegularPosts(allRegularPosts);
    }
    setLoading(false);
  };

  useEffect(() => {
    saveActiveCategory(activeCategory);
    saveFilters(filters);
    if (!categories.find(c => c.value === activeCategory)?.isDirectory) {
      fetchPosts();
    }
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

  const handleCategoryChange = (value: string) => {
    const category = categories.find(c => c.value === value);
    if (category?.isDirectory) {
      if (category.slug?.startsWith('/')) {
        navigate(category.slug);
      } else {
        navigate(`/directory?tab=${category.slug}`);
      }
    } else {
      setActiveCategory(value);
    }
  };

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

  const showNoPostsMessage = (session && paidPosts.length === 0 && regularPosts.length === 0) || (!session && regularPosts.length === 0);

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
        <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="w-full md:w-auto">
          <TabsList className="flex flex-wrap h-auto">
            {categories.map((category) => (
              <TabsTrigger key={category.value} value={category.value}>
                {t(category.key)}
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
            {[...Array(9)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[220px] w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {session && paidPosts.length > 0 && (
              <section className="mb-12">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold flex items-center">
                    <Star className="mr-2 h-6 w-6 text-yellow-500" />
                    {t('homePage.featuredPosts')}
                  </h2>
                  {paidPosts.length > 6 && (
                    <Button asChild variant="link">
                      <Link to="/featured">{t('homePage.viewAll')}</Link>
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paidPosts.slice(0, 6).map((post) => (
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
              </section>
            )}

            {regularPosts.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">
                  {t('homePage.latestPosts')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularPosts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      isFavorited={favoritePostIds.has(post.id)}
                      onFavoriteToggle={handleFavoriteToggle}
                      onView={handleViewPost}
                    />
                  ))}
                </div>
              </section>
            )}

            {showNoPostsMessage && (
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