import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { showLoading, showSuccess, showError, dismissToast } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';

const settingsSchema = z.object({
  website_name: z.string().min(1, "Tên website không được để trống."),
  contact_info: z.string().min(1, "Thông tin liên hệ không được để trống."),
  browser_title: z.string().min(1, "Tiêu đề trình duyệt không được để trống."),
  logo_upload: z.any().optional(),
  favicon_upload: z.any().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const SettingsPage = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('system_settings').select('*');
      if (error) {
        showError(t('toasts.adminSettingsLoadError'));
      } else {
        const settings = data.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {} as {[key: string]: any});
        form.reset({ 
          website_name: settings.website_name, 
          contact_info: settings.contact_info,
          browser_title: settings.browser_title,
        });
        if (settings.logo_url) setLogoPreview(settings.logo_url);
        if (settings.favicon_url) setFaviconPreview(settings.favicon_url);
      }
      setLoading(false);
    };
    fetchSettings();
  }, [form, t]);

  const onSubmit = async (data: SettingsFormValues) => {
    const toastId = showLoading(t('toasts.adminSavingSettings'));
    let newLogoUrl = logoPreview;
    let newFaviconUrl = faviconPreview;

    try {
      if (data.logo_upload && data.logo_upload[0]) {
        const file = data.logo_upload[0];
        const fileName = `public/logo_${uuidv4()}`;
        const { data: uploadData, error } = await supabase.storage.from('system_assets').upload(fileName, file, { upsert: true });
        if (error) throw new Error(t('toasts.adminLogoUploadError', { message: error.message }));
        newLogoUrl = supabase.storage.from('system_assets').getPublicUrl(uploadData.path).data.publicUrl;
      }

      if (data.favicon_upload && data.favicon_upload[0]) {
        const file = data.favicon_upload[0];
        const fileName = `public/favicon_${uuidv4()}`;
        const { data: uploadData, error } = await supabase.storage.from('system_assets').upload(fileName, file, { upsert: true });
        if (error) throw new Error(t('toasts.adminLogoUploadError', { message: error.message }));
        newFaviconUrl = supabase.storage.from('system_assets').getPublicUrl(uploadData.path).data.publicUrl;
      }

      const updates = [
        supabase.from('system_settings').upsert({ key: 'website_name', value: data.website_name }),
        supabase.from('system_settings').upsert({ key: 'contact_info', value: data.contact_info }),
        supabase.from('system_settings').upsert({ key: 'browser_title', value: data.browser_title }),
        supabase.from('system_settings').upsert({ key: 'logo_url', value: newLogoUrl }),
        supabase.from('system_settings').upsert({ key: 'favicon_url', value: newFaviconUrl }),
      ];

      const results = await Promise.all(updates);
      if (results.some(r => r.error)) throw new Error(t('toasts.adminSaveSettingsError'));

      dismissToast(toastId);
      showSuccess(t('toasts.adminSaveSettingsSuccess'));
      if (newLogoUrl) setLogoPreview(newLogoUrl);
      if (newFaviconUrl) setFaviconPreview(newFaviconUrl);
      // Trigger a refresh to see favicon/title changes
      window.location.reload();
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 md:p-6 space-y-4"><Skeleton className="h-48 w-full" /></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">{t('adminSettingsPage.title')}</h1>
      <Card>
        <CardHeader>
            <CardTitle>Cài đặt chung</CardTitle>
            <CardDescription>Quản lý thông tin cơ bản của website.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField control={form.control} name="website_name" render={({ field }) => (
                <FormItem><FormLabel>{t('adminSettingsPage.websiteName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="browser_title" render={({ field }) => (
                <FormItem><FormLabel>{t('adminSettingsPage.browserTitle')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="contact_info" render={({ field }) => (
                <FormItem><FormLabel>{t('adminSettingsPage.contactInfo')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="logo_upload" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('adminSettingsPage.websiteLogo')}</FormLabel>
                  {logoPreview && <img src={logoPreview} alt="Logo preview" className="h-10 my-2" />}
                  <FormControl>
                    <Input type="file" accept="image/*" onChange={(e) => { field.onChange(e.target.files); if (e.target.files?.[0]) setLogoPreview(URL.createObjectURL(e.target.files[0])); }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="favicon_upload" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('adminSettingsPage.favicon')}</FormLabel>
                  {faviconPreview && <img src={faviconPreview} alt="Favicon preview" className="h-8 w-8 my-2" />}
                  <FormControl>
                    <Input type="file" accept="image/png, image/x-icon, image/svg+xml" onChange={(e) => { field.onChange(e.target.files); if (e.target.files?.[0]) setFaviconPreview(URL.createObjectURL(e.target.files[0])); }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <Button type="submit" disabled={form.formState.isSubmitting}>{t('adminSettingsPage.saveChanges')}</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;