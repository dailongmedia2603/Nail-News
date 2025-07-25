import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { showLoading, showSuccess, showError, dismissToast } from "@/utils/toast";
import { Loader2, PlusCircle, XCircle } from "lucide-react";
import { ImageUploader } from "./ImageUploader";
import { type Post } from "./PostCard";
import { v4 as uuidv4 } from 'uuid';

const albumFormSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống."),
  description: z.string().optional(),
  images: z.any().optional(),
  videos: z.array(z.object({ url: z.string().url("Link YouTube không hợp lệ.") })).optional(),
});

type AlbumFormValues = z.infer<typeof albumFormSchema>;

interface AlbumFormProps {
  albumType: 'image' | 'video';
  initialData?: Post;
  onSave: () => void;
  onCancel: () => void;
}

export function AlbumForm({ albumType, initialData, onSave, onCancel }: AlbumFormProps) {
  const form = useForm<AlbumFormValues>({
    resolver: zodResolver(albumFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      videos: initialData?.images?.map(url => ({ url })) || [{ url: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "videos",
  });

  const onSubmit = async (data: AlbumFormValues) => {
    const toastId = showLoading("Đang lưu album...");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      dismissToast(toastId);
      showError("Không thể xác thực người dùng.");
      return;
    }

    let mediaUrls: string[] = [];

    if (albumType === 'image' && data.images instanceof FileList && data.images.length > 0) {
      const uploadPromises = Array.from(data.images).map(async (file) => {
        const fileName = `${user.id}/${uuidv4()}`;
        const { data: uploadData, error } = await supabase.storage.from("post_images").upload(fileName, file);
        if (error) throw new Error(`Tải ảnh thất bại: ${error.message}`);
        return supabase.storage.from("post_images").getPublicUrl(uploadData.path).data.publicUrl;
      });
      try {
        mediaUrls = await Promise.all(uploadPromises);
      } catch (error: any) {
        dismissToast(toastId);
        showError(error.message);
        return;
      }
    } else if (albumType === 'video' && data.videos) {
      mediaUrls = data.videos.map(v => v.url).filter(Boolean);
    }

    const postData = {
      title: data.title,
      description: data.description,
      images: mediaUrls.length > 0 ? mediaUrls : initialData?.images,
      category: 'Photo, video',
      author_id: user.id,
    };

    let error;
    if (initialData) {
      ({ error } = await supabase.from('posts').update(postData).eq('id', initialData.id));
    } else {
      ({ error } = await supabase.from('posts').insert(postData));
    }

    dismissToast(toastId);
    if (error) {
      showError("Lưu album thất bại: " + error.message);
    } else {
      showSuccess("Lưu album thành công!");
      onSave();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField control={form.control} name="title" render={({ field }) => <FormItem><FormLabel>Tiêu đề</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
        <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Mô tả</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>} />
        
        {albumType === 'image' && (
          <FormField control={form.control} name="images" render={() => <FormItem><FormLabel>Tải ảnh lên</FormLabel><FormControl><ImageUploader name="images" /></FormControl><FormMessage /></FormItem>} />
        )}

        {albumType === 'video' && (
          <div className="space-y-4">
            <FormLabel>Link Video YouTube</FormLabel>
            {fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`videos.${index}.url`}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl><Input {...field} placeholder="https://www.youtube.com/watch?v=..." /></FormControl>
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                        <XCircle className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ url: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Thêm Video
            </Button>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu Album
          </Button>
        </div>
      </form>
    </Form>
  );
}