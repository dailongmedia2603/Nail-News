import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { PostCard, type Post } from "@/components/PostCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/utils/toast";
import { PostSearch } from "@/components/PostSearch";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categories = ["Tất cả", "Bán tiệm", "Cần thợ", "Học nail"];

type State = { id: number; name: string; };
type City = { id: number; name: string; state_id: number; };

const HomePage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [favoritePostIds, setFavoritePostIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filterState, setFilterState] = useState('');
  const [filterCity, setFilterCity] = useState('');

  const filteredCities = filterState ? cities.filter(c => c.state_id === parseInt(filterState)) : [];

  const fetchPostsAndFavorites = async () => {
    setLoading(true);
    
    let query = supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (activeCategory !== "Tất cả") {
      query = query.eq("category", activeCategory);
    }
    if (filterState) {
        const selectedStateName = states.find(s => s.id === parseInt(filterState))?.name;
        if(selectedStateName) query = query.like('location', `%${selectedStateName}%`);
    }
    if (filterCity) {
        const selectedCityName = cities.find(c => c.id === parseInt(filterCity))?.name;
        if(selectedCityName) query = query.like('location', `%${selectedCityName}%`);
    }
    
    const { data: postData, error: postError } = await query;

    if (postError) {
      console.error("Lỗi tải tin đăng:", postError);
      showError("Không thể tải tin đăng.");
    } else {
      setPosts(postData || []);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: favorites, error: favError } = await supabase
        .from('favorites')
        .select('post_id')
        .eq('user_id', user.id);
      
      if (favError) {
        console.error("Lỗi tải danh sách yêu thích:", favError);
      } else {
        setFavoritePostIds(new Set(favorites.map(f => f.post_id)));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const { data: statesData } = await supabase.from('states').select('*').order('name');
      const { data: citiesData } = await supabase.from('cities').select('*').order('name');
      setStates(statesData || []);
      setCities(citiesData || []);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPostsAndFavorites();
  }, [activeCategory, filterState, filterCity]);

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

  const handleViewPost = async (postId: string) => {
    await supabase.rpc('increment_view_count', { post_id_to_update: postId });
    navigate(`/posts/${postId}`);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="text-center my-8">
        <h1 className="text-3xl md:text-4xl font-bold">Tìm kiếm tin tức ngành Nail</h1>
        <p className="text-muted-foreground mt-2">Khám phá các cơ hội bán tiệm, việc làm và đào tạo mới nhất.</p>
      </div>
      <div className="max-w-2xl mx-auto mb-8">
        <PostSearch />
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <Select value={filterState} onValueChange={(value) => { setFilterState(value); setFilterCity(''); }}>
          <SelectTrigger><SelectValue placeholder="Lọc theo tiểu bang" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả tiểu bang</SelectItem>
            {states.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCity} onValueChange={setFilterCity} disabled={!filterState}>
          <SelectTrigger><SelectValue placeholder="Lọc theo thành phố" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tất cả thành phố</SelectItem>
            {filteredCities.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <div className="mt-6">
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
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
                            <p className="text-muted-foreground">Không tìm thấy tin đăng nào trong danh mục này.</p>
                        </div>
                    )}
                </>
            )}
        </div>
      </Tabs>
    </div>
  );
};

export default HomePage;