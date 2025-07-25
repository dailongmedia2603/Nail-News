import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { type Post } from "@/components/PostCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewSection, type Review } from "@/components/ReviewSection";
import { showError } from "@/utils/toast";

const AlbumDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<Post | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      showError('Không thể tải đánh giá.');
    } else {
      setReviews(data || []);
    }
  };

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Lỗi tải album:", error);
      } else {
        setAlbum(data);
        await fetchReviews();
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
        {album.description && <p className="text-muted-foreground mt-2">{album.description}</p>}
      </div>

      <div>
        <Carousel className="w-full">
          <CarouselContent>
            {album.images?.map((media, index) => (
              <CarouselItem key={index}>
                <Card>
                  <CardContent className="flex aspect-video items-center justify-center p-0">
                    {media.includes('.mp4') || media.includes('.mov') ? (
                       <video src={media} className="rounded-lg object-contain w-full h-full" controls />
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

      <ReviewSection postId={id} reviews={reviews} onReviewSubmit={fetchReviews} />
    </div>
  );
};

export default AlbumDetailPage;