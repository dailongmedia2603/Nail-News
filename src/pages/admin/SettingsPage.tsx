import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { showLoading, showSuccess, showError, dismissToast } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { v4 as uuidv4 } from 'uuid';

const settingsSchema = z.object({
  website_name: z.string().min(1, "Tên website không được để trống."),
  contact_info: z.string().min(1, "Thông tin liên hệ không được để trống."),
  logo_upload: z.any().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('system_settings').select('*');
      if (error) {
        showError("Không thể tải cài đặt.");
      } else {
        const settings = data.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {});
        form.reset({ website_name: settings.website_name, contact_info: settings.contact_info });
        if (settings.logo_url) {
          setLogoPreview(settings.logo_url);
        }
      }
      setLoading(false);
    };
    fetchSettings();
  }, [form]);

  const onSubmit = async (data: SettingsFormValues) => {
    const toastId = showLoading("Đang lưu cài đặt...");
    let newLogoUrl = logoPreview;

    if (data.logo_upload && data.logo_upload[0]) {
      const file = data.logo_upload[0];
      const fileName = `public/${uuidv4()}`;
      const { error: uploadError } = await supabase.storage.from('system_assets').upload(fileName, file, { upsert: true });
      if (uploadError) {
        dismissToast(toastId);
        showError(`Tải logo thất bại: ${uploadError.message}`);
        return;
      }
      const { data: urlData } = supabase.storage.from('system_assets').getPublicUrl(fileName);
      newLogoUrl = urlData.publicUrl;
    }

    const updates = [
      supabase.from('system_settings').upsert({ key: 'website_name', value: data.website_name }),
      supabase.from('system_settings').upsert({ key: 'contact_info', value: data.contact_info }),
      supabase.from('system_settings').upsert({ key: 'logo_url', value: newLogoUrl }),
    ];

    const results = await Promise.all(updates);
    dismissToast(toastId);

    if (results.some(r => r.error)) {
      showError("Lưu cài đặt thất bại.");
    } else {
      showSuccess("Cài đặt đã được lưu thành công!");
      if (newLogoUrl) setLogoPreview(newLogoUrl);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 md:p-6 space-y-4"><Skeleton className="h-48 w-full" /></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Cấu hình Hệ thống</h1>
      <Card>
        <CardHeader>
          <CardTitle>Cài đặt Website</CardTitle>
          <CardDescription>Tùy chỉnh các thông tin cơ bản của website.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="website_name" render={({ field }) => (
                <FormItem><FormLabel>Tên Website</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="contact_info" render={({ field }) => (
                <FormItem><FormLabel>Thông tin liên hệ</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="logo_upload" render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo Website</FormLabel>
                  {logoPreview && <img src={logoPreview} alt="Logo preview" className="h-10 my-2" />}
                  <FormControl>
                    <Input type="file" accept="image/*" onChange={(e) => { field.onChange(e.target.files); if (e.target.files?.[0]) setLogoPreview(URL.createObjectURL(e.target.files[0])); }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <Button type="submit" disabled={form.formState.isSubmitting}>Lưu thay đổi</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;