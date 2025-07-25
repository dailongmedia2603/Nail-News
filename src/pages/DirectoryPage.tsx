import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { showError } from '@/utils/toast';
import { type Post } from '@/components/PostCard';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Component for the 3-column layout
const ThreeColumnDirectoryLayout = ({ posts }: { posts: Post[] }) => {
  const [selectedLocation, setSelectedLocation] = useState<{ state: string; city: string | null } | null>(null);

  const groupedByLocation = useMemo(() => {
    return posts.reduce((acc, post) => {
      const locationParts = post.location?.split(',').map(p => p.trim());
      const city = locationParts?.[0] || 'Chưa xác định';
      const state = locationParts?.[1] || 'Chưa xác định';
      if (state === 'Chưa xác định') return acc;

      if (!acc[state]) acc[state] = {};
      if (!acc[state][city]) acc[state][city] = [];
      acc[state][city].push(post);
      return acc;
    }, {} as { [state: string]: { [city: string]: Post[] } });
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!selectedLocation) return posts;
    if (selectedLocation.city) {
      return groupedByLocation[selectedLocation.state]?.[selectedLocation.city] || [];
    }
    return Object.values(groupedByLocation[selectedLocation.state] || {}).flat();
  }, [selectedLocation, posts, groupedByLocation]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Left Column: Navigation */}
      <div className="lg:col-span-1">
        <div className="space-y-2">
          <button
            className={cn(
              "w-full text-left p-2 text-sm font-semibold hover:bg-muted rounded-md",
              !selectedLocation && "bg-muted"
            )}
            onClick={() => setSelectedLocation(null)}
          >
            Tất cả ({posts.length})
          </button>
          {Object.keys(groupedByLocation).sort().map(state => (
            <div key={state}>
              <h3 
                className="font-semibold bg-muted p-2 rounded-t-md cursor-pointer"
                onClick={() => setSelectedLocation({ state, city: null })}
              >
                {state}
              </h3>
              <ul className="pl-2 border-l border-r border-b rounded-b-md">
                {Object.keys(groupedByLocation[state]).sort().map(city => (
                  <li key={city}>
                    <button 
                      className={cn(
                        "w-full text-left p-2 text-sm hover:bg-muted/50",
                        selectedLocation?.city === city && "bg-muted"
                      )}
                      onClick={() => setSelectedLocation({ state, city })}
                    >
                      {city} ({groupedByLocation[state][city].length})
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Center Column: Listings */}
      <div className="lg:col-span-2">
        <div className="space-y-4">
          {filteredPosts.map(post => (
            <div key={post.id}>
              <Link to={`/posts/${post.id}`} className="font-semibold text-primary hover:underline">
                {post.title}
              </Link>
              <p className="text-sm text-muted-foreground">{post.exact_address || post.location}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Ads */}
      <div className="lg:col-span-1 space-y-4">
        <Card><CardContent className="p-2"><img src="https://placehold.co/300x150/FBBF24/FFFFFF?text=Quang+Cao" alt="Ad 1" className="w-full rounded-md" /></CardContent></Card>
        <Card><CardContent className="p-2"><img src="https://placehold.co/300x150/3B82F6/FFFFFF?text=Banner" alt="Ad 2" className="w-full rounded-md" /></CardContent></Card>
        <Card><CardContent className="p-2"><img src="https://placehold.co/300x150/10B981/FFFFFF?text=Khuyen+Mai" alt="Ad 3" className="w-full rounded-md" /></CardContent></Card>
      </div>
    </div>
  );
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
  const activeCategory = tabSlugs[activeTab as keyof typeof tabSlugs];

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

  const handleTabChange = (slug: string) => {
    setSearchParams({ tab: slug });
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
            <CardTitle>{activeCategory}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <>
                <TabsContent value="nail-salons" className="mt-0"><ThreeColumnDirectoryLayout posts={posts.filter(p => p.category === 'Tiệm nail')} /></TabsContent>
                <TabsContent value="nail-supply" className="mt-0"><ThreeColumnDirectoryLayout posts={posts.filter(p => p.category === 'Nail supply')} /></TabsContent>
                <TabsContent value="beauty-school" className="mt-0"><ThreeColumnDirectoryLayout posts={posts.filter(p => p.category === 'Beauty school')} /></TabsContent>
              </>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default DirectoryPage;