import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { showError, showSuccess } from '@/utils/toast';
import { Loader2, Trash2, Star } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Review = {
  id: number;
  created_at: string;
  content: string;
  author_id: string;
  author_name: string | null;
  rating: number | null;
};

interface ReviewSectionProps {
  postId: string;
}

export function ReviewSection({ postId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role === 'admin') {
          setIsAdmin(true);
        }
      }
    };
    checkAdminStatus();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      showError('Không thể tải đánh giá.');
      console.error(error);
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [postId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newReview.trim() === '' || rating === 0) {
      showError('Vui lòng chọn số sao và viết đánh giá của bạn.');
      return;
    }

    setIsSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError('Bạn cần đăng nhập để đánh giá.');
      setIsSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const authorName = `${profile?.first_name || 'Người dùng'} ${profile?.last_name || ''}`.trim();

    const { error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content: newReview,
        author_name: authorName,
        rating: rating,
      });

    if (error) {
      showError('Gửi đánh giá thất bại.');
    } else {
      setNewReview('');
      setRating(0);
      fetchReviews();
    }
    setIsSubmitting(false);
  };

  const handleDeleteReview = async (reviewId: number) => {
    const { error } = await supabase.from('comments').delete().eq('id', reviewId);
    if (error) {
      showError("Xóa đánh giá thất bại.");
    } else {
      showSuccess("Đã xóa đánh giá.");
      setReviews(reviews.filter(r => r.id !== reviewId));
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'ND';
    const parts = name.split(' ');
    const first = parts[0]?.charAt(0) || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) : '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Đánh giá</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="h-6 w-6 cursor-pointer transition-colors"
                fill={(hoverRating || rating) >= star ? '#facc15' : 'none'}
                stroke={(hoverRating || rating) >= star ? '#facc15' : 'currentColor'}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
          <Textarea placeholder="Viết đánh giá của bạn..." value={newReview} onChange={(e) => setNewReview(e.target.value)} rows={3} />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gửi đánh giá
          </Button>
        </form>
        <Separator className="my-6" />
        <div className="space-y-6">
          {loading ? ( <p>Đang tải đánh giá...</p> ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="flex items-start space-x-4 group">
                <Avatar>
                  <AvatarImage />
                  <AvatarFallback>{getInitials(review.author_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{review.author_name || 'Người dùng'}</p>
                      {review.rating && (
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} className="h-4 w-4" fill={review.rating! >= star ? '#facc15' : 'none'} stroke={review.rating! >= star ? '#facc15' : 'currentColor'} />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: vi })}</p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap mt-2">{review.content}</p>
                </div>
                {isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                        <AlertDialogDescription>Hành động này không thể hoàn tác. Đánh giá này sẽ bị xóa vĩnh viễn.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteReview(review.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}