import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { Heart, MapPin, Square, Armchair, Table } from "lucide-react";
import { Link } from "react-router-dom";

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
};

interface PostCardProps {
  post: Post;
  isFavorited: boolean;
  onFavoriteToggle: (postId: string, isCurrentlyFavorited: boolean) => void;
}

export function PostCard({ post, isFavorited, onFavoriteToggle }: PostCardProps) {
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
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <Link to={`/posts/${post.id}`} className="hover:underline">
            <CardTitle className="text-lg">{post.title}</CardTitle>
          </Link>
          <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => onFavoriteToggle(post.id, isFavorited)}>
            <Heart className={`h-5 w-5 transition-colors ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
          </Button>
        </div>
        {post.category && (
          <Badge variant={getCategoryVariant(post.category)} className="w-fit mt-1">
            {post.category}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">{post.description}</p>
      </CardContent>
      <CardFooter className="flex-col items-start space-y-2">
        {post.category === 'Bán tiệm' && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {post.area && <div className="flex items-center"><Square className="mr-1 h-4 w-4" />{post.area}</div>}
            {post.chairs && <div className="flex items-center"><Armchair className="mr-1 h-4 w-4" />{post.chairs} ghế</div>}
            {post.tables && <div className="flex items-center"><Table className="mr-1 h-4 w-4" />{post.tables} bàn</div>}
          </div>
        )}
        {post.location && (
          <div className="flex items-center text-sm text-muted-foreground pt-1">
            <MapPin className="mr-1 h-4 w-4" />
            <span>{post.location}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}