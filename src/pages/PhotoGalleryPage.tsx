import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { type Post } from "@/components/PostCard";
import { Image as ImageIcon, Video } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 50;

const getYoutubeThumbnail = (url: string) => {
  if (!url) return '/placeholder.svg';
  const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

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
      const hasVideo = album.images?.some(url => url.includes('youtube.com') || url.includes('youtu.be'));
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

  const renderAlbumGrid = (albumsToRender: Post[], isVideo: boolean) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8 mt-6">
      {albumsToRender.map((album) => (
        <Link to={`/photo-video/${album.id}`} key={album.id} className="group space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold truncate group-hover:text-primary">{album.title}</h3>
            <span className="flex-shrink-0 text-xs bg-muted text-muted-foreground rounded-full h-5 w-5 flex items-center justify-center">
              {album.images?.length || 0}
            </span>
          </div>
          <div className="aspect-video overflow-hidden rounded-lg border">
            <img
              src={isVideo ? getYoutubeThumbnail(album.images?.[0] || '') : album.images?.[0] || '/placeholder.svg'}
              alt={album.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
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
          {loading ? <Skeleton className="h-64 w-full mt-6" /> : paginatedImageAlbums.length > 0 ? renderAlbumGrid(paginatedImageAlbums, false) : <p className="text-center mt-8 text-muted-foreground">Không tìm thấy album ảnh nào.</p>}
          {renderPagination(currentImagePage, totalImagePages, setCurrentImagePage)}
        </TabsContent>
        <TabsContent value="videos" className="mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-bold flex items-center"><Video className="mr-2 h-6 w-6" /> Thư viện video</h2>
            <Input placeholder="Tìm kiếm album video..." className="max-w-sm" value={videoSearch} onChange={e => setVideoSearch(e.target.value)} />
          </div>
          {loading ? <Skeleton className="h-64 w-full mt-6" /> : paginatedVideoAlbums.length > 0 ? renderAlbumGrid(paginatedVideoAlbums, true) : <p className="text-center mt-8 text-muted-foreground">Không tìm thấy album video nào.</p>}
          {renderPagination(currentVideoPage, totalVideoPages, setCurrentVideoPage)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PhotoGalleryPage;