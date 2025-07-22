import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { type Post } from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Square, Armchair, Table, Users, DollarSign, Clock, CheckCircle, Share2, Store, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { showSuccess } from '@/utils/toast';
import { CommentSection } from '@/components/CommentSection';
import { Badge } from '@/components/ui/badge';

type Tag = { id: number; name: string; };

const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
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

      const { data: tagData, error: tagError } = await supabase
        .from('post_tags')
        .select('tags(id, name)')
        .eq('post_id', id);
      
      if (!tagError) {
        setTags(tagData.map((item: any) => item.tags));
      }

      setLoading(false);
    };

    fetchPost();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showSuccess("Đã sao chép liên kết vào bộ nhớ tạm!");
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !post || !id) {
    return <div className="container mx-auto p-4 md:p-6 text-center text-red-500">{error || 'Không tìm thấy tin đăng.'}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <div className="space-y-6">
        {/* ... other sections ... */}
        {tags.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Tag & Từ khóa</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
              ))}
            </CardContent>
          </Card>
        )}
        <CommentSection postId={id} />
      </div>
    </div>
  );
};

export default PostDetailPage;