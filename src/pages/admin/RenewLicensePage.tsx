import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { showLoading, showSuccess, showError, dismissToast } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import ReactQuill from 'react-quill';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

type License = {
  id: number;
  license_type: string;
  name: string;
  location: string;
};

const licenseSchema = z.object({
  license_type: z.string().min(1, "Loại bằng không được để trống."),
  name: z.string().min(1, "Tên không được để trống."),
  location: z.string().min(1, "Nơi cấp không được để trống."),
});

type LicenseFormValues = z.infer<typeof licenseSchema>;

const AdminRenewLicensePage = () => {
  const [content, setContent] = useState('');
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | null; data?: License }>({ type: null });

  const fetchData = async () => {
    setLoading(true);
    const { data: contentData } = await supabase.from('system_settings').select('value').eq('key', 'renew_license_content').single();
    const { data: licensesData } = await supabase.from('licenses').select('*').order('created_at', { ascending: false });
    setContent(contentData?.value || '');
    setLicenses(licensesData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveContent = async () => {
    setIsSaving(true);
    const toastId = showLoading("Đang lưu nội dung...");
    const { error } = await supabase.from('system_settings').upsert({ key: 'renew_license_content', value: content });
    dismissToast(toastId);
    if (error) showError("Lưu nội dung thất bại.");
    else showSuccess("Đã lưu nội dung thành công.");
    setIsSaving(false);
  };

  const handleSaveLicense = async (values: LicenseFormValues) => {
    const toastId = showLoading("Đang lưu giấy phép...");
    let error;
    if (dialogState.type === 'edit' && dialogState.data) {
      ({ error } = await supabase.from('licenses').update(values).eq('id', dialogState.data.id));
    } else {
      ({ error } = await supabase.from('licenses').insert(values));
    }
    dismissToast(toastId);
    if (error) showError("Lưu giấy phép thất bại.");
    else {
      showSuccess("Lưu giấy phép thành công!");
      setDialogState({ type: null });
      fetchData();
    }
  };

  const handleDeleteLicense = async (id: number) => {
    const { error } = await supabase.from('licenses').delete().eq('id', id);
    if (error) showError("Xóa thất bại.");
    else {
      showSuccess("Xóa thành công!");
      fetchData();
    }
  };

  const quillModules = useMemo(() => ({
    toolbar: [[{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline'], [{'list': 'ordered'}, {'list': 'bullet'}], ['link']],
  }), []);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8">
      <h1 className="text-3xl font-bold">Quản lý Nội dung Renew License</h1>
      <Card>
        <CardHeader><CardTitle>Phần Nội dung</CardTitle><CardDescription>Chỉnh sửa nội dung chính hiển thị trên trang.</CardDescription></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-64 w-full" /> : (
            <div className="space-y-4">
              <ReactQuill theme="snow" value={content} onChange={setContent} modules={quillModules} className="bg-background" />
              <Button onClick={handleSaveContent} disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu Nội dung'}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Danh sách Bằng hết hạn hôm nay</CardTitle>
            <CardDescription>Quản lý danh sách các giấy phép hiển thị trên trang.</CardDescription>
          </div>
          <Button onClick={() => setDialogState({ type: 'add' })}><PlusCircle className="mr-2 h-4 w-4" /> Thêm mới</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>License Type</TableHead><TableHead>Name</TableHead><TableHead>From</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
            <TableBody>
              {licenses.map(license => (
                <TableRow key={license.id}>
                  <TableCell>{license.license_type}</TableCell>
                  <TableCell>{license.name}</TableCell>
                  <TableCell>{license.location}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setDialogState({ type: 'edit', data: license })}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteLicense(license.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogState.type !== null} onOpenChange={(open) => !open && setDialogState({ type: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialogState.type === 'add' ? 'Thêm Giấy phép' : 'Sửa Giấy phép'}</DialogTitle></DialogHeader>
          <LicenseForm key={dialogState.data?.id || 'new'} initialData={dialogState.data} onSave={handleSaveLicense} onCancel={() => setDialogState({ type: null })} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

function LicenseForm({ initialData, onSave, onCancel }: { initialData?: License; onSave: (data: LicenseFormValues) => void; onCancel: () => void; }) {
  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseSchema),
    defaultValues: initialData || { license_type: '', name: '', location: '' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 py-4">
        <FormField control={form.control} name="license_type" render={({ field }) => <FormItem><FormLabel>License Type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="location" render={({ field }) => <FormItem><FormLabel>From</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel}>Hủy</Button></DialogClose>
          <Button type="submit">Lưu</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default AdminRenewLicensePage;