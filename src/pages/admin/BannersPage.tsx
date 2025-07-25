import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Edit, Trash2, UploadCloud, CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { type Post } from '@/components/PostCard';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Banner = {
  id: number;
  type: 'image' | 'post';
  image_url?: string;
  link_url?: string;
  post_id?: string;
  display_location: string;
  is_active: boolean;
  display_order: number;
  expires_at: string | null;
  posts?: { title: string };
};

const bannerSchema = z.object({
  type: z.enum(['image', 'post']),
  display_location: z.string().min(1),
  is_active: z.boolean().default(true),
  image_upload: z.any().optional(),
  link_url: z.string().optional(),
  post_id: z.string().optional(),
  display_order: z.coerce.number().default(0),
  expires_at: z.date().optional().nullable(),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

const AdminBannersPage = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | null; data?: Banner }>({ type: null });

  const fetchData = async () => {
    setLoading(true);
    const { data: bannersData, error: bannersError } = await supabase.from('banners').select('*, posts(title)').order('display_order');
    const { data: postsData, error: postsError } = await supabase.from('posts').select('*');
    if (bannersError || postsError) showError('Không thể tải dữ liệu.');
    else {
      setBanners(bannersData || []);
      setPosts(postsData || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (bannerId: number) => {
    const { error } = await supabase.from('banners').delete().eq('id', bannerId);
    if (error) showError('Xóa thất bại.');
    else {
      showSuccess('Xóa thành công!');
      fetchData();
    }
  };

  const getStatus = (banner: Banner) => {
    const isActive = banner.is_active;
    const isExpired = banner.expires_at && new Date(banner.expires_at) < new Date();
    if (isExpired) return <span className="text-red-500">Hết hạn</span>;
    return isActive ? 'Hoạt động' : 'Tắt';
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quản lý Banner Quảng cáo</h1>
        <Button onClick={() => setDialogState({ type: 'add' })}>
          <PlusCircle className="mr-2 h-4 w-4" /> Thêm Banner
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>Thứ tự</TableHead><TableHead>Loại</TableHead><TableHead>Nội dung</TableHead><TableHead>Vị trí</TableHead><TableHead>Hết hạn</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
            <TableBody>
              {banners.map(banner => (
                <TableRow key={banner.id}>
                  <TableCell>{banner.display_order}</TableCell>
                  <TableCell>{banner.type}</TableCell>
                  <TableCell>{banner.type === 'image' ? <img src={banner.image_url} className="h-10" /> : banner.posts?.title}</TableCell>
                  <TableCell>{banner.display_location}</TableCell>
                  <TableCell>{banner.expires_at ? format(new Date(banner.expires_at), 'dd/MM/yyyy') : 'Không'}</TableCell>
                  <TableCell>{getStatus(banner)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setDialogState({ type: 'edit', data: banner })}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(banner.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogState.type !== null} onOpenChange={(open) => !open && setDialogState({ type: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialogState.type === 'add' ? 'Thêm Banner' : 'Sửa Banner'}</DialogTitle></DialogHeader>
          <BannerForm
            key={dialogState.data?.id || 'new'}
            initialData={dialogState.data}
            posts={posts}
            onSave={() => { setDialogState({ type: null }); fetchData(); }}
            onCancel={() => setDialogState({ type: null })}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

function BannerForm({ initialData, posts, onSave, onCancel }: { initialData?: Banner; posts: Post[]; onSave: () => void; onCancel: () => void; }) {
  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      type: initialData?.type || 'image',
      display_location: initialData?.display_location || 'nail-salons',
      is_active: initialData?.is_active ?? true,
      link_url: initialData?.link_url || '',
      post_id: initialData?.post_id || undefined,
      display_order: initialData?.display_order || 0,
      expires_at: initialData?.expires_at ? new Date(initialData.expires_at) : null,
    },
  });
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null);
  const type = form.watch('type');

  const handleSave = async (values: BannerFormValues) => {
    const toastId = showLoading('Đang lưu...');
    let imageUrl = initialData?.image_url;

    if (values.type === 'image' && values.image_upload?.[0]) {
      const file = values.image_upload[0];
      const fileName = `banners/${uuidv4()}`;
      const { data, error } = await supabase.storage.from('system_assets').upload(fileName, file);
      if (error) { dismissToast(toastId); showError('Tải ảnh thất bại.'); return; }
      imageUrl = supabase.storage.from('system_assets').getPublicUrl(data.path).data.publicUrl;
    }

    const dataToUpsert = {
      type: values.type,
      display_location: values.display_location,
      is_active: values.is_active,
      image_url: values.type === 'image' ? imageUrl : null,
      link_url: values.type === 'image' ? values.link_url : null,
      post_id: values.type === 'post' ? values.post_id : null,
      display_order: values.display_order,
      expires_at: values.expires_at ? values.expires_at.toISOString() : null,
    };

    let error;
    if (initialData) {
      ({ error } = await supabase.from('banners').update(dataToUpsert).eq('id', initialData.id));
    } else {
      ({ error } = await supabase.from('banners').insert(dataToUpsert));
    }

    dismissToast(toastId);
    if (error) showError('Lưu thất bại.');
    else {
      showSuccess('Lưu thành công!');
      onSave();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 py-4">
        <FormField control={form.control} name="type" render={({ field }) => <FormItem><FormLabel>Loại Banner</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="image">Ảnh</SelectItem><SelectItem value="post">Tin đăng / Danh bạ</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
        <FormField control={form.control} name="display_location" render={({ field }) => <FormItem><FormLabel>Vị trí Hiển thị</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="nail-salons">Danh bạ Tiệm Nail</SelectItem><SelectItem value="nail-supply">Danh bạ Nail Supply</SelectItem><SelectItem value="beauty-school">Danh bạ Beauty School</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
        
        {type === 'image' && (
          <>
            <FormField control={form.control} name="image_upload" render={({ field }) => (
              <FormItem>
                <FormLabel>Tải ảnh lên</FormLabel>
                <FormDescription>Kích thước đề xuất: 300x150 pixels.</FormDescription>
                <FormControl>
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md hover:bg-muted">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Xem trước banner" className="h-full w-full object-contain rounded-md p-2" />
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <UploadCloud className="mx-auto h-8 w-8" />
                            <p className="mt-2 text-sm">Nhấp để tải lên</p>
                        </div>
                    )}
                    <Input 
                        type="file" 
                        className="sr-only" 
                        accept="image/*" 
                        onChange={(e) => { 
                            field.onChange(e.target.files); 
                            if (e.target.files?.[0]) {
                                setImagePreview(URL.createObjectURL(e.target.files[0]));
                            } 
                        }} 
                    />
                  </label>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="link_url" render={({ field }) => <FormItem><FormLabel>Link liên kết</FormLabel><FormControl><Input placeholder="https://example.com" {...field} /></FormControl><FormMessage /></FormItem>} />
          </>
        )}

        {type === 'post' && (
          <FormField control={form.control} name="post_id" render={({ field }) => <FormItem><FormLabel>Chọn Tin đăng / Danh bạ</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{posts.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
        )}

        <FormField control={form.control} name="display_order" render={({ field }) => <FormItem><FormLabel>Thứ tự hiển thị</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="expires_at" render={({ field }) => (
          <FormItem className="flex flex-col"><FormLabel>Ngày hết hạn</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                    {field.value ? format(field.value, "PPP") : <span>Chọn ngày</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value || undefined}
                  onSelect={field.onChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
        <FormField control={form.control} name="is_active" render={({ field }) => <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>Hoạt động</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>} />
        
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel}>Hủy</Button></DialogClose>
          <Button type="submit">Lưu</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default AdminBannersPage;