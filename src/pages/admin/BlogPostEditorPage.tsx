import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { showLoading, showSuccess, showError, dismissToast } from "@/utils/toast";
import { Loader2, UploadCloud, X } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import ReactQuill from 'react-quill';
import { v4 as uuidv4 } from 'uuid';

const blogPostSchema = z.object({
  title: z.string().min(3, "Tiêu đề phải có ít nhất 3 ký tự."),
  content: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  cover_image: z.any().optional(),
});

type BlogPostFormValues = z.infer<typeof blogPostSchema>;

const BlogPostEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
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
          if (data.cover_image_url) {
            setCoverPreview(data.cover_image_url);
          }
        }
        setLoading(false);
      };
      fetchPost();
    }
  }, [id, isEditing, form, navigate]);

  async function onSubmit(data: BlogPostFormValues) {
    const toastId = showLoading(isEditing ? "Đang cập nhật..." : "Đang tạo...");
    const { data: { user } } = await supabase.auth.getUser();

    let coverImageUrl = coverPreview;

    if (data.cover_image && data.cover_image[0]) {
      const file = data.cover_image[0];
      const fileName = `${user?.id}/${uuidv4()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('blog_images').upload(fileName, file);
      if (uploadError) {
        dismissToast(toastId);
        showError(`Tải ảnh bìa thất bại: ${uploadError.message}`);
        return;
      }
      const { data: urlData } = supabase.storage.from('blog_images').getPublicUrl(uploadData.path);
      coverImageUrl = urlData.publicUrl;
    }

    const postData = {
      title: data.title,
      content: data.content,
      status: data.status,
      cover_image_url: coverImageUrl,
    };

    if (isEditing) {
      const { error } = await supabase.from('blog_posts').update(postData).eq('id', id);
      dismissToast(toastId);
      if (error) showError("Cập nhật thất bại: " + error.message);
      else {
        showSuccess("Cập nhật thành công!");
        navigate('/admin/blog');
      }
    } else {
      const { error } = await supabase.from('blog_posts').insert({ ...postData, author_id: user?.id });
      dismissToast(toastId);
      if (error) showError("Tạo bài viết thất bại: " + error.message);
      else {
        showSuccess("Tạo bài viết thành công!");
        navigate('/admin/blog');
      }
    }
  }

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  }), []);

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
          
          <FormField control={form.control} name="cover_image" render={({ field }) => (
            <FormItem>
              <FormLabel>Ảnh bìa</FormLabel>
              <FormControl>
                {coverPreview ? (
                  <div className="relative w-full h-64">
                    <img src={coverPreview} alt="Xem trước ảnh bìa" className="w-full h-full object-cover rounded-md" />
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => { setCoverPreview(null); field.onChange(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-md">
                    <UploadCloud className="h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Nhấp để tải lên ảnh bìa</p>
                    <Input type="file" className="sr-only" accept="image/*" onChange={(e) => { field.onChange(e.target.files); setCoverPreview(URL.createObjectURL(e.target.files![0])); }} />
                  </label>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}/>

          <FormField control={form.control} name="content" render={({ field }) => (
            <FormItem>
              <FormLabel>Nội dung</FormLabel>
              <FormControl>
                <ReactQuill theme="snow" value={field.value} onChange={field.onChange} modules={quillModules} className="bg-background" />
              </FormControl>
              <FormMessage />
            </FormItem>
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