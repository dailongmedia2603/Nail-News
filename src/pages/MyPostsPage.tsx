import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProfileLayout from "@/components/ProfileLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { isPast } from "date-fns";
import { type Post } from "@/components/PostCard";
import { showSuccess, showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";

const MyPostsPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      showError("Không thể tải danh sách tin đăng.");
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async () => {
    if (!postToDelete) return;

    const { error } = await supabase.from("posts").delete().eq("id", postToDelete.id);

    if (error) {
      showError("Xóa tin thất bại: " + error.message);
    } else {
      showSuccess("Đã xóa tin đăng thành công.");
      setPosts(posts.filter(p => p.id !== postToDelete.id));
    }
    setShowDeleteDialog(false);
    setPostToDelete(null);
  };

  const getStatus = (post: Post) => {
    if (post.tier === 'free' || !post.expires_at) {
      return <Badge variant="default">Đang hoạt động</Badge>;
    }
    if (isPast(new Date(post.expires_at))) {
      return <Badge variant="secondary">Hết hạn</Badge>;
    }
    return <Badge variant="default">Đang hoạt động</Badge>;
  };

  return (
    <ProfileLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Quản lý tin đăng</h3>
          <p className="text-sm text-muted-foreground">
            Xem, chỉnh sửa hoặc xóa các tin bạn đã đăng.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Loại tin</TableHead>
                    <TableHead>Ngày đăng</TableHead>
                    <TableHead>Ngày hết hạn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.length > 0 ? (
                    posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">{post.title}</TableCell>
                        <TableCell>{post.category}</TableCell>
                        <TableCell>{format(new Date(post.created_at), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{post.expires_at ? format(new Date(post.expires_at), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                        <TableCell>{getStatus(post)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Mở menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-red-600"
                                onSelect={() => {
                                  setPostToDelete(post);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        Bạn chưa đăng tin nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Tin đăng "{postToDelete?.title}" sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProfileLayout>
  );
};

export default MyPostsPage;