import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Pencil, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { type Post } from "@/components/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlbumForm } from "@/components/AlbumForm";

const AdminPhotoVideoPage = () => {
  const [albums, setAlbums] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | null; albumType: 'image' | 'video'; data?: Post }>({ type: null, albumType: 'image' });
  const navigate = useNavigate();

  const fetchAlbums = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('category', 'Photo, video')
      .order('created_at', { ascending: false });
    
    if (error) {
      showError("Không thể tải album: " + error.message);
    } else {
      setAlbums(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
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

  const handleDelete = async (postId: string) => {
    const toastId = showLoading("Đang xóa album...");
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    dismissToast(toastId);
    if (error) {
      showError("Xóa album thất bại: " + error.message);
    } else {
      showSuccess("Đã xóa album thành công.");
      fetchAlbums();
    }
  };

  const renderAlbumTable = (data: Post[], albumType: 'image' | 'video') => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tất cả Album</CardTitle>
        <Button onClick={() => setDialogState({ type: 'add', albumType })}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm Album {albumType === 'image' ? 'Ảnh' : 'Video'}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? ( <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((album) => (
                <TableRow key={album.id}>
                  <TableCell className="font-medium">{album.title}</TableCell>
                  <TableCell>{format(new Date(album.created_at), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setDialogState({ type: 'edit', albumType, data: album })}><Pencil className="mr-2 h-4 w-4" />Sửa</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onSelect={() => handleDelete(album.id)}><Trash2 className="mr-2 h-4 w-4" />Xóa</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Quản lý Ảnh & Video</h1>
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="images">Album Ảnh</TabsTrigger>
          <TabsTrigger value="videos">Album Video</TabsTrigger>
        </TabsList>
        <TabsContent value="images" className="mt-4">
          {renderAlbumTable(imageAlbums, 'image')}
        </TabsContent>
        <TabsContent value="videos" className="mt-4">
          {renderAlbumTable(videoAlbums, 'video')}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogState.type !== null} onOpenChange={(open) => !open && setDialogState({ type: null, albumType: 'image' })}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>
              {dialogState.type === 'add' ? 'Thêm' : 'Chỉnh sửa'} Album {dialogState.albumType === 'image' ? 'Ảnh' : 'Video'}
            </DialogTitle>
          </DialogHeader>
          <AlbumForm
            key={dialogState.data?.id || 'new'}
            albumType={dialogState.albumType}
            initialData={dialogState.data}
            onSave={() => {
              setDialogState({ type: null, albumType: 'image' });
              fetchAlbums();
            }}
            onCancel={() => setDialogState({ type: null, albumType: 'image' })}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPhotoVideoPage;