import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { showLoading, showSuccess, showError, dismissToast } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { TagSelector } from './TagSelector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type State = { id: number; name: string; };
type City = { id: number; name: string; state_id: number; };

const optionalNumber = z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number({ invalid_type_error: "Giá trị phải là một con số." }).optional()
);

const editPostFormSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống."),
  description: z.string().optional(),
  category: z.enum(["Bán tiệm", "Cần thợ", "Học nail"]).optional(),
  state_id: optionalNumber,
  city_id: optionalNumber,
  zip: z.string().optional(),
  exact_address: z.string().optional(),
  area: z.string().optional(),
  chairs: optionalNumber,
  tables: optionalNumber,
  staff: optionalNumber,
  revenue: z.string().optional(),
  operating_hours: z.string().optional(),
  services: z.array(z.string()).optional(),
  salary_info: z.string().optional(),
  store_status: z.string().optional(),
  tags: z.array(z.number()).optional(),
});

type EditPostFormValues = z.infer<typeof editPostFormSchema>;

const servicesList = [
  { id: "Nail", label: "Nail" },
  { id: "Tóc", label: "Tóc" },
  { id: "Mi", label: "Mi" },
] as const;

export function EditPostForm({ postId }: { postId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);

  const formMethods = useForm<EditPostFormValues>({
    resolver: zodResolver(editPostFormSchema),
  });

  const selectedStateId = formMethods.watch("state_id");
  const category = formMethods.watch("category");

  useEffect(() => {
    const fetchPostAndCategories = async () => {
      setIsLoading(true);
      const { data: statesData } = await supabase.from('states').select('*').order('name');
      const { data: citiesData } = await supabase.from('cities').select('*').order('name');
      const allStates = statesData || [];
      const allCities = citiesData || [];
      setStates(allStates);
      setCities(allCities);

      const { data: postData, error } = await supabase.from("posts").select("*").eq("id", postId).single();
      if (error || !postData) {
        showError("Không thể tải dữ liệu tin đăng.");
        navigate("/profile/my-posts");
        return;
      }

      const [cityName, stateName, zip] = postData.location?.split(', ').map(s => s.trim()) || ["", "", ""];
      const foundState = allStates.find(s => s.name === stateName);
      const foundCity = allCities.find(c => c.name === cityName && c.state_id === foundState?.id);
      
      if (foundState) {
        setFilteredCities(allCities.filter(city => city.state_id === foundState.id));
      }

      const { data: postTags } = await supabase.from('post_tags').select('tag_id').eq('post_id', postId);

      formMethods.reset({
        ...postData,
        state_id: foundState?.id,
        city_id: foundCity?.id,
        zip: zip || "",
        tags: postTags?.map(t => t.tag_id) || [],
      });
      setIsLoading(false);
    };
    fetchPostAndCategories();
  }, [postId, formMethods, navigate]);

  useEffect(() => {
    if (selectedStateId) {
      setFilteredCities(cities.filter(city => city.state_id === Number(selectedStateId)));
      if (!isLoading) {
        formMethods.setValue('city_id', undefined as any);
      }
    } else {
      setFilteredCities([]);
    }
  }, [selectedStateId, cities, formMethods, isLoading]);

  async function onSubmit(data: EditPostFormValues) {
    setLastError(null);
    const toastId = showLoading("Đang cập nhật tin đăng...");
    setIsSubmitting(true);

    const selectedState = states.find(s => s.id === data.state_id);
    const selectedCity = cities.find(c => c.id === data.city_id);
    const locationString = [selectedCity?.name, selectedState?.name, data.zip]
      .filter(Boolean)
      .join(', ');
      
    const { city_id, state_id, zip, tags, ...restOfData } = data;

    const { error: updateError } = await supabase
      .from("posts")
      .update({ ...restOfData, location: locationString })
      .eq("id", postId);

    if (updateError) {
      dismissToast(toastId);
      const errorMessage = `Cập nhật thất bại. Nhấp vào 'Xem Log Lỗi' để biết chi tiết.`;
      showError(errorMessage);
      setLastError(JSON.stringify(updateError, null, 2));
      setIsSubmitting(false);
      return;
    }

    const { data: existingTags } = await supabase.from('post_tags').select('tag_id').eq('post_id', postId);
    const existingTagIds = existingTags?.map(t => t.tag_id) || [];
    const newTagIds = tags || [];

    const tagsToAdd = newTagIds.filter(id => !existingTagIds.includes(id)).map(id => ({ post_id: postId, tag_id: id }));
    const tagsToRemove = existingTagIds.filter(id => !newTagIds.includes(id));

    if (tagsToRemove.length > 0) {
      await supabase.from('post_tags').delete().eq('post_id', postId).in('tag_id', tagsToRemove);
    }
    if (tagsToAdd.length > 0) {
      await supabase.from('post_tags').insert(tagsToAdd);
    }

    dismissToast(toastId);
    setIsSubmitting(false);
    showSuccess("Cập nhật tin đăng thành công!");
    navigate(`/posts/${postId}`);
  }

  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  return (
    <FormProvider {...formMethods}>
      <Form {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-8">
          <FormField control={formMethods.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Tiêu đề</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
          <FormField control={formMethods.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Mô tả</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem> )}/>
          <FormField control={formMethods.control} name="category" render={({ field }) => ( <FormItem><FormLabel>Loại tin</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Bán tiệm">Bán tiệm</SelectItem><SelectItem value="Cần thợ">Cần thợ</SelectItem><SelectItem value="Học nail">Học nail</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={formMethods.control} name="state_id" render={({ field }) => (
                <FormItem><FormLabel>Tiểu bang</FormLabel><Select onValueChange={field.onChange} value={field.value?.toString()}><FormControl><SelectTrigger><SelectValue placeholder="Chọn tiểu bang" /></SelectTrigger></FormControl><SelectContent>{states.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <FormField control={formMethods.control} name="city_id" render={({ field }) => (
                <FormItem><FormLabel>Thành phố</FormLabel><Select onValueChange={field.onChange} value={field.value?.toString()} disabled={!selectedStateId}><FormControl><SelectTrigger><SelectValue placeholder="Chọn thành phố" /></SelectTrigger></FormControl><SelectContent>{filteredCities.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <FormField control={formMethods.control} name="zip" render={({ field }) => ( <FormItem><FormLabel>Mã ZIP</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
          </div>

          {category === "Bán tiệm" && (
            <div className="space-y-8 p-6 border rounded-lg">
              <h3 className="text-lg font-medium">Thông tin chi tiết (Bán tiệm)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <FormField control={formMethods.control} name="area" render={({ field }) => (<FormItem><FormLabel>Diện tích (sqft)</FormLabel><FormControl><Input placeholder="1200" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={formMethods.control} name="chairs" render={({ field }) => (<FormItem><FormLabel>Số ghế</FormLabel><FormControl><Input type="number" placeholder="6" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={formMethods.control} name="tables" render={({ field }) => (<FormItem><FormLabel>Số bàn</FormLabel><FormControl><Input type="number" placeholder="6" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={formMethods.control} name="staff" render={({ field }) => (<FormItem><FormLabel>Số nhân sự</FormLabel><FormControl><Input type="number" placeholder="4" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField control={formMethods.control} name="revenue" render={({ field }) => (<FormItem><FormLabel>Doanh thu</FormLabel><FormControl><Input placeholder="VD: $30,000/tháng" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={formMethods.control} name="operating_hours" render={({ field }) => (<FormItem><FormLabel>Giờ hoạt động</FormLabel><FormControl><Input placeholder="VD: 10am - 7pm" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              </div>
              <FormField control={formMethods.control} name="exact_address" render={({ field }) => (<FormItem><FormLabel>Địa chỉ chính xác</FormLabel><FormControl><Input placeholder="123 Main St, Houston, TX 77002" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={formMethods.control} name="services" render={() => (
                  <FormItem><FormLabel>Các dịch vụ</FormLabel>
                      <div className="flex items-center space-x-4">
                      {servicesList.map((item) => (
                          <FormField key={item.id} control={formMethods.control} name="services" render={({ field }) => (
                              <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                      return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))
                                  }}/></FormControl>
                                  <FormLabel className="font-normal">{item.label}</FormLabel>
                              </FormItem>
                          )}/>
                      ))}
                      </div>
                  <FormMessage /></FormItem>
              )}/>
            </div>
          )}

          {category === "Cần thợ" && (
            <div className="space-y-8 p-6 border rounded-lg">
              <h3 className="text-lg font-medium">Thông tin chi tiết (Cần thợ)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField control={formMethods.control} name="salary_info" render={({ field }) => (<FormItem><FormLabel>Thông tin lương</FormLabel><FormControl><Input placeholder="VD: $1000-$1500/tuần, thỏa thuận" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={formMethods.control} name="store_status" render={({ field }) => (
                      <FormItem><FormLabel>Trạng thái tiệm</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Đang hoạt động">Đang hoạt động</SelectItem><SelectItem value="Sắp khai trương">Sắp khai trương</SelectItem><SelectItem value="Đã đóng cửa">Đã đóng cửa</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )}/>
              </div>
              <FormField control={formMethods.control} name="operating_hours" render={({ field }) => (<FormItem><FormLabel>Giờ hoạt động</FormLabel><FormControl><Input placeholder="VD: 10am - 7pm" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={formMethods.control} name="exact_address" render={({ field }) => (<FormItem><FormLabel>Địa chỉ chính xác</FormLabel><FormControl><Input placeholder="123 Main St, Houston, TX 77002" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={formMethods.control} name="services" render={() => (
                  <FormItem><FormLabel>Dịch vụ kinh doanh</FormLabel>
                      <div className="flex items-center space-x-4">
                      {servicesList.map((item) => (
                          <FormField key={item.id} control={formMethods.control} name="services" render={({ field }) => (
                              <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                      return checked ? field.onChange([...(field.value || []), item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))
                                  }}/></FormControl>
                                  <FormLabel className="font-normal">{item.label}</FormLabel>
                              </FormItem>
                          )}/>
                      ))}
                      </div>
                  <FormMessage /></FormItem>
              )}/>
            </div>
          )}

          <FormItem>
            <FormLabel>Tag & Từ khóa</FormLabel>
            <TagSelector name="tags" />
            <FormDescription>Chọn các tag phù hợp để người dùng dễ dàng tìm thấy tin của bạn.</FormDescription>
          </FormItem>
          
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thay đổi
            </Button>

            {lastError && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline" className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive">
                            Xem Log Lỗi
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Chi Tiết Lỗi Gửi Lên Server</DialogTitle>
                            <DialogDescription>
                                Đây là thông tin lỗi chi tiết được trả về từ máy chủ Supabase. Vui lòng sao chép và gửi cho bộ phận kỹ thuật nếu cần.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 bg-muted p-4 rounded-md max-h-[60vh] overflow-auto">
                            <pre className="text-sm whitespace-pre-wrap break-words">
                                <code>{lastError}</code>
                            </pre>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
          </div>
        </form>
      </Form>
    </FormProvider>
  );
}