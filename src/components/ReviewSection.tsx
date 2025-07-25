import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Loader2, Trash2, Star, Pencil } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { User } from '@supabase/supabase-js';

export type Review = {
  id: number;
  created_at: string;
  content: string;
  author_id: string;
  author_name: string | null;
  rating: number | null;
};

interface ReviewSectionProps {
  postId: string;
  reviews: Review[];
  onReviewSubmit: () => void;
}

export function ReviewSection({ postId, reviews, onReviewSubmit }: ReviewSectionProps) {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setIsAdmin(profile?.role === 'admin');
      }
    };
    getUser();
  }, []);

  const userReview = useMemo(() => {
    return reviews.find(review => review.author_id === currentUser?.id);
  }, [reviews, currentUser]);

  const otherReviews = useMemo(() => {
    return reviews.filter(review => review.author_id !== currentUser?.id);
  }, [reviews, currentUser]);

  const handleEditClick = () => {
    if (userReview) {
      setIsEditing(true);
      setContent(userReview.content);
      setRating(userReview.rating || 0);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setContent('');
    setRating(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() === '' || rating === 0) {
      showError('Vui lòng chọn số sao và viết đánh giá của bạn.');
      return;
    }

    setIsSubmitting(true);
    const toastId = showLoading(isEditing ? "Đang cập nhật..." : "Đang gửi...");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      dismissToast(toastId);
      showError('Bạn cần đăng nhập để đánh giá.');
      setIsSubmitting(false);
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single();
    const authorName = `${profile?.first_name || 'Người dùng'} ${profile?.last_name || ''}`.trim();

    const reviewData = {
      post_id: postId,
      author_id: user.id,
      content: content,
      author_name: authorName,
      rating: rating,
    };

    let error;
    if (isEditing && userReview) {
      ({ error } = await supabase.from('comments').update(reviewData).eq('id', userReview.id));
    } else {
      ({ error } = await supabase.from('comments').insert(reviewData));
    }

    dismissToast(toastId);
    if (error) {
      showError(error.code === '23505' ? 'Bạn đã đánh giá tin này rồi.' : 'Đã xảy ra lỗi.');
    } else {
      showSuccess(isEditing ? 'Cập nhật thành công!' : 'Gửi đánh giá thành công!');
      setContent('');
      setRating(0);
      setIsEditing(false);
      onReviewSubmit();
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (reviewId: number) => {
    const { error } = await supabase.from('comments').delete().eq('id', reviewId);
    if (error) {
      showError("Xóa đánh giá thất bại.");
    } else {
      showSuccess("Đã xóa đánh giá.");
      onReviewSubmit();
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'ND';
    const parts = name.split(' ');
    const first = parts[0]?.charAt(0) || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) : '';
    return `${first}${last}`.toUpperCase();
  };

  const renderReview = (review: Review) => (
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
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: vi })}</p>
            {(isAdmin || currentUser?.id === review.author_id) && (
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
                    <AlertDialogAction onClick={() => handleDelete(review.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        <p className="text-sm whitespace-pre-wrap mt-2">{review.content}</p>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đánh giá ({reviews.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {currentUser && (userReview && !isEditing ? (
          <div className="p-4 border rounded-md bg-muted/50">
            <div className="flex justify-between items-center">
              <p className="font-semibold">Đánh giá của bạn</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={handleEditClick}><Pencil className="h-4 w-4" /></Button>
              </div>
            </div>
            {renderReview(userReview)}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <Textarea placeholder="Viết đánh giá của bạn..." value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Cập nhật' : 'Gửi đánh giá'}
              </Button>
              {isEditing && <Button type="button" variant="outline" onClick={handleCancelEdit}>Hủy</Button>}
            </div>
          </form>
        ))}
        <Separator className="my-6" />
        <div className="space-y-6">
          {otherReviews.length > 0 ? (
            otherReviews.map(renderReview)
          ) : (
            !userReview && <p className="text-sm text-muted-foreground text-center">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}