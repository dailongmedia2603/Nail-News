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
  tags: z.array(z.number()).optional(),
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

      const { data: postTags, error: tagsError } = await supabase
        .from('post_tags')
        .select('tag_id')
        .eq('post_id', postId);

      const [city, state, zip] = data.location?.split(', ').map(s => s.trim()) || ["", "", ""];
      
      formMethods.reset({
        ...data,
        city,
        state,
        zip,
        tags: tagsError ? [] : postTags.map(t => t.tag_id),
      });
      setIsLoading(false);
    };
    fetchPostData();
  }, [postId, formMethods, navigate]);

  async function onSubmit(data: EditPostFormValues) {
    const toastId = showLoading("Đang cập nhật tin đăng...");
    setIsSubmitting(true);

    const locationString = `${data.city}, ${data.state}, ${data.zip}`;
    const { city, state, zip, tags, ...restOfData } = data;

    const { error: updateError } = await supabase
      .from("posts")
      .update({ ...restOfData, location: locationString })
      .eq("id", postId);

    if (updateError) {
      dismissToast(toastId);
      showError(`Cập nhật thất bại: ${updateError.message}`);
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
    return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-1/2" /></div>;
  }

  return (
    <FormProvider {...formMethods}>
      <Form {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-8">
          {/* ... other form fields ... */}
          <FormItem>
            <FormLabel>Tag & Từ khóa</FormLabel>
            <TagSelector name="tags" />
            <FormDescription>Chọn các tag phù hợp để người dùng dễ dàng tìm thấy tin của bạn.</FormDescription>
          </FormItem>
          <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi
          </Button>
        </form>
      </Form>
    </FormProvider>
  );
}