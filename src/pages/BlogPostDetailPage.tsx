import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

type BlogPost = {
  id: string;
  created_at: string;
  title: string;
  content: string | null;
  cover_image_url: string | null;
};

const BlogPostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (error) {
        console.error("Lỗi tải bài viết:", error);
      }
      setPost(data);
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl p-4 md:p-6 space-y-4">
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-40 w-full mt-4" />
      </div>
    );
  }

  if (!post) {
    return <div className="text-center py-16">Không tìm thấy bài viết.</div>;
  }

  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-6">
      <article className="prose dark:prose-invert max-w-none">
        <h1 className="mb-2">{post.title}</h1>
        <p className="text-sm text-muted-foreground mt-0">
          Đăng ngày {format(new Date(post.created_at), 'dd/MM/yyyy')}
        </p>
        {post.cover_image_url && (
          <img src={post.cover_image_url} alt={post.title} className="w-full rounded-lg my-8" />
        )}
        <div dangerouslySetInnerHTML={{ __html: post.content || '' }} />
      </article>
    </div>
  );
};

export default BlogPostDetailPage;