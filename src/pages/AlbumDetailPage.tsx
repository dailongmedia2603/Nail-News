import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { type Post } from "@/components/PostCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentSection } from "@/components/CommentSection";
import { type Review as Comment } from "@/components/ReviewSection";
import { showError } from "@/utils/toast";
import { VideoPlayer } from "@/components/VideoPlayer";

const AlbumDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      showError('Không thể tải bình luận.');
    } else {
      setComments(data || []);
    }
  };

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!id) return;
      setLoading(true);

      // Increment view count
      await supabase.rpc('increment_view_count', { post_id_to_update: id });

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Lỗi tải album:", error);
      } else {
        setAlbum(data);
        await fetchComments();
      }
      setLoading(false);
    };
    fetchAlbum();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl p-4 md:p-6 space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="aspect-video w-full" />
      </div>
    );
  }

  if (!album || !id) {
    return <div className="text-center py-16">Không tìm thấy album.</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6 space-y-8">
      <div>
        <Button asChild variant="ghost" className="mb-4 -ml-4">
          <Link to="/photo-video">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại thư viện
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{album.title}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            {album.description && <p>{album.description}</p>}
            <div className="flex items-center"><Eye className="mr-1 h-4 w-4" /> {album.view_count} lượt xem</div>
        </div>
      </div>

      <div>
        <Carousel className="w-full">
          <CarouselContent>
            {album.images?.map((media, index) => (
              <CarouselItem key={index}>
                <Card>
                  <CardContent className="flex aspect-video items-center justify-center p-0">
                    {media.includes('youtube.com') || media.includes('youtu.be') ? (
                      <VideoPlayer videoId={media.split('v=')[1] || media.split('/').pop()!} />
                    ) : (
                       <img src={media} alt={`Ảnh ${index + 1}`} className="rounded-lg object-contain w-full h-full" />
                    )}
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      <CommentSection postId={id} reviews={comments} onReviewSubmit={fetchComments} />
    </div>
  );
};

export default AlbumDetailPage;