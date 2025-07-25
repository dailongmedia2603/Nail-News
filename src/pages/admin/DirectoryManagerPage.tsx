import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { MoreHorizontal, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { type Post } from '@/components/PostCard';

type State = { id: number; name: string; };
type City = { id: number; name: string; state_id: number; };

const directoryItemSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống."),
  description: z.string().optional(),
  state_id: z.coerce.number().optional(),
  city_id: z.coerce.number().optional(),
  zip: z.string().optional(),
  exact_address: z.string().optional(),
});

type DirectoryItemFormValues = z.infer<typeof directoryItemSchema>;

const DirectoryManagerPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<{ type: 'add' | 'edit' | null; data?: Post; category: string }>({ type: null, category: '' });
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .in('category', ['Tiệm nail', 'Nail supply', 'Beauty school']);
    if (error) showError('Không thể tải dữ liệu danh bạ.');
    else setPosts(data || []);

    const { data: statesData } = await supabase.from('states').select('*');
    const { data: citiesData } = await supabase.from('cities').select('*');
    setStates(statesData || []);
    setCities(citiesData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const nailSalons = useMemo(() => posts.filter(p => p.category === 'Tiệm nail'), [posts]);
  const nailSupplies = useMemo(() => posts.filter(p => p.category === 'Nail supply'), [posts]);
  const beautySchools = useMemo(() => posts.filter(p => p.category === 'Beauty school'), [posts]);

  const handleDelete = async (postId: string) => {
    const toastId = showLoading("Đang xóa...");
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    dismissToast(toastId);
    if (error) showError("Xóa thất bại: " + error.message);
    else {
      showSuccess("Xóa thành công!");
      fetchData();
    }
  };

  const handleSave = async (values: DirectoryItemFormValues) => {
    const toastId = showLoading("Đang lưu...");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        dismissToast(toastId);
        showError("Không thể xác thực người dùng. Vui lòng đăng nhập lại.");
        return;
    }

    const selectedState = states.find(s => s.id === values.state_id);
    const selectedCity = cities.find(c => c.id === values.city_id);
    const locationString = [selectedCity?.name, selectedState?.name, values.zip].filter(Boolean).join(', ');

    const dataToUpsert = {
      title: values.title,
      description: values.description,
      location: locationString,
      exact_address: values.exact_address,
      category: dialogState.category,
      author_id: user.id, // Gán ID của admin làm tác giả
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
      setDialogState({ type: null, category: '' });
      fetchData();
    }
  };

  const renderTable = (data: Post[], category: string) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Danh sách</CardTitle>
        <Button size="sm" onClick={() => setDialogState({ type: 'add', category })}>
          <PlusCircle className="mr-2 h-4 w-4" /> Thêm mới
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Tiêu đề</TableHead><TableHead>Địa chỉ</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>{item.location}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onSelect={() => setDialogState({ type: 'edit', data: item, category })}><Edit className="mr-2 h-4 w-4" />Sửa</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onSelect={() => handleDelete(item.id)}><Trash2 className="mr-2 h-4 w-4" />Xóa</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Quản lý Danh bạ</h1>
      {loading ? <Skeleton className="h-64 w-full" /> : (
        <Tabs defaultValue="nail-salons">
          <TabsList><TabsTrigger value="nail-salons">Tiệm Nail</TabsTrigger><TabsTrigger value="nail-supply">Nail Supply</TabsTrigger><TabsTrigger value="beauty-school">Beauty School</TabsTrigger></TabsList>
          <TabsContent value="nail-salons">{renderTable(nailSalons, 'Tiệm nail')}</TabsContent>
          <TabsContent value="nail-supply">{renderTable(nailSupplies, 'Nail supply')}</TabsContent>
          <TabsContent value="beauty-school">{renderTable(beautySchools, 'Beauty school')}</TabsContent>
        </Tabs>
      )}

      <Dialog open={dialogState.type !== null} onOpenChange={(open) => !open && setDialogState({ type: null, category: '' })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialogState.type === 'add' ? 'Thêm mới' : 'Chỉnh sửa'} {dialogState.category}</DialogTitle></DialogHeader>
          <DirectoryItemForm
            key={dialogState.data?.id || 'new'}
            initialData={dialogState.data}
            onSave={handleSave}
            onCancel={() => setDialogState({ type: null, category: '' })}
            states={states}
            cities={cities}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

function DirectoryItemForm({ initialData, onSave, onCancel, states, cities }: { initialData?: Post; onSave: (data: DirectoryItemFormValues) => void; onCancel: () => void; states: State[]; cities: City[] }) {
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const form = useForm<DirectoryItemFormValues>({ resolver: zodResolver(directoryItemSchema) });
  const selectedStateId = form.watch("state_id");

  useEffect(() => {
    if (initialData) {
      const [cityName, stateName, zip] = initialData.location?.split(', ').map(s => s.trim()) || [];
      const foundState = states.find(s => s.name === stateName);
      const foundCity = cities.find(c => c.name === cityName && c.state_id === foundState?.id);
      form.reset({
        title: initialData.title,
        description: initialData.description || '',
        state_id: foundState?.id,
        city_id: foundCity?.id,
        zip: zip || '',
        exact_address: initialData.exact_address || '',
      });
    }
  }, [initialData, states, cities, form]);

  useEffect(() => {
    if (selectedStateId) {
      setFilteredCities(cities.filter(city => city.state_id === Number(selectedStateId)));
    } else {
      setFilteredCities([]);
    }
  }, [selectedStateId, cities]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4 py-4">
        <FormField control={form.control} name="title" render={({ field }) => <FormItem><FormLabel>Tên</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Mô tả</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField control={form.control} name="state_id" render={({ field }) => <FormItem><FormLabel>Tiểu bang</FormLabel><Select onValueChange={(v) => { field.onChange(v); form.setValue('city_id', undefined); }} value={field.value?.toString()}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{states.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
          <FormField control={form.control} name="city_id" render={({ field }) => <FormItem><FormLabel>Thành phố</FormLabel><Select onValueChange={field.onChange} value={field.value?.toString()} disabled={!selectedStateId}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{filteredCities.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
          <FormField control={form.control} name="zip" render={({ field }) => <FormItem><FormLabel>Mã ZIP</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
        </div>
        <FormField control={form.control} name="exact_address" render={({ field }) => <FormItem><FormLabel>Địa chỉ chính xác</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel}>Hủy</Button></DialogClose>
          <Button type="submit">Lưu</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default DirectoryManagerPage;