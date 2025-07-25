import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, UserCog, List, Newspaper, FolderKanban, Tags, Settings, BookUser, Image as ImageIcon, Briefcase, FileText } from "lucide-react";
import { format } from "date-fns";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

type UserDetail = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
    balance: number;
    created_at: string;
};

const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_all_users');
    if (error) {
      showError("Không thể tải danh sách người dùng: " + error.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    const toastId = showLoading("Đang cập nhật vai trò...");

    const { error } = await supabase.functions.invoke('set-user-role', {
      body: { user_id: selectedUser.id, new_role: newRole },
    });

    dismissToast(toastId);
    if (error) {
      showError("Cập nhật vai trò thất bại: " + error.message);
    } else {
      showSuccess("Cập nhật vai trò thành công!");
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
      setIsRoleDialogOpen(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">{t('adminDashboardPage.title')}</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="cursor-pointer hover:bg-muted" onClick={() => navigate('/admin/posts')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t('adminDashboardPage.managePosts')}</CardTitle><List className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{t('adminDashboardPage.managePostsDesc')}</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted" onClick={() => navigate('/admin/blog')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t('adminDashboardPage.manageBlog')}</CardTitle><Newspaper className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{t('adminDashboardPage.manageBlogDesc')}</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted" onClick={() => navigate('/admin/directory')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t('adminDashboardPage.manageDirectory')}</CardTitle><BookUser className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{t('adminDashboardPage.manageDirectoryDesc')}</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted" onClick={() => navigate('/admin/banners')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Quản lý Banner</CardTitle><ImageIcon className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">Quản lý các banner quảng cáo.</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted" onClick={() => navigate('/admin/photo-video')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t('adminDashboardPage.managePhotoVideo')}</CardTitle><ImageIcon className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{t('adminDashboardPage.managePhotoVideoDesc')}</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted" onClick={() => navigate('/admin/services')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t('adminDashboardPage.manageServices')}</CardTitle><Briefcase className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{t('adminDashboardPage.manageServicesDesc')}</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted" onClick={() => navigate('/admin/renew-license')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Quản lý Renew License</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">Chỉnh sửa nội dung trang Renew License.</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted" onClick={() => navigate('/admin/categories')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t('adminDashboardPage.manageCategories')}</CardTitle><FolderKanban className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{t('adminDashboardPage.manageCategoriesDesc')}</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted" onClick={() => navigate('/admin/tags')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t('adminDashboardPage.manageTags')}</CardTitle><Tags className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{t('adminDashboardPage.manageTagsDesc')}</p></CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted" onClick={() => navigate('/admin/settings')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{t('adminDashboardPage.systemConfig')}</CardTitle><Settings className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><p className="text-xs text-muted-foreground">{t('adminDashboardPage.systemConfigDesc')}</p></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>{t('adminDashboardPage.userList')}</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ và Tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Số dư</TableHead>
                  <TableHead>Ngày tham gia</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.first_name} {user.last_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || 'N/A'}</TableCell>
                    <TableCell><Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge></TableCell>
                    <TableCell>{formatCurrency(user.balance)}</TableCell>
                    <TableCell>{format(new Date(user.created_at), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => { setSelectedUser(user); setNewRole(user.role as any); setIsRoleDialogOpen(true); }}>
                            <UserCog className="mr-2 h-4 w-4" />
                            Thay đổi vai trò
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Thay đổi vai trò cho {selectedUser?.first_name} {selectedUser?.last_name}</AlertDialogTitle>
            <AlertDialogDescription>Chọn vai trò mới cho người dùng này.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="role-select">Vai trò</Label>
            <Select value={newRole} onValueChange={(value) => setNewRole(value as any)}>
              <SelectTrigger id="role-select" className="w-full mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>Lưu thay đổi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboardPage;