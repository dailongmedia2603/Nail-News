import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProfileLayout from "@/components/ProfileLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { showError } from "@/utils/toast";

type LoginHistoryEntry = {
  event_time: string;
  ip_address: string;
};

const LoginHistoryPage = () => {
  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_login_history');

      if (error) {
        showError("Không thể tải lịch sử đăng nhập: " + error.message);
      } else {
        setHistory(data || []);
      }
      setLoading(false);
    };

    fetchHistory();
  }, []);

  return (
    <ProfileLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Lịch sử đăng nhập</h3>
          <p className="text-sm text-muted-foreground">
            Đây là danh sách 20 lần đăng nhập gần nhất vào tài khoản của bạn.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử</CardTitle>
            <CardDescription>Nếu bạn thấy hoạt động đáng ngờ, hãy đổi mật khẩu ngay lập tức.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian đăng nhập</TableHead>
                    <TableHead>Địa chỉ IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length > 0 ? (
                    history.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>{format(new Date(entry.event_time), 'dd/MM/yyyy, HH:mm:ss', { locale: vi })}</TableCell>
                        <TableCell className="font-mono">{entry.ip_address}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center">
                        Chưa có lịch sử đăng nhập nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ProfileLayout>
  );
};

export default LoginHistoryPage;