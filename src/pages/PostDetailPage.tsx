import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { type Post } from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Square, Armchair, Table, Users, DollarSign, Clock, CheckCircle, Share2, Store } from 'lucide-react';
import { format } from 'date-fns';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { showSuccess } from '@/utils/toast';
import { CommentSection } from '@/components/CommentSection';

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
        {/* ... Post details ... */}
        
        {/* Location */}
        <Card>
            <CardHeader><CardTitle>Vị trí</CardTitle></CardHeader>
            <CardContent>
                <p className="text-sm mb-4"><strong>Địa chỉ:</strong> {post.exact_address || post.location || 'Chưa cung cấp'}</p>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground text-center p-4">
                        Bản đồ sẽ sớm được tích hợp.<br/>
                        (Cần API Key từ Google Maps Platform để hiển thị)
                    </p>
                </div>
            </CardContent>
        </Card>

        {/* Comment Section */}
        <CommentSection postId={id} />
      </div>
    </div>
  );
};

export default PostDetailPage;