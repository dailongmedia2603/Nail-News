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
import { useState } from "react";
import { showLoading, showSuccess, showError, dismissToast } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import { Loader2, Star, Zap } from "lucide-react";
import { ImageUploader } from "./ImageUploader";

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
  category: z.enum(["Bán tiệm", "Cần thợ", "Học nail"], {
    required_error: "Bạn phải chọn một loại tin.",
  }),
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
});

type CreatePostFormValues = z.infer<typeof createPostFormSchema>;

export function CreatePostForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const formMethods = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      title: "",
      description: "",
      city: "",
      state: "",
      zip: "",
      services: [],
      tier: "free",
    },
  });

  async function onSubmit(data: CreatePostFormValues) {
    setIsSubmitting(true);
    const toastId = showLoading("Đang xử lý tin đăng...");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      dismissToast(toastId);
      showError("Bạn cần đăng nhập để đăng tin.");
      setIsSubmitting(false);
      return;
    }

    let imageUrls: string[] = [];
    if (data.images && data.images.length > 0) {
      const uploadPromises = Array.from(data.images).map(async (file) => {
        const fileName = `${user.id}/${uuidv4()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("post_images")
          .upload(fileName, file);
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
    const { city, state, zip, ...restOfData } = data;
    const postData = { ...restOfData, location: locationString, author_id: user.id, images: imageUrls };

    const { data: newPost, error: insertError } = await supabase.from("posts").insert(postData).select().single();
    dismissToast(toastId);
    setIsSubmitting(false);

    if (insertError) {
      showError(`Đăng tin thất bại: ${insertError.message}`);
    } else {
      showSuccess("Đăng tin thành công!");
      navigate(`/posts/${newPost.id}`);
    }
  }

  return (
    <FormProvider {...formMethods}>
      <Form {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-8">
          <FormField control={formMethods.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Tiêu đề</FormLabel><FormControl><Input placeholder="VD: Cần thợ nail biết làm bột và SNS" {...field} /></FormControl><FormMessage /></FormItem> )}/>
          <FormField control={formMethods.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Mô tả công việc</FormLabel><FormControl><Textarea placeholder="Mô tả chi tiết về công việc, yêu cầu, quyền lợi..." {...field} rows={5} /></FormControl><FormMessage /></FormItem> )}/>
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
                    <p className="text-muted-foreground text-center p-4">
                        Bản đồ sẽ sớm được tích hợp.<br/>
                        (Cần API Key từ Google Maps Platform để hiển thị)
                    </p>
                </div>
                <FormDescription>
                  Sau khi nhập địa chỉ chính xác, vị trí sẽ được tự động ghim trên bản đồ.
                </FormDescription>
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
                  <FormControl>
                    <ImageUploader name="images" />
                  </FormControl>
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
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl><RadioGroupItem value="free" /></FormControl>
                      <FormLabel className="font-normal">Tin miễn phí</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 bg-gray-50 opacity-60 cursor-not-allowed">
                      <FormControl><RadioGroupItem value="urgent" disabled /></FormControl>
                      <FormLabel className="font-normal flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" /> Tin gấp <span className="text-xs text-muted-foreground">(Sắp ra mắt)</span>
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 bg-gray-50 opacity-60 cursor-not-allowed">
                      <FormControl><RadioGroupItem value="vip" disabled /></FormControl>
                      <FormLabel className="font-normal flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" /> Tin VIP <span className="text-xs text-muted-foreground">(Sắp ra mắt)</span>
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Đang đăng..." : "Đăng tin"}
          </Button>
        </form>
      </Form>
    </FormProvider>
  );
}