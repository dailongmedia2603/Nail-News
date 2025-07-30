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
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { CheckoutForm } from "@/components/CheckoutForm";

type Transaction = { id: number; post_id: string; amount: number; }

const STRIPE_PUBLISHABLE_KEY = "pk_test_51RoTWa1ayrvGWBb9qyTGEe7XHym0TKMTmZp4fG2ncHBw2kvJH5YT6ZgaOo2gaZs8jLXW9a353Fg9VgobnOe23jEE00RiTBJCoG";
let stripePromise: Promise<Stripe | null>;
if (STRIPE_PUBLISHABLE_KEY) {
  stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
}

const MyPostsPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [dialogState, setDialogState] = useState<{ type: 'delete-single' | 'delete-bulk' | 'renew' | null, post?: Post | null }>({ type: null, post: null });
  const [renewalTier, setRenewalTier] = useState<'urgent' | 'vip'>('urgent');
  const [renewalDuration, setRenewalDuration] = useState<number>(3);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [renewalPaymentMethod, setRenewalPaymentMethod] = useState<'wallet' | 'stripe'>('wallet');
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [pricing, setPricing] = useState({ urgent: 10, vip: 25 });
  const navigate = useNavigate();

  const totalCost = useMemo(() => {
    if (dialogState.type !== 'renew') return 0;
    return pricing[renewalTier] * renewalDuration;
  }, [dialogState.type, renewalTier, renewalDuration, pricing]);

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

    const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
    setUserBalance(profile?.balance ?? 0);

    const { data: pricingData } = await supabase.from('system_settings').select('key, value').in('key', ['price_urgent', 'price_vip']);
    if (pricingData) {
      const newPricing = pricingData.reduce((acc, { key, value }) => ({ ...acc, [key.replace('price_', '')]: parseFloat(value) }), {} as { urgent: number, vip: number });
      setPricing(newPricing);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const transactionMap = new Map(transactions.map(tx => [tx.post_id, tx.amount]));

  const handleDelete = async () => {
    if (dialogState.type === 'delete-single' && dialogState.post) {
        const { error } = await supabase.from("posts").delete().eq("id", dialogState.post.id);
        if (error) {
            showError("Xóa tin thất bại: " + error.message);
        } else {
            showSuccess("Đã xóa tin đăng thành công.");
            setPosts(posts.filter(p => p.id !== dialogState.post?.id));
        }
    } else if (dialogState.type === 'delete-bulk' && selectedPosts.length > 0) {
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

  const handleRenew = async () => {
    if (!dialogState.post) return;

    if (renewalPaymentMethod === 'wallet') {
      if (userBalance === null || userBalance < totalCost) {
        showError("Số dư trong ví không đủ.");
        return;
      }
      await handlePaymentSuccess();
    } else { // Stripe payment
      const { data: intentData, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { amount: totalCost },
      });
      if (error) {
        let errorMessage = error.message;
        try {
          const errorBody = await error.context.json();
          if (errorBody.error) {
            errorMessage = errorBody.error;
          }
        } catch (e) { /* Ignore parsing errors */ }
        showError(`Không thể tạo phiên thanh toán: ${errorMessage}`);
        return;
      }
      if (!intentData.clientSecret) {
        showError("Không nhận được mã thanh toán từ máy chủ. Vui lòng thử lại.");
        return;
      }
      setClientSecret(intentData.clientSecret);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!dialogState.post) return;
    const toastId = showLoading("Đang xử lý gia hạn...");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      dismissToast(toastId);
      showError("Không tìm thấy người dùng.");
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

    if (renewalPaymentMethod === 'wallet') {
        const newBalance = (userBalance ?? 0) - totalCost;
        await supabase.from('profiles').update({ balance: newBalance }).eq('id', user.id);
    }

    await supabase.from('transactions').insert({
      user_id: user.id,
      amount: -totalCost,
      description: `Gia hạn tin ${renewalTier.toUpperCase()} (${renewalDuration} tháng)`,
      post_id: dialogState.post.id,
    });

    dismissToast(toastId);
    showSuccess("Gia hạn tin đăng thành công!");
    setDialogState({ type: null, post: null });
    setClientSecret(null);
    fetchData();
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

  const getTierLabel = (post: Post) => {
    if (post.tier === 'free') return 'Miễn phí';
    
    let tierName = '';
    if (post.tier === 'urgent') tierName = 'Tin gấp';
    else if (post.tier === 'vip') tierName = 'Tin VIP';
    else tierName = `Gói ${post.tier?.toUpperCase()}`;

    if (post.duration_months) {
        return `${tierName} - ${post.duration_months} tháng`;
    }
    return tierName;
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Đang tải...';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
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
            <div className="mb-4">
                {selectedPosts.length > 0 && (
                    <Button variant="destructive" onClick={() => setDialogState({ type: 'delete-bulk' })}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa {selectedPosts.length} tin đã chọn
                    </Button>
                )}
            </div>
            <div className="overflow-x-auto">
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
                              <DropdownMenuItem onSelect={() => setDialogState({ type: 'renew', post })}><RefreshCw className="mr-2 h-4 w-4" />Gia hạn</DropdownMenuItem>
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
            </div>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={dialogState.type === 'delete-single' || dialogState.type === 'delete-bulk'} onOpenChange={(open) => !open && setDialogState({ type: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogState.type === 'delete-single' && `Hành động này không thể hoàn tác. Tin đăng "${dialogState.post?.title}" sẽ bị xóa vĩnh viễn.`}
              {dialogState.type === 'delete-bulk' && `Hành động này không thể hoàn tác. ${selectedPosts.length} tin đăng đã chọn sẽ bị xóa vĩnh viễn.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={dialogState.type === 'renew'} onOpenChange={(open) => { if (!open) { setDialogState({ type: null }); setClientSecret(null); } }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gia hạn tin đăng</DialogTitle>
            <DialogDescription>Chọn gói và thời hạn mới cho tin "{dialogState.post?.title}".</DialogDescription>
          </DialogHeader>
          {!clientSecret ? (
            <>
              <div className="grid gap-4 py-4">
                <RadioGroup value={renewalTier} onValueChange={(v) => setRenewalTier(v as any)} className="space-y-2">
                  <Label>Chọn gói mới</Label>
                  <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4 has-[:checked]:border-primary">
                    <RadioGroupItem value="urgent" id="r-urgent" />
                    <Label htmlFor="r-urgent" className="font-normal flex items-center gap-2"><Zap className="h-4 w-4 text-orange-500" /> Tin gấp (${pricing.urgent}/tháng)</Label>
                  </div>
                  <div className="flex items-center space-x-3 space-y-0 rounded-md border p-4 has-[:checked]:border-primary">
                    <RadioGroupItem value="vip" id="r-vip" />
                    <Label htmlFor="r-vip" className="font-normal flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> Tin VIP (${pricing.vip}/tháng)</Label>
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
                <RadioGroup onValueChange={(value) => setRenewalPaymentMethod(value as any)} defaultValue={renewalPaymentMethod} className="space-y-2">
                  <Label>Phương thức thanh toán</Label>
                  <div className="flex items-center space-x-3 space-y-0 rounded-md border bg-background p-4 has-[:checked]:border-primary">
                    <RadioGroupItem value="wallet" />
                    <Label htmlFor="r-wallet" className="font-normal w-full">
                      Thanh toán từ ví
                      <span className="block text-sm text-muted-foreground">Số dư: {formatCurrency(userBalance)}</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 space-y-0 rounded-md border bg-background p-4 has-[:checked]:border-primary">
                    <RadioGroupItem value="stripe" />
                    <Label htmlFor="r-stripe" className="font-normal">Thanh toán trực tiếp (Stripe)</Label>
                  </div>
                </RadioGroup>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleRenew}>Tiếp tục</Button>
              </DialogFooter>
            </>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm onSuccess={handlePaymentSuccess} />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </ProfileLayout>
  );
};

export default MyPostsPage;