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

const editPostFormSchema = z.object({
  title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự."),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự."),
  category: z.enum(["Bán tiệm", "Cần thợ", "Học nail"]),
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
  salary_info: z.string().optional(),
  store_status: z.string().optional(),
});

type EditPostFormValues = z.infer<typeof editPostFormSchema>;

const servicesList = [
  { id: "nail", label: "Nail" },
  { id: "toc", label: "Tóc" },
  { id: "mi", label: "Mi" },
] as const;

export function EditPostForm({ postId }: { postId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const formMethods = useForm<EditPostFormValues>({
    resolver: zodResolver(editPostFormSchema),
  });

  useEffect(() => {
    const fetchPostData = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (error || !data) {
        showError("Không thể tải dữ liệu tin đăng.");
        navigate("/profile/my-posts");
        return;
      }

      const [city, state, zip] = data.location?.split(', ').map(s => s.trim()) || ["", "", ""];
      
      formMethods.reset({
        ...data,
        city,
        state,
        zip,
      });
      setIsLoading(false);
    };
    fetchPostData();
  }, [postId, formMethods, navigate]);

  async function onSubmit(data: EditPostFormValues) {
    const toastId = showLoading("Đang cập nhật tin đăng...");
    setIsSubmitting(true);

    const locationString = `${data.city}, ${data.state}, ${data.zip}`;
    const { city, state, zip, ...restOfData } = data;

    const { error } = await supabase
      .from("posts")
      .update({ ...restOfData, location: locationString })
      .eq("id", postId);

    dismissToast(toastId);
    setIsSubmitting(false);

    if (error) {
      showError(`Cập nhật thất bại: ${error.message}`);
    } else {
      showSuccess("Cập nhật tin đăng thành công!");
      navigate(`/posts/${postId}`);
    }
  }

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-1/2" /></div>;
  }

  return (
    <FormProvider {...formMethods}>
      <Form {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-8">
          <FormField control={formMethods.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Tiêu đề</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
          <FormField control={formMethods.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Mô tả</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem> )}/>
          <FormField control={formMethods.control} name="category" render={({ field }) => ( <FormItem><FormLabel>Loại tin</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Bán tiệm">Bán tiệm</SelectItem><SelectItem value="Cần thợ">Cần thợ</SelectItem><SelectItem value="Học nail">Học nail</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={formMethods.control} name="city" render={({ field }) => ( <FormItem><FormLabel>Thành phố</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={formMethods.control} name="state" render={({ field }) => ( <FormItem><FormLabel>Tiểu bang</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={formMethods.control} name="zip" render={({ field }) => ( <FormItem><FormLabel>Mã ZIP</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
          </div>

          {formMethods.watch("category") === "Bán tiệm" && (
            <div className="space-y-8 p-6 border rounded-lg">
              <h3 className="text-lg font-medium">Thông tin chi tiết (Bán tiệm)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <FormField control={formMethods.control} name="area" render={({ field }) => (<FormItem><FormLabel>Diện tích (sqft)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={formMethods.control} name="chairs" render={({ field }) => (<FormItem><FormLabel>Số ghế</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={formMethods.control} name="tables" render={({ field }) => (<FormItem><FormLabel>Số bàn</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={formMethods.control} name="staff" render={({ field }) => (<FormItem><FormLabel>Số nhân sự</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField control={formMethods.control} name="revenue" render={({ field }) => (<FormItem><FormLabel>Doanh thu</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={formMethods.control} name="operating_hours" render={({ field }) => (<FormItem><FormLabel>Giờ hoạt động</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
              </div>
              <FormField control={formMethods.control} name="exact_address" render={({ field }) => (<FormItem><FormLabel>Địa chỉ chính xác</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
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
              <FormItem>
                <FormLabel>Hình ảnh/Video</FormLabel>
                <p className="text-sm text-muted-foreground">Tính năng chỉnh sửa hình ảnh/video sẽ sớm được cập nhật.</p>
              </FormItem>
            </div>
          )}
          {formMethods.watch("category") === "Cần thợ" && (
            <div className="space-y-8 p-6 border rounded-lg">
              <h3 className="text-lg font-medium">Thông tin chi tiết (Cần thợ)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField control={formMethods.control} name="salary_info" render={({ field }) => (<FormItem><FormLabel>Thông tin lương</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={formMethods.control} name="store_status" render={({ field }) => (
                      <FormItem><FormLabel>Trạng thái tiệm</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Đang hoạt động">Đang hoạt động</SelectItem><SelectItem value="Sắp khai trương">Sắp khai trương</SelectItem><SelectItem value="Đã đóng cửa">Đã đóng cửa</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )}/>
              </div>
              <FormField control={formMethods.control} name="operating_hours" render={({ field }) => (<FormItem><FormLabel>Giờ hoạt động</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={formMethods.control} name="exact_address" render={({ field }) => (<FormItem><FormLabel>Địa chỉ chính xác</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <FormItem>
                <FormLabel>Vị trí trên bản đồ</FormLabel>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground text-center p-4">Bản đồ sẽ sớm được tích hợp.<br/>(Cần API Key từ Google Maps Platform để hiển thị)</p>
                </div>
                <FormDescription>Sau khi nhập địa chỉ chính xác, vị trí sẽ được tự động ghim trên bản đồ.</FormDescription>
              </FormItem>
              <FormField control={formMethods.control} name="services" render={({ field }) => (
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

          <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi
          </Button>
        </form>
      </Form>
    </FormProvider>
  );
}