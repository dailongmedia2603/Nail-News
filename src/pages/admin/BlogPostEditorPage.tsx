import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { showLoading, showSuccess, showError, dismissToast } from "@/utils/toast";
import { Loader2 } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';

const blogPostSchema = z.object({
  title: z.string().min(3, "Tiêu đề phải có ít nhất 3 ký tự."),
  content: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
});

type BlogPostFormValues = z.infer<typeof blogPostSchema>;

const BlogPostEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const isEditing = !!id;

  const form = useForm<BlogPostFormValues>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: { title: '', content: '', status: 'draft' },
  });

  useEffect(() => {
    if (isEditing) {
      const fetchPost = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('blog_posts').select('*').eq('id', id).single();
        if (error) {
          showError("Không thể tải bài viết.");
          navigate('/admin/blog');
        } else {
          form.reset(data);
        }
        setLoading(false);
      };
      fetchPost();
    }
  }, [id, isEditing, form, navigate]);

  async function onSubmit(data: BlogPostFormValues) {
    const toastId = showLoading(isEditing ? "Đang cập nhật..." : "Đang tạo...");
    const { data: { user } } = await supabase.auth.getUser();

    if (isEditing) {
      const { error } = await supabase.from('blog_posts').update(data).eq('id', id);
      dismissToast(toastId);
      if (error) showError("Cập nhật thất bại: " + error.message);
      else {
        showSuccess("Cập nhật thành công!");
        navigate('/admin/blog');
      }
    } else {
      const { error } = await supabase.from('blog_posts').insert({ ...data, author_id: user?.id });
      dismissToast(toastId);
      if (error) showError("Tạo bài viết thất bại: " + error.message);
      else {
        showSuccess("Tạo bài viết thành công!");
        navigate('/admin/blog');
      }
    }
  }

  if (loading) {
    return <div className="container mx-auto p-4 md:p-6 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{isEditing ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem><FormLabel>Tiêu đề</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
          <FormField control={form.control} name="content" render={({ field }) => (
            <FormItem><FormLabel>Nội dung</FormLabel><FormControl><Textarea {...field} rows={15} /></FormControl><FormMessage /></FormItem>
          )}/>
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem className="space-y-3"><FormLabel>Trạng thái</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4">
                  <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="draft" /></FormControl><FormLabel className="font-normal">Bản nháp</FormLabel></FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="published" /></FormControl><FormLabel className="font-normal">Xuất bản</FormLabel></FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}/>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Lưu thay đổi' : 'Tạo bài viết'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default BlogPostEditorPage;