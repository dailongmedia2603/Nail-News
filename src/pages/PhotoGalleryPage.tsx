import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { type Post } from "@/components/PostCard";
import { Badge } from "@/components/ui/badge";
import { Camera } from "lucide-react";

const PhotoGalleryPage = () => {
  const [albums, setAlbums] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('category', 'Photo, video')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Lỗi tải album ảnh:", error);
      } else {
        setAlbums(data || []);
      }
      setLoading(false);
    };
    fetchAlbums();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="text-center my-8">
        <h1 className="text-3xl md:text-4xl font-bold">Thư viện Ảnh & Video</h1>
        <p className="text-muted-foreground mt-2">Khám phá những hình ảnh và video mới nhất trong ngành nail.</p>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : albums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {albums.map((album) => (
            <Link to={`/photo-video/${album.id}`} key={album.id} className="group">
              <Card className="overflow-hidden h-full flex flex-col">
                <CardContent className="p-0 relative aspect-square">
                  <img
                    src={album.images?.[0] || '/placeholder.svg'}
                    alt={album.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <Badge variant="secondary" className="absolute top-2 right-2">
                    <Camera className="mr-1 h-3 w-3" />
                    {album.images?.length || 0}
                  </Badge>
                </CardContent>
                <div className="p-4 bg-background flex-grow">
                  <h3 className="font-semibold group-hover:text-primary">{album.title}</h3>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Chưa có album nào được đăng.</p>
        </div>
      )}
    </div>
  );
};

export default PhotoGalleryPage;