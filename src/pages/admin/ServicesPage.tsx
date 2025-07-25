import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Pencil, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { type Post } from "@/components/PostCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const serviceSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống."),
  description: z.string().optional(),
  location: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

const AdminServicesPage = () => {
  const [services, setServices] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | null; data?: Post }>({ type: null });

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('category', 'Dịch vụ')
      .order('created_at', { ascending: false });
    
    if (error) {
      showError("Không thể tải danh sách dịch vụ: " + error.message);
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, []);

  const handleDelete = async (postId: string) => {
    const toastId = showLoading("Đang xóa dịch vụ...");
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    dismissToast(toastId);
    if (error) {
      showError("Xóa dịch vụ thất bại: " + error.message);
    } else {
      showSuccess("Đã xóa dịch vụ thành công.");
      fetchServices();
    }
  };

  const handleSave = async (values: ServiceFormValues) => {
    const toastId = showLoading("Đang lưu...");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        dismissToast(toastId);
        showError("Không thể xác thực người dùng.");
        return;
    }

    const dataToUpsert = {
      ...values,
      category: 'Dịch vụ',
      author_id: user.id,
    };

    let error;
    if (dialogState.type === 'edit' && dialogState.data) {
      ({ error } = await supabase.from('posts').update(dataToUpsert).eq('id', dialogState.data.id));
    } else {
      ({ error } = await supabase.from('posts').insert(dataToUpsert));
    }

    dismissToast(toastId);
    if (error) showError("Lưu thất bại: " + error.message);
    else {
      showSuccess("Lưu thành công!");
      setDialogState({ type: null });
      fetchServices();
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý Dịch vụ</h1>
        <Button onClick={() => setDialogState({ type: 'add' })}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Thêm Dịch vụ mới
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Tất cả Dịch vụ</CardTitle></CardHeader>
        <CardContent>
          {loading ? ( <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.title}</TableCell>
                    <TableCell>{format(new Date(service.created_at), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setDialogState({ type: 'edit', data: service })}><Pencil className="mr-2 h-4 w-4" />Sửa</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onSelect={() => handleDelete(service.id)}><Trash2 className="mr-2 h-4 w-4" />Xóa</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogState.type !== null} onOpenChange={(open) => !open && setDialogState({ type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState.type === 'add' ? 'Thêm Dịch vụ mới' : 'Chỉnh sửa Dịch vụ'}</DialogTitle>
          </DialogHeader>
          <ServiceForm
            key={dialogState.data?.id || 'new'}
            initialData={dialogState.data}
            onSave={handleSave}
            onCancel={() => setDialogState({ type: null })}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

function ServiceForm({ initialData, onSave, onCancel }: { initialData?: Post; onSave: (data: ServiceFormValues) => void; onCancel: () => void; }) {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      location: initialData?.location || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 py-4">
        <FormField control={form.control} name="title" render={({ field }) => <FormItem><FormLabel>Tiêu đề</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Nội dung chi tiết</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="location" render={({ field }) => <FormItem><FormLabel>Địa chỉ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel}>Hủy</Button></DialogClose>
          <Button type="submit">Lưu</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default AdminServicesPage;