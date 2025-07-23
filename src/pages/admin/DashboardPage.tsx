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
import { MoreHorizontal, UserCog, List, Newspaper, FolderKanban, Tags, Settings } from "lucide-react";
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

  const fetchUsers = async () => { /* ... */ };
  useEffect(() => { fetchUsers(); }, []);
  const handleRoleChange = async () => { /* ... */ };
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
          {/* ... User table ... */}
        </CardContent>
      </Card>
      <AlertDialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        {/* ... Role change dialog ... */}
      </AlertDialog>
    </div>
  );
};

export default AdminDashboardPage;