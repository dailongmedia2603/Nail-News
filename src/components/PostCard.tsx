import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { Heart, MapPin, Square, Armchair, Table, DollarSign, Clock, Store, Eye, Star, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export type Post = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  category: string | null;
  location: string | null;
  author_id: string | null;
  area: string | null;
  chairs: number | null;
  tables: number | null;
  staff: number | null;
  revenue: string | null;
  operating_hours: string | null;
  services: string[] | null;
  images: string[] | null;
  exact_address: string | null;
  salary_info: string | null;
  store_status: string | null;
  tier: string | null;
  expires_at: string | null;
  duration_months: number | null;
  view_count: number;
};

interface PostCardProps {
  post: Post;
  isFavorited: boolean;
  onFavoriteToggle: (postId: string, isCurrentlyFavorited: boolean) => void;
  onView: (postId: string) => void;
  isFeatured?: boolean;
}

export function PostCard({ post, isFavorited, onFavoriteToggle, onView, isFeatured = false }: PostCardProps) {
  const { t } = useTranslation();

  const getCategoryTranslationKey = (category: string | null) => {
    if (category === "Bán tiệm") return "postCategories.sellSalon";
    if (category === "Cần thợ") return "postCategories.needTech";
    return category || "";
  };

  const getCategoryVariant = (category: string | null) => {
    switch (category) {
      case "Bán tiệm":
        return "default";
      case "Cần thợ":
        return "destructive";
      case "Học nail":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card 
      className={cn(
        "flex flex-col h-full cursor-pointer transition-all",
        isFeatured && "border-primary/50 bg-primary/5"
      )} 
      onClick={() => onView(post.id)}
    >
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg hover:underline">{post.title}</CardTitle>
          <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={(e) => { e.stopPropagation(); onFavoriteToggle(post.id, isFavorited); }}>
            <Heart className={`h-5 w-5 transition-colors ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-1">
            {post.category && ( <Badge variant={getCategoryVariant(post.category)} className="w-fit">{t(getCategoryTranslationKey(post.category))}</Badge> )}
            {isFeatured && post.tier === 'vip' && (
                <Badge variant="default" className="bg-yellow-500 text-black hover:bg-yellow-600">
                <Star className="mr-1 h-3 w-3" /> VIP
                </Badge>
            )}
            {isFeatured && post.tier === 'urgent' && (
                <Badge variant="default" className="bg-orange-500 text-white hover:bg-orange-600">
                <Zap className="mr-1 h-3 w-3" /> Gấp
                </Badge>
            )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">{post.description}</p>
      </CardContent>
      <CardFooter className="flex-col items-start space-y-2">
        {post.category === 'Bán tiệm' && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {post.area && <div className="flex items-center"><Square className="mr-1 h-4 w-4" />{post.area}</div>}
            {post.chairs && <div className="flex items-center"><Armchair className="mr-1 h-4 w-4" />{t('postCard.chairs', { count: post.chairs })}</div>}
            {post.tables && <div className="flex items-center"><Table className="mr-1 h-4 w-4" />{t('postCard.tables', { count: post.tables })}</div>}
          </div>
        )}
        {post.category === 'Cần thợ' && (
            <div className="w-full space-y-1 text-sm text-muted-foreground">
                {post.salary_info && <div className="flex items-center"><DollarSign className="mr-1 h-4 w-4" />{t('postCard.salary', { salaryInfo: post.salary_info })}</div>}
                {post.operating_hours && <div className="flex items-center"><Clock className="mr-1 h-4 w-4" />{t('postCard.hours', { hours: post.operating_hours })}</div>}
                {post.store_status && <div className="flex items-center"><Store className="mr-1 h-4 w-4" />{t('postCard.status', { status: post.store_status })}</div>}
            </div>
        )}
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground pt-1">
            {post.location && (
                <div className="flex items-center">
                    <MapPin className="mr-1 h-4 w-4" />
                    <span>{post.location}</span>
                </div>
            )}
            <div className="flex items-center">
                <Eye className="mr-1 h-4 w-4" />
                <span>{post.view_count}</span>
            </div>
        </div>
      </CardFooter>
    </Card>
  );
}