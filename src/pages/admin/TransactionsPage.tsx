import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, PlusCircle, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// --- Pricing Manager Component ---

type PricingTier = {
  id: string;
  name: string;
  tier_id: string;
  description: string | null;
  base_price_per_month: number;
  discount_3_months: number;
  discount_6_months: number;
  discount_9_months: number;
  discount_12_months: number;
  is_active: boolean;
};

const tierSchema = z.object({
  name: z.string().min(1, "Tên gói không được để trống."),
  tier_id: z.string().min(1, "ID gói không được để trống.").regex(/^[a-z0-9_]+$/, "ID chỉ được chứa chữ thường, số và dấu gạch dưới."),
  description: z.string().optional(),
  base_price_per_month: z.coerce.number().min(0, "Giá phải lớn hơn hoặc bằng 0."),
  discount_3_months: z.coerce.number().min(0).max(100).default(0),
  discount_6_months: z.coerce.number().min(0).max(100).default(0),
  discount_9_months: z.coerce.number().min(0).max(100).default(0),
  discount_12_months: z.coerce.number().min(0).max(100).default(0),
  is_active: z.boolean().default(true),
});

type TierFormValues = z.infer<typeof tierSchema>;

const PricingManager = () => {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | null; data?: PricingTier }>({ type: null });

  const fetchTiers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('pricing_tiers').select('*').order('created_at');
    if (error) showError("Không thể tải danh sách gói.");
    else setTiers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTiers(); }, []);

  const handleSave = async (values: TierFormValues) => {
    const toastId = showLoading("Đang lưu...");
    let error;
    if (dialogState.type === 'add') {
      ({ error } = await supabase.from('pricing_tiers').insert(values));
    } else if (dialogState.type === 'edit' && dialogState.data) {
      ({ error } = await supabase.from('pricing_tiers').update(values).eq('id', dialogState.data.id));
    }
    dismissToast(toastId);
    if (error) showError("Lưu thất bại: " + error.message);
    else {
      showSuccess("Lưu thành công!");
      setDialogState({ type: null });
      fetchTiers();
    }
  };

  const handleDelete = async (tierId: string) => {
    const { error } = await supabase.from('pricing_tiers').delete().eq('id', tierId);
    if (error) showError("Xóa thất bại: " + error.message);
    else {
      showSuccess("Xóa thành công!");
      fetchTiers();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogState({ type: 'add' })}>
          <PlusCircle className="mr-2 h-4 w-4" /> Thêm Gói Mới
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Tên Gói</TableHead><TableHead>Giá Cơ Bản/Tháng</TableHead><TableHead>Trạng Thái</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
              <TableBody>
                {tiers.map(tier => (
                  <TableRow key={tier.id}>
                    <TableCell className="font-medium">{tier.name}</TableCell>
                    <TableCell>${tier.base_price_per_month}</TableCell>
                    <TableCell>{tier.is_active ? 'Hoạt động' : 'Tắt'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setDialogState({ type: 'edit', data: tier })}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(tier.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogState.type !== null} onOpenChange={(open) => !open && setDialogState({ type: null })}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{dialogState.type === 'add' ? 'Thêm Gói Mới' : 'Chỉnh sửa Gói'}</DialogTitle></DialogHeader>
          <TierForm key={dialogState.data?.id || 'new'} initialData={dialogState.data} onSave={handleSave} onCancel={() => setDialogState({ type: null })} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

function TierForm({ initialData, onSave, onCancel }: { initialData?: PricingTier; onSave: (data: TierFormValues) => void; onCancel: () => void; }) {
  const form = useForm<TierFormValues>({
    resolver: zodResolver(tierSchema),
    defaultValues: initialData || {
      name: '', tier_id: '', description: '', base_price_per_month: 0,
      discount_3_months: 0, discount_6_months: 0, discount_9_months: 0, discount_12_months: 0,
      is_active: true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Tên Gói</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
          <FormField control={form.control} name="tier_id" render={({ field }) => <FormItem><FormLabel>ID Gói</FormLabel><FormControl><Input {...field} disabled={!!initialData} /></FormControl><FormDescription>Không thể thay đổi sau khi tạo.</FormDescription><FormMessage /></FormItem>} />
        </div>
        <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Mô tả</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="base_price_per_month" render={({ field }) => <FormItem><FormLabel>Giá Cơ Bản / Tháng ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>} />
        <div>
          <Label>Chính sách Giảm giá (%)</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
            <FormField control={form.control} name="discount_3_months" render={({ field }) => <FormItem><FormLabel>3 Tháng</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="discount_6_months" render={({ field }) => <FormItem><FormLabel>6 Tháng</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="discount_9_months" render={({ field }) => <FormItem><FormLabel>9 Tháng</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="discount_12_months" render={({ field }) => <FormItem><FormLabel>12 Tháng</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
          </div>
        </div>
        <FormField control={form.control} name="is_active" render={({ field }) => <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>Hoạt động</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>} />
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel}>Hủy</Button></DialogClose>
          <Button type="submit">Lưu</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// --- Transaction History Component ---

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`*, profiles ( first_name, last_name ), posts ( title )`)
        .order('created_at', { ascending: false });
      if (error) showError("Không thể tải lịch sử giao dịch: " + error.message);
      else setTransactions(data || []);
      setLoading(false);
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    const lowercasedFilter = searchTerm.toLowerCase();
    return transactions.filter(tx => {
      const userName = `${tx.profiles?.first_name || ''} ${tx.profiles?.last_name || ''}`.toLowerCase();
      const description = tx.description?.toLowerCase() || '';
      const postTitle = tx.posts?.title?.toLowerCase() || '';
      return userName.includes(lowercasedFilter) || description.includes(lowercasedFilter) || postTitle.includes(lowercasedFilter);
    });
  }, [transactions, searchTerm]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử Giao dịch</CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Tìm kiếm..." className="w-full pl-8 md:w-1/3" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-64 w-full" /> : (
          <Table>
            <TableHeader><TableRow><TableHead>Người dùng</TableHead><TableHead>Mô tả</TableHead><TableHead>Tin đăng</TableHead><TableHead>Số tiền</TableHead><TableHead>Ngày</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredTransactions.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell>{tx.profiles ? `${tx.profiles.first_name} ${tx.profiles.last_name}`.trim() : 'N/A'}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell>{tx.post_id && tx.posts?.title ? <Link to={`/posts/${tx.post_id}`} className="hover:underline text-primary">{tx.posts.title}</Link> : 'N/A'}</TableCell>
                  <TableCell className={`font-medium ${tx.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(tx.amount)}</TableCell>
                  <TableCell>{format(new Date(tx.created_at), 'dd/MM/yyyy')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

// --- Main Page Component ---

const AdminTransactionsPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Quản lý Gói & Thanh toán</h1>
      <Tabs defaultValue="history">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Lịch sử Giao dịch</TabsTrigger>
          <TabsTrigger value="pricing">Quản lý Gói & Giá</TabsTrigger>
        </TabsList>
        <TabsContent value="history" className="mt-6">
          <TransactionHistory />
        </TabsContent>
        <TabsContent value="pricing" className="mt-6">
          <PricingManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTransactionsPage;