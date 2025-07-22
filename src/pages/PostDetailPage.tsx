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
        {/* Header */}
        <div>
            <div className="flex justify-between items-start">
                <h1 className="text-3xl md:text-4xl font-bold">{post.title}</h1>
                <Button onClick={handleShare} variant="outline" size="icon">
                    <Share2 className="h-5 w-5" />
                </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
                {post.location && <div className="flex items-center"><MapPin className="mr-1 h-4 w-4" /> {post.location}</div>}
                <div className="flex items-center"><Calendar className="mr-1 h-4 w-4" /> Đăng ngày {format(new Date(post.created_at), 'dd/MM/yyyy')}</div>
                <div className="flex items-center"><Eye className="mr-1 h-4 w-4" /> {post.view_count} lượt xem</div>
            </div>
        </div>

        {/* Image Gallery */}
        {post.images && post.images.length > 0 && (
            <Carousel className="w-full">
                <CarouselContent>
                    {post.images.map((img, index) => (
                        <CarouselItem key={index}>
                            <Card>
                                <CardContent className="flex aspect-video items-center justify-center p-0">
                                    <img src={img} alt={`Hình ảnh tiệm ${index + 1}`} className="rounded-lg object-cover w-full h-full" />
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        )}

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader><CardTitle>Mô tả chi tiết</CardTitle></CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                        <p>{post.description}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                {post.category === 'Bán tiệm' && (
                    <>
                        <Card>
                            <CardHeader><CardTitle>Thông tin cơ bản</CardTitle></CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center"><Square className="mr-2 h-4 w-4 text-muted-foreground" /> Diện tích: <strong>{post.area || 'N/A'}</strong></div>
                                <div className="flex items-center"><Armchair className="mr-2 h-4 w-4 text-muted-foreground" /> Số ghế: <strong>{post.chairs || 'N/A'}</strong></div>
                                <div className="flex items-center"><Table className="mr-2 h-4 w-4 text-muted-foreground" /> Số bàn: <strong>{post.tables || 'N/A'}</strong></div>
                                <div className="flex items-center"><Users className="mr-2 h-4 w-4 text-muted-foreground" /> Nhân sự: <strong>{post.staff || 'N/A'}</strong></div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Thông tin quy mô</CardTitle></CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-muted-foreground" /> Doanh thu: <strong>{post.revenue || 'N/A'}</strong></div>
                                <div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" /> Giờ hoạt động: <strong>{post.operating_hours || 'N/A'}</strong></div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {post.category === 'Cần thợ' && (
                    <Card>
                        <CardHeader><CardTitle>Thông tin công việc</CardTitle></CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center"><DollarSign className="mr-2 h-4 w-4 text-muted-foreground" /> Lương: <strong>{post.salary_info || 'N/A'}</strong></div>
                            <div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" /> Giờ hoạt động: <strong>{post.operating_hours || 'N/A'}</strong></div>
                            <div className="flex items-center"><Store className="mr-2 h-4 w-4 text-muted-foreground" /> Trạng thái tiệm: <strong>{post.store_status || 'N/A'}</strong></div>
                        </CardContent>
                    </Card>
                )}

                {post.services && post.services.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>Dịch vụ kinh doanh</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="space-y-2 pl-1 text-sm">
                                {post.services.map(service => <li key={service} className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-green-500" /> {service}</li>)}
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
        
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

        <CommentSection postId={id} />
      </div>
    </div>
  );
};

export default PostDetailPage;