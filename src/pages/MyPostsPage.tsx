import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProfileLayout from "@/components/ProfileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { isPast } from "date-fns";
import { type Post } from "@/components/PostCard";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
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
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  
  const [dialogState, setDialogState] = useState<{ type: 'single' | 'bulk' | null, post?: Post | null }>({ type: null, post: null });

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
    if (dialogState.type === 'single' && dialogState.post) {
        const { error } = await supabase.from("posts").delete().eq("id", dialogState.post.id);
        if (error) {
            showError("Xóa tin thất bại: " + error.message);
        } else {
            showSuccess("Đã xóa tin đăng thành công.");
            setPosts(posts.filter(p => p.id !== dialogState.post?.id));
        }
    } else if (dialogState.type === 'bulk' && selectedPosts.length > 0) {
        const toastId = showLoading(`Đang xóa ${selectedPosts.length} tin...`);
        const { error } = await supabase.from("posts").delete().in("id", selectedPosts);
        dismissToast(toastId);
        if (error) {
            showError("Xóa hàng loạt thất bại: " + error.message);
        } else {
            showSuccess(`Đã xóa ${selectedPosts.length} tin thành công.`);
            setPosts(posts.filter(p => !selectedPosts.includes(p.id)));
            setSelectedPosts([]);
        }
    }
    setDialogState({ type: null, post: null });
  };

  const getStatus = (post: Post) => { /* ... getStatus logic ... */ return <Badge></Badge> };
  const getTierLabel = (post: Post) => { /* ... getTierLabel logic ... */ return '' };
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
            <div className="mb-4">
                {selectedPosts.length > 0 && (
                    <Button variant="destructive" onClick={() => setDialogState({ type: 'bulk' })}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa {selectedPosts.length} tin đã chọn
                    </Button>
                )}
            </div>
            {loading ? (
              <div className="space-y-2"> <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" /> </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedPosts.length === posts.length && posts.length > 0}
                        onCheckedChange={(value) => {
                          setSelectedPosts(value ? posts.map(p => p.id) : []);
                        }}
                        aria-label="Select all"
                      />
                    </TableHead>
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
                      <TableRow key={post.id} data-state={selectedPosts.includes(post.id) && "selected"}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPosts.includes(post.id)}
                            onCheckedChange={(value) => {
                              setSelectedPosts(
                                value ? [...selectedPosts, post.id] : selectedPosts.filter(id => id !== post.id)
                              );
                            }}
                            aria-label="Select row"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{post.title}</TableCell>
                        <TableCell>{getTierLabel(post)}</TableCell>
                        <TableCell>{transactionMap.has(post.id) ? formatCurrency(Math.abs(transactionMap.get(post.id)!)) : 'N/A'}</TableCell>
                        <TableCell>{format(new Date(post.created_at), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{post.expires_at ? format(new Date(post.expires_at), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                        <TableCell>{getStatus(post)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => navigate(`/posts/${post.id}/edit`)}><Pencil className="mr-2 h-4 w-4" />Sửa</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onSelect={() => setDialogState({ type: 'single', post })}><Trash2 className="mr-2 h-4 w-4" />Xóa</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={8} className="text-center h-24">Bạn chưa đăng tin nào.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={dialogState.type !== null} onOpenChange={(open) => !open && setDialogState({ type: null, post: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.type === 'single' && `Hành động này không thể hoàn tác. Tin đăng "${dialogState.post?.title}" sẽ bị xóa vĩnh viễn.`}
              {dialogState.type === 'bulk' && `Hành động này không thể hoàn tác. ${selectedPosts.length} tin đăng đã chọn sẽ bị xóa vĩnh viễn.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProfileLayout>
  );
};

export default MyPostsPage;