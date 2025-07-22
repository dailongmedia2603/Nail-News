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

  // ... (fetchData, handleDelete, getStatus, formatCurrency functions remain the same)
  const fetchData = async () => { /* ... */ };
  const handleDelete = async () => { /* ... */ };
  const getStatus = (post: Post) => { /* ... */ };
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <ProfileLayout>
      <div className="space-y-6">
        {/* ... header ... */}
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
                  {/* ... table header ... */}
                </TableHeader>
                <TableBody>
                  {posts.length > 0 ? (
                    posts.map((post) => (
                      <TableRow key={post.id}>
                        {/* ... table cells ... */}
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
        {/* ... AlertDialog content ... */}
      </AlertDialog>
    </ProfileLayout>
  );
};

export default MyPostsPage;