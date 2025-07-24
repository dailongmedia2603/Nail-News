import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { showError } from '@/utils/toast';
import { type Post } from '@/components/PostCard';
import { Link } from 'react-router-dom';

type GroupedPosts = {
  [state: string]: Post[];
};

const DirectoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const tabSlugs = {
    'nail-salons': 'Tiệm nail',
    'nail-supply': 'Nail supply',
    'beauty-school': 'Beauty school',
  };

  const activeTab = searchParams.get('tab') || 'nail-salons';

  useEffect(() => {
    const fetchDirectoryPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .in('category', ['Tiệm nail', 'Nail supply', 'Beauty school']);

      if (error) {
        showError('Không thể tải dữ liệu danh bạ.');
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    };
    fetchDirectoryPosts();
  }, []);

  const groupedPosts = useMemo(() => {
    return posts.reduce((acc, post) => {
      const category = post.category || 'Unknown';
      const state = post.location?.split(',')[1]?.trim() || 'Chưa xác định';
      
      if (!acc[category]) acc[category] = {};
      if (!acc[category][state]) acc[category][state] = [];
      
      acc[category][state].push(post);
      return acc;
    }, {} as Record<string, GroupedPosts>);
  }, [posts]);

  const handleTabChange = (slug: string) => {
    setSearchParams({ tab: slug });
  };

  const renderPostList = (category: string) => {
    const categoryPosts = groupedPosts[category];
    if (!categoryPosts || Object.keys(categoryPosts).length === 0) {
      return <p className="text-muted-foreground text-center py-8">Chưa có tin đăng nào trong mục này.</p>;
    }

    return (
      <div className="space-y-6">
        {Object.keys(categoryPosts).sort().map(state => (
          <div key={state}>
            <h3 className="text-xl font-semibold border-b pb-2 mb-4">{state}</h3>
            <ul className="space-y-3">
              {categoryPosts[state].map(post => (
                <li key={post.id}>
                  <Link to={`/posts/${post.id}`} className="text-primary hover:underline">
                    {post.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">{post.exact_address || post.location}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nail-salons">Tiệm Nail</TabsTrigger>
          <TabsTrigger value="nail-supply">Nail Supply</TabsTrigger>
          <TabsTrigger value="beauty-school">Beauty School</TabsTrigger>
        </TabsList>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>{tabSlugs[activeTab as keyof typeof tabSlugs]}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <>
                <TabsContent value="nail-salons" className="mt-0">{renderPostList('Tiệm nail')}</TabsContent>
                <TabsContent value="nail-supply" className="mt-0">{renderPostList('Nail supply')}</TabsContent>
                <TabsContent value="beauty-school" className="mt-0">{renderPostList('Beauty school')}</TabsContent>
              </>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default DirectoryPage;