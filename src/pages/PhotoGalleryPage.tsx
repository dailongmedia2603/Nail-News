import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { type Post } from "@/components/PostCard";
import { Badge } from "@/components/ui/badge";
import { Camera, Image as ImageIcon, Video } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 50;

const PhotoGalleryPage = () => {
  const [albums, setAlbums] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageSearch, setImageSearch] = useState("");
  const [videoSearch, setVideoSearch] = useState("");
  const [currentImagePage, setCurrentImagePage] = useState(1);
  const [currentVideoPage, setCurrentVideoPage] = useState(1);

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

  const { imageAlbums, videoAlbums } = useMemo(() => {
    const images: Post[] = [];
    const videos: Post[] = [];
    albums.forEach(album => {
      const hasVideo = album.images?.some(url => url.includes('.mp4') || url.includes('.mov'));
      if (hasVideo) {
        videos.push(album);
      } else {
        images.push(album);
      }
    });
    return { imageAlbums: images, videoAlbums: videos };
  }, [albums]);

  const filteredImageAlbums = useMemo(() => imageAlbums.filter(album => album.title.toLowerCase().includes(imageSearch.toLowerCase())), [imageAlbums, imageSearch]);
  const filteredVideoAlbums = useMemo(() => videoAlbums.filter(album => album.title.toLowerCase().includes(videoSearch.toLowerCase())), [videoAlbums, videoSearch]);

  const totalImagePages = Math.ceil(filteredImageAlbums.length / ITEMS_PER_PAGE);
  const totalVideoPages = Math.ceil(filteredVideoAlbums.length / ITEMS_PER_PAGE);

  const paginatedImageAlbums = filteredImageAlbums.slice((currentImagePage - 1) * ITEMS_PER_PAGE, currentImagePage * ITEMS_PER_PAGE);
  const paginatedVideoAlbums = filteredVideoAlbums.slice((currentVideoPage - 1) * ITEMS_PER_PAGE, currentVideoPage * ITEMS_PER_PAGE);

  const renderPagination = (currentPage: number, totalPages: number, onPageChange: (page: number) => void) => {
    if (totalPages <= 1) return null;
    return (
      <Pagination className="mt-8">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={() => onPageChange(Math.max(1, currentPage - 1))} />
          </PaginationItem>
          {[...Array(totalPages)].map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink isActive={i + 1 === currentPage} onClick={() => onPageChange(i + 1)}>
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const renderAlbumGrid = (albumsToRender: Post[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
      {albumsToRender.map((album) => (
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
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="images">Hình ảnh</TabsTrigger>
          <TabsTrigger value="videos">Video</TabsTrigger>
        </TabsList>
        <TabsContent value="images" className="mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-bold flex items-center"><ImageIcon className="mr-2 h-6 w-6" /> Thư viện ảnh</h2>
            <Input placeholder="Tìm kiếm album ảnh..." className="max-w-sm" value={imageSearch} onChange={e => setImageSearch(e.target.value)} />
          </div>
          {loading ? <Skeleton className="h-64 w-full mt-6" /> : paginatedImageAlbums.length > 0 ? renderAlbumGrid(paginatedImageAlbums) : <p className="text-center mt-8 text-muted-foreground">Không tìm thấy album ảnh nào.</p>}
          {renderPagination(currentImagePage, totalImagePages, setCurrentImagePage)}
        </TabsContent>
        <TabsContent value="videos" className="mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-bold flex items-center"><Video className="mr-2 h-6 w-6" /> Thư viện video</h2>
            <Input placeholder="Tìm kiếm album video..." className="max-w-sm" value={videoSearch} onChange={e => setVideoSearch(e.target.value)} />
          </div>
          {loading ? <Skeleton className="h-64 w-full mt-6" /> : paginatedVideoAlbums.length > 0 ? renderAlbumGrid(paginatedVideoAlbums) : <p className="text-center mt-8 text-muted-foreground">Không tìm thấy album video nào.</p>}
          {renderPagination(currentVideoPage, totalVideoPages, setCurrentVideoPage)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PhotoGalleryPage;