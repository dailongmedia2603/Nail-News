import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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

// This schema is similar to CreatePostForm, but image handling is excluded for now
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
          {/* Form fields will be similar to CreatePostForm */}
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
              {/* ... Bán tiệm fields ... */}
            </div>
          )}
          {formMethods.watch("category") === "Cần thợ" && (
            <div className="space-y-8 p-6 border rounded-lg">
              {/* ... Cần thợ fields ... */}
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