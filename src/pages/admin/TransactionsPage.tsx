import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Separator } from "@/components/ui/separator";

// Schema for Price Settings Form
const priceSettingsSchema = z.object({
  price_urgent: z.coerce.number().positive("Giá phải là số dương."),
  price_vip: z.coerce.number().positive("Giá phải là số dương."),
});
type PriceSettingsFormValues = z.infer<typeof priceSettingsSchema>;

// Price Settings Component
const PriceSettingsForm = () => {
  const [loading, setLoading] = useState(true);
  const form = useForm<PriceSettingsFormValues>({
    resolver: zodResolver(priceSettingsSchema),
  });

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('system_settings').select('key, value').in('key', ['price_urgent', 'price_vip']);
      if (error) {
        showError("Không thể tải cài đặt giá.");
      } else {
        const settings = data.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {} as { [key: string]: any });
        form.reset({
          price_urgent: settings.price_urgent,
          price_vip: settings.price_vip,
        });
      }
      setLoading(false);
    };
    fetchPrices();
  }, [form]);

  const onSubmit = async (data: PriceSettingsFormValues) => {
    const toastId = showLoading("Đang lưu cài đặt giá...");
    const updates = [
      supabase.from('system_settings').upsert({ key: 'price_urgent', value: data.price_urgent.toString() }),
      supabase.from('system_settings').upsert({ key: 'price_vip', value: data.price_vip.toString() }),
    ];
    const results = await Promise.all(updates);
    dismissToast(toastId);
    if (results.some(r => r.error)) {
      showError("Lưu cài đặt giá thất bại.");
    } else {
      showSuccess("Đã lưu cài đặt giá thành công.");
    }
  };

  if (loading) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="price_urgent" render={({ field }) => (
            <FormItem>
              <FormLabel>Giá tin Gấp</FormLabel>
              <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
              <FormDescription>Giá mỗi tháng (USD).</FormDescription>
              <FormMessage />
            </FormItem>
          )}/>
          <FormField control={form.control} name="price_vip" render={({ field }) => (
            <FormItem>
              <FormLabel>Giá tin VIP</FormLabel>
              <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
              <FormDescription>Giá mỗi tháng (USD).</FormDescription>
              <FormMessage />
            </FormItem>
          )}/>
        </div>
        <Button type="submit" disabled={form.formState.isSubmitting}>Lưu thay đổi</Button>
      </form>
    </Form>
  );
};

// Transaction History Component
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

// Main Page Component
const AdminTransactionsPage = () => {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Quản lý Gói & Thanh toán</h1>
      <Tabs defaultValue="history">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Lịch sử Giao dịch</TabsTrigger>
          <TabsTrigger value="pricing">Cài đặt Giá</TabsTrigger>
        </TabsList>
        <TabsContent value="history" className="mt-6">
          <TransactionHistory />
        </TabsContent>
        <TabsContent value="pricing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt Giá Dịch vụ</CardTitle>
              <CardDescription>Thiết lập giá cho các gói tin đăng nổi bật.</CardDescription>
            </CardHeader>
            <CardContent>
              <PriceSettingsForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTransactionsPage;