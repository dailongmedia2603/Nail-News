import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { showError } from "@/utils/toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Legend as PieLegend } from 'recharts';
import { DateRange } from "react-day-picker";
import { addDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type RevenueDataPoint = { date: string; revenue: number; };
type RevenueByGroup = { [key: string]: any; revenue: number; };

type DetailedRevenueReport = {
  total_revenue: number;
  total_transactions: number;
  revenue_over_time: RevenueDataPoint[] | null;
  revenue_by_tier: RevenueByGroup[] | null;
  revenue_by_category: RevenueByGroup[] | null;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

const RevenueReportPage = () => {
  const [report, setReport] = useState<DetailedRevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  useEffect(() => {
    const fetchReport = async () => {
      if (!date?.from || !date?.to) return;
      setLoading(true);
      const { data, error } = await supabase.rpc('get_detailed_revenue_report', {
        start_date: date.from.toISOString(),
        end_date: date.to.toISOString(),
      });
      if (error) {
        showError("Không thể tải báo cáo doanh thu: " + error.message);
      } else {
        setReport(data);
      }
      setLoading(false);
    };
    fetchReport();
  }, [date]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const timeChartData = report?.revenue_over_time?.map(item => ({
    ...item,
    name: format(new Date(item.date), 'dd/MM'),
  })) || [];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Báo cáo Doanh thu Chi tiết</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Chọn ngày</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setDate({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) })}>Tuần này</Button>
            <Button size="sm" variant="outline" onClick={() => setDate({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}>Tháng này</Button>
            <Button size="sm" variant="outline" onClick={() => setDate({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) })}>Quý này</Button>
            <Button size="sm" variant="outline" onClick={() => setDate({ from: startOfYear(new Date()), to: endOfYear(new Date()) })}>Năm nay</Button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div>
          <Skeleton className="h-96 w-full" />
        </div>
      ) : !report ? (
        <div className="text-center py-16">Không có dữ liệu để hiển thị cho khoảng thời gian đã chọn.</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardHeader><CardTitle>Tổng Doanh thu</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(report.total_revenue)}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Tổng Giao dịch</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{report.total_transactions}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Doanh thu / Giao dịch</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{report.total_transactions > 0 ? formatCurrency(report.total_revenue / report.total_transactions) : '$0.00'}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Doanh thu theo Thời gian</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={timeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Bar dataKey="revenue" fill="#8884d8" name="Doanh thu" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Doanh thu theo Gói tin</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={report.revenue_by_tier || []} dataKey="revenue" nameKey="tier" cx="50%" cy="50%" outerRadius={100} label>
                      {(report.revenue_by_tier || []).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <PieLegend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Doanh thu theo Danh mục</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={report.revenue_by_category || []} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
                      {(report.revenue_by_category || []).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <PieLegend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default RevenueReportPage;