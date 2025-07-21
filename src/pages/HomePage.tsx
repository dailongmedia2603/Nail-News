import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { PostCard, type Post } from "@/components/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const categories = ["Tất cả", "Bán tiệm", "Cần thợ", "Học nail"];

const HomePage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tất cả");

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      let query = supabase.from("posts").select("*").order("created_at", { ascending: false });

      if (activeCategory !== "Tất cả") {
        query = query.eq("category", activeCategory);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Lỗi tải tin đăng:", error);
      } else {
        setPosts(data);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [activeCategory]);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="text-center my-8">
        <h1 className="text-3xl md:text-4xl font-bold">Tìm kiếm tin tức ngành Nail</h1>
        <p className="text-muted-foreground mt-2">Khám phá các cơ hội bán tiệm, việc làm và đào tạo mới nhất.</p>
      </div>

      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex gap-2">
          <Input placeholder="Tìm theo địa điểm, ZIP code, hoặc ID tin..." />
          <Button disabled>
            <Search className="h-4 w-4 mr-2" />
            Tìm kiếm
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 ml-1">
            *Tính năng tìm kiếm sẽ sớm được ra mắt.
        </p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
            {!loading && posts.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">Không tìm thấy tin đăng nào trong danh mục này.</p>
                </div>
            )}
        </div>
      </Tabs>
    </div>
  );
};

export default HomePage;