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
import { TagSelector } from './TagSelector';

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
  tags: z.array(z.number()).optional(),
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
      services: [], tier: "free", duration: 0, tags: [],
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
    const { city, state, zip, duration, tags, ...restOfData } = data;
    const postData = { 
        ...restOfData, 
        location: locationString, 
        author_id: user.id, 
        images: imageUrls, 
        expires_at: expiresAt,
        duration_months: duration,
    };

    const { data: newPost, error: insertError } = await supabase.from("posts").insert(postData).select().single();

    if (insertError) {
      dismissToast(toastId);
      showError(`Đăng tin thất bại: ${insertError.message}`);
      setIsSubmitting(false);
      return;
    }

    if (tags && tags.length > 0) {
      const postTags = tags.map(tagId => ({
        post_id: newPost.id,
        tag_id: tagId,
      }));
      const { error: tagError } = await supabase.from('post_tags').insert(postTags);
      if (tagError) {
        showError(`Đăng tin thành công nhưng không thể lưu tag: ${tagError.message}`);
      }
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
          {/* ... other form fields ... */}
          <FormItem>
            <FormLabel>Tag & Từ khóa</FormLabel>
            <TagSelector name="tags" />
            <FormDescription>Chọn các tag phù hợp để người dùng dễ dàng tìm thấy tin của bạn.</FormDescription>
          </FormItem>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Đang đăng..." : "Đăng tin"}
          </Button>
        </form>
      </Form>
    </FormProvider>
  );
}