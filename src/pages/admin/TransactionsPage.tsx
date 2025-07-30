import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { showError } from "@/utils/toast";

type Transaction = {
  id: number;
  created_at: string;
  amount: number;
  description: string;
  post_id: string | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  posts: {
    title: string | null;
  } | null;
};

const AdminTransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles ( first_name, last_name ),
          posts ( title )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        showError("Không thể tải lịch sử giao dịch: " + error.message);
      } else {
        setTransactions(data || []);
      }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Quản lý Giao dịch</h1>
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử Giao dịch</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm theo người dùng, mô tả, tin đăng..."
              className="w-full pl-8 md:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Tin đăng</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.profiles ? `${tx.profiles.first_name} ${tx.profiles.last_name}`.trim() : 'N/A'}</TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell>
                      {tx.post_id && tx.posts?.title ? (
                        <Link to={`/posts/${tx.post_id}`} className="hover:underline text-primary">{tx.posts.title}</Link>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell className={`font-medium ${tx.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>{format(new Date(tx.created_at), 'dd/MM/yyyy')}</TableCell>
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

export default AdminTransactionsPage;