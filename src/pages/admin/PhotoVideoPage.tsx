import { useEffect, useState } from "react";
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

const AdminPhotoVideoPage = () => {
  const [albums, setAlbums] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleDelete = async (postId: string) => {
    const toastId = showLoading("Đang xóa album...");
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    dismissToast(toastId);
    if (error) {
      showError("Xóa album thất bại: " + error.message);
    } else {
      showSuccess("Đã xóa album thành công.");
      setAlbums(albums.filter(p => p.id !== postId));
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý Ảnh & Video</h1>
        <Button onClick={() => navigate('/create-post')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tạo Album mới
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Tất cả Album</CardTitle></CardHeader>
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
                {albums.map((album) => (
                  <TableRow key={album.id}>
                    <TableCell className="font-medium">{album.title}</TableCell>
                    <TableCell>{format(new Date(album.created_at), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => navigate(`/posts/${album.id}/edit`)}><Pencil className="mr-2 h-4 w-4" />Sửa</DropdownMenuItem>
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
    </div>
  );
};

export default AdminPhotoVideoPage;