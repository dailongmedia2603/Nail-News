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
import { useState, useMemo, useEffect } from "react";
import { showLoading, showSuccess, showError, dismissToast } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import { Loader2, Star, Zap } from "lucide-react";
import { ImageUploader } from "./ImageUploader";
import { Card, CardContent } from "./ui/card";
import { addMonths } from 'date-fns';
import { TagSelector } from './TagSelector';

type State = { id: number; name: string; };
type City = { id: number; name: string; state_id: number; };

const createPostFormSchema = z.object({
  title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự."),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự."),
  category: z.enum(["Bán tiệm", "Cần thợ", "Học nail"], { required_error: "Bạn phải chọn một loại tin." }),
  state_id: z.coerce.number({ required_error: "Bạn phải chọn tiểu bang." }),
  city_id: z.coerce.number({ required_error: "Bạn phải chọn thành phố." }),
  zip: z.string().min(5, "Mã ZIP phải có 5 chữ số.").max(5, "Mã ZIP phải có 5 chữ số."),
  exact_address: z.string().optional(),
  area: z.string().optional(),
  chairs: z.coerce.number().optional(),
  tables: z.coerce.number().optional(),
  staff: z.coerce.number().optional(),
  revenue: z.string().optional(),
  operating_hours: z.string().optional(),
  services: z.array(z.string()).optional(),
  images: z.instanceof(FileList).optional(),
  salary_info: z.string().optional(),
  store_status: z.string().optional(),
  tier: z.enum(["free", "urgent", "vip"]).default("free"),
  duration: z.coerce.number().optional(),
  tags: z.array(z.number()).optional(),
});

type CreatePostFormValues = z.infer<typeof createPostFormSchema>;

const PRICING = { urgent: 10, vip: 25 };

export function CreatePostForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);

  const formMethods = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      tags: [],
      services: [],
      tier: "free",
    },
  });

  const selectedStateId = formMethods.watch("state_id");
  const selectedTier = formMethods.watch("tier");
  const selectedDuration = formMethods.watch("duration");

  useEffect(() => {
    const fetchCategories = async () => {
      const { data: statesData } = await supabase.from('states').select('*').order('name');
      const { data: citiesData } = await supabase.from('cities').select('*').order('name');
      setStates(statesData || []);
      setCities(citiesData || []);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedStateId) {
      setFilteredCities(cities.filter(city => city.state_id === selectedStateId));
      formMethods.setValue('city_id', undefined as any);
    } else {
      setFilteredCities([]);
    }
  }, [selectedStateId, cities, formMethods]);

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
        const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single();
        if (!profile || profile.balance < totalCost) {
            dismissToast(toastId);
            showError("Số dư trong ví không đủ.");
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

    const selectedState = states.find(s => s.id === data.state_id);
    const selectedCity = cities.find(c => c.id === data.city_id);
    const locationString = `${selectedCity?.name}, ${selectedState?.name}, ${data.zip}`;
    const expiresAt = data.tier !== 'free' && data.duration ? addMonths(new Date(), data.duration).toISOString() : null;
    const { city_id, state_id, zip, duration, tags, ...restOfData } = data;
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
      const postTags = tags.map(tagId => ({ post_id: newPost.id, tag_id: tagId }));
      await supabase.from('post_tags').insert(postTags);
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
            <FormField control={formMethods.control} name="state_id" render={({ field }) => (
                <FormItem><FormLabel>Tiểu bang</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value?.toString()}><FormControl><SelectTrigger><SelectValue placeholder="Chọn tiểu bang" /></SelectTrigger></FormControl><SelectContent>{states.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <FormField control={formMethods.control} name="city_id" render={({ field }) => (
                <FormItem><FormLabel>Thành phố</FormLabel><Select onValueChange={field.onChange} value={field.value?.toString()} disabled={!selectedStateId}><FormControl><SelectTrigger><SelectValue placeholder="Chọn thành phố" /></SelectTrigger></FormControl><SelectContent>{filteredCities.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <FormField control={formMethods.control} name="zip" render={({ field }) => ( <FormItem><FormLabel>Mã ZIP</FormLabel><FormControl><Input placeholder="VD: 77002" {...field} /></FormControl><FormMessage /></FormItem> )}/>
          </div>
          {/* ... rest of the form ... */}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Đang đăng..." : "Đăng tin"}
          </Button>
        </form>
      </Form>
    </FormProvider>
  );
}