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
};

const BlogPage = () => {
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, created_at, title, content')
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
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : posts.length > 0 ? (
        <div className="space-y-8">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <CardTitle>
                  <Link to={`/blog/${post.id}`} className="hover:underline">{post.title}</Link>
                </CardTitle>
                <CardDescription>{format(new Date(post.created_at), 'dd/MM/yyyy')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-muted-foreground">
                  {post.content?.substring(0, 300) || 'Chưa có nội dung...'}
                </p>
              </CardContent>
              <CardFooter>
                <Link to={`/blog/${post.id}`} className="text-sm font-semibold text-primary flex items-center gap-1">
                  Đọc tiếp <ArrowRight className="h-4 w-4" />
                </Link>
              </CardFooter>
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