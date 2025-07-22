import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProfileLayout from "@/components/ProfileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Trash2, Pencil, RefreshCw, Star, Zap, Loader2 } from "lucide-react";
import { format, addMonths, isPast } from "date-fns";
import { type Post } from "@/components/PostCard";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";

type Transaction = { id: number; post_id: string; amount: number; }

const PRICING = { urgent: 10, vip: 25 };

const MyPostsPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [dialogState, setDialogState] = useState<{ type: 'delete-single' | 'delete-bulk' | 'renew' | null, post?: Post | null }>({ type: null, post: null });
  const [renewalTier, setRenewalTier] = useState<'urgent' | 'vip'>('urgent');
  const [renewalDuration, setRenewalDuration] = useState<number>(3);
  const navigate = useNavigate();

  const totalCost = useMemo(() => {
    if (dialogState.type !== 'renew') return 0;
    return PRICING[renewalTier] * renewalDuration;
  }, [dialogState.type, renewalTier, renewalDuration]);

  const fetchData = async () => { /* ... fetchData logic ... */ };
  useEffect(() => { fetchData(); }, []);

  const transactionMap = new Map(transactions.map(tx => [tx.post_id, tx.amount]));

  const handleDelete = async () => { /* ... handleDelete logic ... */ };

  const handleRenew = async () => {
    if (!dialogState.post) return;
    const toastId = showLoading("Đang xử lý gia hạn...");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      dismissToast(toastId);
      showError("Không tìm thấy người dùng.");
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
    if (!profile || profile.balance < totalCost) {
      dismissToast(toastId);
      showError("Số dư trong ví không đủ.");
      return;
    }

    const newExpiresAt = addMonths(new Date(), renewalDuration).toISOString();
    const { error: postUpdateError } = await supabase
      .from('posts')
      .update({ tier: renewalTier, duration_months: renewalDuration, expires_at: newExpiresAt })
      .eq('id', dialogState.post.id);

    if (postUpdateError) {
      dismissToast(toastId);
      showError("Gia hạn thất bại: " + postUpdateError.message);
      return;
    }

    const newBalance = profile.balance - totalCost;
    await supabase.from('profiles').update({ balance: newBalance }).eq('id', user.id);
    await supabase.from('transactions').insert({
      user_id: user.id,
      amount: -totalCost,
      description: `Gia hạn tin ${renewalTier.toUpperCase()} (${renewalDuration} tháng)`,
      post_id: dialogState.post.id,
    });

    dismissToast(toastId);
    showSuccess("Gia hạn tin đăng thành công!");
    setDialogState({ type: null });
    fetchData(); // Refresh data
  };

  const getStatus = (post: Post) => { /* ... getStatus logic ... */ };
  const getTierLabel = (post: Post) => { /* ... getTierLabel logic ... */ };
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <ProfileLayout>
      {/* ... Page Header and Bulk Delete Button ... */}
      <Card>
        <CardContent className="pt-6">
          {/* ... Loading Skeleton and Table ... */}
          <Table>
            {/* ... Table Header ... */}
            <TableBody>
              {posts.length > 0 ? (
                posts.map((post) => (
                  <TableRow key={post.id}>
                    {/* ... other cells ... */}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => navigate(`/posts/${post.id}/edit`)}><Pencil className="mr-2 h-4 w-4" />Sửa</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setDialogState({ type: 'renew', post })}>
                            <RefreshCw className="mr-2 h-4 w-4" />Gia hạn
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onSelect={() => setDialogState({ type: 'delete-single', post })}><Trash2 className="mr-2 h-4 w-4" />Xóa</DropdownMenuItem>
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
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={dialogState.type === 'delete-single' || dialogState.type === 'delete-bulk'} onOpenChange={(open) => !open && setDialogState({ type: null })}>
        {/* ... AlertDialog Content ... */}
      </AlertDialog>

      {/* Renew Dialog */}
      <Dialog open={dialogState.type === 'renew'} onOpenChange={(open) => !open && setDialogState({ type: null })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gia hạn tin đăng</DialogTitle>
            <DialogDescription>Chọn gói và thời hạn mới cho tin "{dialogState.post?.title}".</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <RadioGroup value={renewalTier} onValueChange={(v) => setRenewalTier(v as any)} className="space-y-2">
              <Label>Chọn gói mới</Label>
              <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4 has-[:checked]:border-primary">
                <RadioGroupItem value="urgent" id="r-urgent" />
                <Label htmlFor="r-urgent" className="font-normal flex items-center gap-2"><Zap className="h-4 w-4 text-orange-500" /> Tin gấp ($10/tháng)</Label>
              </div>
              <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4 has-[:checked]:border-primary">
                <RadioGroupItem value="vip" id="r-vip" />
                <Label htmlFor="r-vip" className="font-normal flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> Tin VIP ($25/tháng)</Label>
              </div>
            </RadioGroup>
            <div className="grid grid-cols-2 items-center gap-4">
              <Select value={renewalDuration.toString()} onValueChange={(v) => setRenewalDuration(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 tháng</SelectItem>
                  <SelectItem value="6">6 tháng</SelectItem>
                  <SelectItem value="9">9 tháng</SelectItem>
                  <SelectItem value="12">12 tháng</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Tổng chi phí</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleRenew}>Xác nhận gia hạn</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProfileLayout>
  );
};

export default MyPostsPage;