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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { showLoading, showSuccess, showError, dismissToast } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import { Loader2, Star, Zap } from "lucide-react";
import { ImageUploader } from "./ImageUploader";
import { Card, CardContent } from "./ui/card";
import { addMonths } from 'date-fns';

const MAX_FILES = 10;
const MAX_TOTAL_SIZE_MB = 200;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

const servicesList = [
  { id: "nail", label: "Nail" },
  { id: "toc", label: "Tóc" },
  { id: "mi", label: "Mi" },
] as const;

const createPostFormSchema = z.object({
  title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự."),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự."),
  category: z.enum(["Bán tiệm", "Cần thợ", "Học nail"], { required_error: "Bạn phải chọn một loại tin." }),
  city: z.string().min(2, "Thành phố không được để trống."),
  state: z.string().min(2, "Tiểu bang không được để trống."),
  zip: z.string().min(5, "Mã ZIP phải có 5 chữ số.").max(5, "Mã ZIP phải có 5 chữ số."),
  exact_address: z.string().optional(),
  area: z.string().optional(),
  chairs: z.coerce.number().optional(),
  tables: z.coerce.number().optional(),
  staff: z.coerce.number().optional(),
  revenue: z.string().optional(),
  operating_hours: z.string().optional(),
  services: z.array(z.string()).optional(),
  images: z.instanceof(FileList).optional()
    .refine((files) => !files || files.length <= MAX_FILES, `Bạn chỉ có thể tải lên tối đa ${MAX_FILES} tệp.`)
    .refine((files) => {
        if (!files) return true;
        const totalSize = Array.from(files).reduce((acc, file) => acc + file.size, 0);
        return totalSize <= MAX_TOTAL_SIZE_BYTES;
    }, `Tổng dung lượng không được vượt quá ${MAX_TOTAL_SIZE_MB}MB.`),
  salary_info: z.string().optional(),
  store_status: z.string().optional(),
  tier: z.enum(["free", "urgent", "vip"]).default("free"),
  duration: z.coerce.number().optional(),
});

type CreatePostFormValues = z.infer<typeof createPostFormSchema>;

const PRICING = {
    urgent: 10, // $10/month
    vip: 25,    // $25/month
};

