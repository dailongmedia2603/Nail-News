import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/utils/toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

type MonthlyData = {
  month: string;
  revenue: number;
};

type RevenueSummary = {
  total_revenue: number;
  total_transactions: number;
  monthly_data: MonthlyData[];
};

const RevenueReportPage = () => {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_revenue_summary');
      if (error) {
        showError("Không thể tải báo cáo doanh thu: " + error.message);
      } else {
        setSummary(data);
      }
      setLoading(false);
    };
    fetchSummary();
  }, []);

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const chartData = summary?.monthly_data.map(item => ({
    ...item,
    name: format(new Date(item.month), 'MMM yyyy', { locale: vi }),
  })) || [];

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!summary) {
    return <div className="container mx-auto p-4 md:p-6">Không có dữ liệu để hiển thị.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <h1 className="text-3xl font-bold">Báo cáo Doanh thu</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Tổng Doanh thu</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(summary.total_revenue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tổng Giao dịch</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary.total_transactions}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Doanh thu Trung bình / Giao dịch</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{summary.total_transactions > 0 ? formatCurrency(summary.total_revenue / summary.total_transactions) : '$0.00'}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Doanh thu theo Tháng</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Doanh thu" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueReportPage;