import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingDisplayProps {
  rating: number;
  className?: string;
}

export function StarRatingDisplay({ rating, className }: StarRatingDisplayProps) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;

  return (
    <div className={cn("flex items-center", className)}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
      ))}
      {halfStar === 1 && <StarHalf key="half" className="h-5 w-5 text-yellow-400 fill-yellow-400" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="h-5 w-5 text-yellow-400" />
      ))}
    </div>
  );
}