import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProfileLayout from "@/components/ProfileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { isPast } from "date-fns";
import { type Post } from "@/components/PostCard";
import { showSuccess, showError } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

type Transaction = {
    id: number;
    post_id: string;
    amount: number;
}

const MyPostsPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });

    if (postError) showError("Không thể tải danh sách tin đăng.");
    else setPosts(postData || []);

    const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("id, post_id, amount")
        .eq("user_id", user.id);
    
    if (transactionError) showError("Không thể tải lịch sử giao dịch.");
    else setTransactions(transactionData || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const transactionMap = new Map(transactions.map(tx => [tx.post_id, tx.amount]));

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

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

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
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Gói tin</TableHead>
                    <TableHead>Số tiền</TableHead>
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
                        <TableCell>
                          {post.tier === 'free' ? 'Miễn phí' : `Gói ${post.tier?.toUpperCase()} - ${post.duration_months} tháng`}
                        </TableCell>
                        <TableCell>
                          {transactionMap.has(post.id) ? formatCurrency(Math.abs(transactionMap.get(post.id)!)) : 'N/A'}
                        </TableCell>
                        <TableCell>{format(new Date(post.created_at), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{post.expires_at ? format(new Date(post.expires_at), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                        <TableCell>{getStatus(post)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => navigate(`/posts/${post.id}/edit`)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onSelect={() => { setPostToDelete(post); setShowDeleteDialog(true); }}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={7} className="text-center h-24">Bạn chưa đăng tin nào.</TableCell></TableRow>
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