import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { Heart, MapPin } from "lucide-react";

export type Post = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  category: string | null;
  location: string | null;
  author_id: string | null;
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
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{post.title}</CardTitle>
            <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => onFavoriteToggle(post.id, isFavorited)}>
                <Heart className={`h-5 w-5 transition-colors ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
            </Button>
        </div>
        {post.category && (
          <Badge variant={getCategoryVariant(post.category)} className="w-fit">
            {post.category}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">{post.description}</p>
      </CardContent>
      <CardFooter>
        {post.location && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-1 h-4 w-4" />
            <span>{post.location}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}