import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { showError } from '@/utils/toast';
import type { User } from '@supabase/supabase-js';
import { StarRatingDisplay } from './StarRatingDisplay';

interface AlbumRatingProps {
  postId: string;
}

export function AlbumRating({ postId }: AlbumRatingProps) {
  const [ratingCount, setRatingCount] = useState(0);
  const [userHasRated, setUserHasRated] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoverRating, setHoverRating] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data, error, count } = await supabase
        .from('album_ratings')
        .select('*', { count: 'exact' })
        .eq('post_id', postId);

      if (error) {
        showError("Không thể tải dữ liệu đánh giá.");
      } else {
        setRatingCount(count || 0);
        if (user) {
          const userReview = data.find(r => r.user_id === user.id);
          if (userReview) {
            setUserHasRated(true);
            setUserRating(userReview.rating);
          }
        }
      }
      setIsLoading(false);
    };
    fetchData();
  }, [postId]);

  const handleRate = async (rating: number) => {
    if (!currentUser) {
      showError("Bạn cần đăng nhập để chấm điểm.");
      return;
    }
    if (userHasRated) return;

    const { error } = await supabase
      .from('album_ratings')
      .insert({ post_id: postId, user_id: currentUser.id, rating });

    if (error) {
      showError("Chấm điểm thất bại.");
    } else {
      setUserHasRated(true);
      setUserRating(rating);
      setRatingCount(prev => prev + 1);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-6 w-40" />;
  }

  return (
    <div className="flex items-center gap-2">
      <span>Cho điểm:</span>
      {userHasRated && userRating ? (
        <div className="flex items-center gap-2">
          <StarRatingDisplay rating={userRating} className="h-6" />
          <span className="text-sm text-muted-foreground">({ratingCount})</span>
        </div>
      ) : (
        <>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="h-6 w-6 cursor-pointer transition-colors text-yellow-400"
                fill={(hoverRating || 0) >= star ? 'currentColor' : 'none'}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRate(star)}
              />
            ))}
          </div>
          <span>({ratingCount})</span>
        </>
      )}
    </div>
  );
}