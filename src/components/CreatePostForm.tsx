import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useState } from "react";
import { showLoading, showSuccess, showError, dismissToast } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import { Loader2 } from "lucide-react";

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
  location: z.string().min(2, "Địa điểm không được để trống."),
  exact_address: z.string().optional(),
  area: z.string().optional(),
  chairs: z.coerce.number().optional(),
  tables: z.coerce.number().optional(),
  staff: z.coerce.number().optional(),
  revenue: z.string().optional(),
  operating_hours: z.string().optional(),
  services: z.array(z.string()).optional(),
  images: z.instanceof(FileList).optional(),
});

type CreatePostFormValues = z.infer<typeof createPostFormSchema>;

export function CreatePostForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      services: [],
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

        if (uploadError) {
          throw new Error(`Tải ảnh thất bại: ${uploadError.message}`);
        }
        
        const { data: urlData } = supabase.storage
          .from("post_images")
          .getPublicUrl(uploadData.path);
        
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

    const postData = {
      ...data,
      author_id: user.id,
      images: imageUrls,
    };

    const { data: newPost, error: insertError } = await supabase
      .from("posts")
      .insert(postData)
      .select()
      .single();

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Info */}
        <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem><FormLabel>Tiêu đề</FormLabel><FormControl><Input placeholder="VD: Bán tiệm nail gấp ở khu Mỹ trắng" {...field} /></FormControl><FormMessage /></FormItem>
        )}/>
        <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Mô tả</FormLabel><FormControl><Textarea placeholder="Mô tả chi tiết về tin đăng của bạn..." {...field} rows={5} /></FormControl><FormMessage /></FormItem>
        )}/>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Loại tin</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Chọn loại tin" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Bán tiệm">Bán tiệm</SelectItem><SelectItem value="Cần thợ">Cần thợ</SelectItem><SelectItem value="Học nail">Học nail</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Địa điểm (Thành phố, Tiểu bang)</FormLabel><FormControl><Input placeholder="VD: Houston, TX" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
        </div>

        {/* Conditional Fields for "Bán tiệm" */}
        {form.watch("category") === "Bán tiệm" && (
          <div className="space-y-8 p-6 border rounded-lg">
            <h3 className="text-lg font-medium">Thông tin chi tiết (Bán tiệm)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <FormField control={form.control} name="area" render={({ field }) => (<FormItem><FormLabel>Diện tích (sqft)</FormLabel><FormControl><Input placeholder="1200" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="chairs" render={({ field }) => (<FormItem><FormLabel>Số ghế</FormLabel><FormControl><Input type="number" placeholder="6" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="tables" render={({ field }) => (<FormItem><FormLabel>Số bàn</FormLabel><FormControl><Input type="number" placeholder="6" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="staff" render={({ field }) => (<FormItem><FormLabel>Số nhân sự</FormLabel><FormControl><Input type="number" placeholder="4" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField control={form.control} name="revenue" render={({ field }) => (<FormItem><FormLabel>Doanh thu</FormLabel><FormControl><Input placeholder="VD: $30,000/tháng" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="operating_hours" render={({ field }) => (<FormItem><FormLabel>Giờ hoạt động</FormLabel><FormControl><Input placeholder="VD: 10am - 7pm" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            </div>
            <FormField control={form.control} name="exact_address" render={({ field }) => (<FormItem><FormLabel>Địa chỉ chính xác</FormLabel><FormControl><Input placeholder="123 Main St, Houston, TX 77002" {...field} /></FormControl><FormMessage /></FormItem>)}/>
            
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

            <FormField control={form.control} name="services" render={({ field }) => (
                <FormItem><FormLabel>Các dịch vụ</FormLabel>
                    <div className="flex items-center space-x-4">
                    {servicesList.map((item) => (
                        <FormField key={item.id} control={form.control} name="services" render={({ field }) => (
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
            <FormField control={form.control} name="images" render={({ field: { onChange, value, ...rest } }) => (
                <FormItem><FormLabel>Hình ảnh/Video</FormLabel><FormControl><Input type="file" multiple accept="image/*,video/*" onChange={(e) => onChange(e.target.files)} {...rest} /></FormControl><FormDescription>Bạn có thể chọn nhiều file.</FormDescription><FormMessage /></FormItem>
            )}/>
          </div>
        )}

        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Đang đăng..." : "Đăng tin"}
        </Button>
      </form>
    </Form>
  );
}