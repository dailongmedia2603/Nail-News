import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

type BlogPostSummary = {
  id: string;
  created_at: string;
  title: string;
  content: string | null;
  cover_image_url: string | null;
};

const BlogPage = () => {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, created_at, title, content, cover_image_url')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Lỗi tải bài viết blog:", error);
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6">
      <div className="text-center my-8">
        <h1 className="text-3xl md:text-4xl font-bold">Blog NailNews</h1>
        <p className="text-muted-foreground mt-2">Chia sẻ kiến thức, mẹo và xu hướng mới nhất trong ngành nail.</p>
      </div>
      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-8">
          {posts.map((post) => (
            <Card key={post.id} className="flex flex-col md:flex-row overflow-hidden">
              {post.cover_image_url && (
                <img src={post.cover_image_url} alt={post.title} className="w-full md:w-1/3 h-48 md:h-auto object-cover" />
              )}
              <div className="flex flex-col justify-between p-6">
                <div>
                  <CardTitle>
                    <Link to={`/blog/${post.id}`} className="hover:underline">{post.title}</Link>
                  </CardTitle>
                  <CardDescription className="mt-2">{format(new Date(post.created_at), 'dd/MM/yyyy')}</CardDescription>
                  <CardContent className="p-0 mt-4">
                    <p className="line-clamp-2 text-muted-foreground">
                      {(post.content || '').replace(/<[^>]+>/g, '').substring(0, 200) || 'Chưa có nội dung...'}
                    </p>
                  </CardContent>
                </div>
                <CardFooter className="p-0 mt-4">
                  <Link to={`/blog/${post.id}`} className="text-sm font-semibold text-primary flex items-center gap-1">
                    Đọc tiếp <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardFooter>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Chưa có bài viết nào được xuất bản.</p>
        </div>
      )}
    </div>
  );
};

export default BlogPage;