export function CreatePostForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const formMethods = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      title: "", description: "", city: "", state: "", zip: "",
      services: [], tier: "free", duration: 0,
    },
  });

  const selectedTier = formMethods.watch("tier");
  const selectedDuration = formMethods.watch("duration");

  const totalCost = useMemo(() => {
    if (selectedTier === 'free' || !selectedDuration) return 0;
    return PRICING[selectedTier] * selectedDuration;
  }, [selectedTier, selectedDuration]);

  async function onSubmit(data: CreatePostFormValues) {
    const toastId = showLoading("Đang xử lý tin đăng...");
    setIsSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      dismissToast(toastId);
      showError("Bạn cần đăng nhập để đăng tin.");
      setIsSubmitting(false);
      return;
    }

    if (totalCost > 0) {
        const { data: profile, error: profileError } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
        if (profileError || !profile) {
            dismissToast(toastId);
            showError("Không thể kiểm tra số dư. Vui lòng thử lại.");
            setIsSubmitting(false);
            return;
        }
        if (profile.balance < totalCost) {
            dismissToast(toastId);
            showError("Số dư trong ví không đủ để thực hiện giao dịch này.");
            setIsSubmitting(false);
            return;
        }
    }
    
    let imageUrls: string[] = [];
    if (data.images && data.images.length > 0) {
      const uploadPromises = Array.from(data.images).map(async (file) => {
        const fileName = `${user.id}/${uuidv4()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from("post_images").upload(fileName, file);
        if (uploadError) throw new Error(`Tải ảnh thất bại: ${uploadError.message}`);
        const { data: urlData } = supabase.storage.from("post_images").getPublicUrl(uploadData.path);
        return urlData.publicUrl;
      });
      try {
        imageUrls = await Promise.all(uploadPromises);
      } catch (error: any) {
        dismissToast(toastId);
        showError(error.message);
        setIsSubmitting(false);
        return;
      }
    }

    const locationString = `${data.city}, ${data.state}, ${data.zip}`;
    const expiresAt = data.tier !== 'free' && data.duration ? addMonths(new Date(), data.duration).toISOString() : null;
    const { city, state, zip, duration, ...restOfData } = data;
    const postData = { ...restOfData, location: locationString, author_id: user.id, images: imageUrls, expires_at: expiresAt };

    const { data: newPost, error: insertError } = await supabase.from("posts").insert(postData).select().single();

    if (insertError) {
      dismissToast(toastId);
      showError(`Đăng tin thất bại: ${insertError.message}`);
      setIsSubmitting(false);
      return;
    }

    if (totalCost > 0) {
        const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
        const newBalance = (profile?.balance ?? 0) - totalCost;
        await supabase.from('profiles').update({ balance: newBalance }).eq('id', user.id);
        await supabase.from('transactions').insert({
            user_id: user.id,
            amount: -totalCost,
            description: `Thanh toán cho tin ${data.tier.toUpperCase()} (${data.duration} tháng)`,
            post_id: newPost.id,
        });
    }

    dismissToast(toastId);
    showSuccess("Đăng tin thành công!");
    navigate(`/posts/${newPost.id}`);
  }

  return (
    <FormProvider {...formMethods}>
      <Form {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-8">
          <FormField control={formMethods.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Tiêu đề</FormLabel><FormControl><Input placeholder="VD: Cần thợ nail biết làm bột và SNS" {...field} /></FormControl><FormMessage /></FormItem> )}/>
          <FormField control={formMethods.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Mô tả</FormLabel><FormControl><Textarea placeholder="Mô tả chi tiết về công việc, yêu cầu, quyền lợi..." {...field} rows={5} /></FormControl><FormMessage /></FormItem> )}/>
          <FormField control={formMethods.control} name="category" render={({ field }) => ( <FormItem><FormLabel>Loại tin</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Chọn loại tin" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Bán tiệm">Bán tiệm</SelectItem><SelectItem value="Cần thợ">Cần thợ</SelectItem><SelectItem value="Học nail">Học nail</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={formMethods.control} name="city" render={({ field }) => ( <FormItem><FormLabel>Thành phố</FormLabel><FormControl><Input placeholder="VD: Houston" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={formMethods.control} name="state" render={({ field }) => ( <FormItem><FormLabel>Tiểu bang</FormLabel><FormControl><Input placeholder="VD: Texas" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={formMethods.control} name="zip" render={({ field }) => ( <FormItem><FormLabel>Mã ZIP</FormLabel><FormControl><Input placeholder="VD: 77002" {...field} /></FormControl><FormMessage /></FormItem> )}/>
          </div>

          {formMethods.watch("category") === "Bán tiệm" && (
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
              <FormItem>
                <FormLabel>Vị trí trên bản đồ</FormLabel>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground text-center p-4">Bản đồ sẽ sớm được tích hợp.<br/>(Cần API Key từ Google Maps Platform để hiển thị)</p>
                </div>
                <FormDescription>Sau khi nhập địa chỉ chính xác, vị trí sẽ được tự động ghim trên bản đồ.</FormDescription>
              </FormItem>
              <FormField control={formMethods.control} name="services" render={({ field }) => (
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
              <FormField control={formMethods.control} name="images" render={() => (
                <FormItem>
                  <FormLabel>Hình ảnh/Video</FormLabel>
                  <FormControl><ImageUploader name="images" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
          )}

          {formMethods.watch("category") === "Cần thợ" && (
            <div className="space-y-8 p-6 border rounded-lg">
              <h3 className="text-lg font-medium">Thông tin chi tiết (Cần thợ)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField control={formMethods.control} name="salary_info" render={({ field }) => (<FormItem><FormLabel>Thông tin lương</FormLabel><FormControl><Input placeholder="VD: $1000-$1500/tuần, thỏa thuận" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={formMethods.control} name="store_status" render={({ field }) => (
                      <FormItem><FormLabel>Trạng thái tiệm</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Đang hoạt động">Đang hoạt động</SelectItem><SelectItem value="Sắp khai trương">Sắp khai trương</SelectItem><SelectItem value="Đã đóng cửa">Đã đóng cửa</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )}/>
              </div>
              <FormField control={formMethods.control} name="operating_hours" render={({ field }) => (<FormItem><FormLabel>Giờ hoạt động</FormLabel><FormControl><Input placeholder="VD: 10am - 7pm" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={formMethods.control} name="exact_address" render={({ field }) => (<FormItem><FormLabel>Địa chỉ chính xác</FormLabel><FormControl><Input placeholder="123 Main St, Houston, TX 77002" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={formMethods.control} name="services" render={({ field }) => (
                  <FormItem><FormLabel>Kỹ năng yêu cầu</FormLabel>
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
          
          <FormField
            control={formMethods.control}
            name="tier"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Chọn gói đăng tin</FormLabel>
                <RadioGroup onValueChange={(value) => {
                    field.onChange(value);
                    if (value === 'free') formMethods.setValue('duration', 0);
                    else if (!formMethods.getValues('duration')) formMethods.setValue('duration', 3);
                }} defaultValue={field.value} className="space-y-2">
                  <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 has-[:checked]:border-primary">
                    <FormControl><RadioGroupItem value="free" /></FormControl>
                    <FormLabel className="font-normal">Tin miễn phí</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 has-[:checked]:border-primary">
                    <FormControl><RadioGroupItem value="urgent" /></FormControl>
                    <FormLabel className="font-normal flex items-center gap-2"><Zap className="h-4 w-4 text-orange-500" /> Tin gấp ($10/tháng)</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 has-[:checked]:border-primary">
                    <FormControl><RadioGroupItem value="vip" /></FormControl>
                    <FormLabel className="font-normal flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> Tin VIP ($25/tháng)</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormItem>
            )}
          />

          {selectedTier !== 'free' && (
            <Card className="bg-muted/40">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <FormField
                            control={formMethods.control}
                            name="duration"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Chọn thời hạn</FormLabel>
                                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Chọn số tháng" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="3">3 tháng</SelectItem>
                                            <SelectItem value="6">6 tháng</SelectItem>
                                            <SelectItem value="9">9 tháng</SelectItem>
                                            <SelectItem value="12">12 tháng</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                        <div className="text-center md:text-right">
                            <p className="text-sm text-muted-foreground">Tổng chi phí</p>
                            <p className="text-3xl font-bold">${totalCost}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
          )}

          <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Đang đăng..." : "Đăng tin"}
          </Button>
        </form>
      </Form>
    </FormProvider>
  );
}