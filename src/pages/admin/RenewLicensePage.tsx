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
import { PlusCircle, Edit, Trash2, UploadCloud, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | null; data?: License }>({ type: null });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('system_settings').select('key, value').in('key', ['renew_license_content', 'renew_license_image_url']);
    const settings = data?.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {} as { [key: string]: string }) || {};
    setContent(settings.renew_license_content || '');
    setImageUrl(settings.renew_license_image_url || null);

    const { data: licensesData } = await supabase.from('licenses').select('*').order('created_at', { ascending: false });
    setLicenses(licensesData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveContent = async () => {
    setIsSaving(true);
    const toastId = showLoading("Đang lưu nội dung...");
    let finalImageUrl = imageUrl;

    if (imageFile) {
      const fileName = `public/renew_license_${uuidv4()}`;
      const { data, error } = await supabase.storage.from('system_assets').upload(fileName, imageFile, { upsert: true });
      if (error) {
        dismissToast(toastId);
        showError("Tải ảnh thất bại: " + error.message);
        setIsSaving(false);
        return;
      }
      finalImageUrl = supabase.storage.from('system_assets').getPublicUrl(data.path).data.publicUrl;
    }

    const updates = [
      supabase.from('system_settings').upsert({ key: 'renew_license_content', value: content }),
      supabase.from('system_settings').upsert({ key: 'renew_license_image_url', value: finalImageUrl }),
    ];

    const results = await Promise.all(updates);
    dismissToast(toastId);

    if (results.some(r => r.error)) {
      showError("Lưu nội dung thất bại.");
    } else {
      showSuccess("Đã lưu nội dung thành công.");
      setImageUrl(finalImageUrl);
      setImageFile(null);
    }
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
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-medium">Hình ảnh</label>
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-md hover:bg-muted">
                    {imageUrl || imageFile ? (
                      <div className="relative w-full h-full">
                        <img src={imageFile ? URL.createObjectURL(imageFile) : imageUrl} alt="Xem trước" className="w-full h-full object-contain rounded-md p-2" />
                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={(e) => { e.preventDefault(); setImageUrl(null); setImageFile(null); }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <UploadCloud className="mx-auto h-10 w-10" />
                        <p className="mt-2 text-sm">Nhấp để tải lên</p>
                      </div>
                    )}
                    <Input type="file" className="sr-only" accept="image/*" onChange={(e) => e.target.files?.[0] && setImageFile(e.target.files[0])} />
                  </label>
                </div>
                <ReactQuill theme="snow" value={content} onChange={setContent} modules={quillModules} className="bg-background h-64" />
              </div>
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