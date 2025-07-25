import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { showError } from '@/utils/toast';
import { type Post } from '@/components/PostCard';
import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronRight } from 'lucide-react';

type GroupedData = {
  [category: string]: {
    [state: string]: {
      [city: string]: Post[];
    };
  };
};

const DirectoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<{ category: string; state: string; city: string } | null>(null);

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

  const groupedPosts = useMemo(() => {
    return posts.reduce((acc, post) => {
      const category = post.category || 'Unknown';
      const locationParts = post.location?.split(',').map(p => p.trim());
      const city = locationParts?.[0] || 'Chưa xác định';
      const state = locationParts?.[1] || 'Chưa xác định';

      if (!acc[category]) acc[category] = {};
      if (!acc[category][state]) acc[category][state] = {};
      if (!acc[category][state][city]) acc[category][state][city] = [];
      
      acc[category][state][city].push(post);
      return acc;
    }, {} as GroupedData);
  }, [posts]);

  const handleTabChange = (slug: string) => {
    setSearchParams({ tab: slug });
    setSelectedCity(null); // Reset selection when changing tabs
  };

  const handleCityClick = (category: string, state: string, city: string) => {
    setSelectedCity({ category, state, city });
  };

  const renderDirectory = (category: string) => {
    const categoryPosts = groupedPosts[category];
    if (!categoryPosts || Object.keys(categoryPosts).length === 0) {
      return <p className="text-muted-foreground text-center py-8">Chưa có tin đăng nào trong mục này.</p>;
    }

    const postsForSelectedCity = selectedCity && selectedCity.category === category
      ? categoryPosts[selectedCity.state]?.[selectedCity.city] || []
      : [];

    return (
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Accordion type="multiple" className="w-full">
            {Object.keys(categoryPosts).sort().map(state => (
              <AccordionItem key={state} value={state}>
                <AccordionTrigger>{state}</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 pl-2">
                    {Object.keys(categoryPosts[state]).sort().map(city => (
                      <li key={city}>
                        <button
                          className="w-full text-left p-2 rounded-md hover:bg-muted flex justify-between items-center text-sm"
                          onClick={() => handleCityClick(category, state, city)}
                        >
                          <span>{city} ({categoryPosts[state][city].length})</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div className="md:col-span-2">
          {selectedCity && selectedCity.category === category ? (
            <div>
              <h3 className="text-xl font-semibold mb-4">
                {selectedCity.city}, {selectedCity.state}
              </h3>
              <div className="space-y-4">
                {postsForSelectedCity.map(post => (
                  <div key={post.id} className="p-3 rounded-md border hover:bg-muted">
                    <Link to={`/posts/${post.id}`} className="font-semibold text-primary hover:underline">
                      {post.title}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">{post.exact_address || post.location}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Chọn một thành phố để xem danh sách</p>
            </div>
          )}
        </div>
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
            <CardTitle>{activeCategory}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <>
                <TabsContent value="nail-salons" className="mt-0">{renderDirectory('Tiệm nail')}</TabsContent>
                <TabsContent value="nail-supply" className="mt-0">{renderDirectory('Nail supply')}</TabsContent>
                <TabsContent value="beauty-school" className="mt-0">{renderDirectory('Beauty school')}</TabsContent>
              </>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default DirectoryPage;