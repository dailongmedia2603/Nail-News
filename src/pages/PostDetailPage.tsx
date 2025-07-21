import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { type Post } from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Lỗi tải tin đăng:', error);
        setError('Không thể tải tin đăng này.');
      } else {
        setPost(data);
      }
      setLoading(false);
    };

    fetchPost();
  }, [id]);

  const getCategoryVariant = (category: string | null) => {
    switch (category) {
      case "Bán tiệm": return "default";
      case "Cần thợ": return "destructive";
      case "Học nail": return "secondary";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !post) {
    return <div className="container mx-auto p-4 md:p-6 text-center text-red-500">{error || 'Không tìm thấy tin đăng.'}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">{post.title}</CardTitle>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground pt-4">
            {post.category && <Badge variant={getCategoryVariant(post.category)} className="w-fit">{post.category}</Badge>}
            {post.location && <div className="flex items-center"><MapPin className="mr-1 h-4 w-4" /> {post.location}</div>}
            <div className="flex items-center"><Calendar className="mr-1 h-4 w-4" /> {format(new Date(post.created_at), 'dd/MM/yyyy')}</div>
          </div>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap">{post.description}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostDetailPage;