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

type State = { id: number; name: string; };
type City = { id: number; name: string; state_id: number; };

const editPostFormSchema = z.object({
  title: z.string().min(5, "Tiêu đề phải có ít nhất 5 ký tự."),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự."),
  category: z.enum(["Bán tiệm", "Cần thợ", "Học nail"]),
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
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);

  const formMethods = useForm<EditPostFormValues>({
    resolver: zodResolver(editPostFormSchema),
  });

  const selectedStateId = formMethods.watch("state_id");

  useEffect(() => {
    const fetchPostAndCategories = async () => {
      setIsLoading(true);
      const { data: statesData } = await supabase.from('states').select('*').order('name');
      const { data: citiesData } = await supabase.from('cities').select('*').order('name');
      const allStates = statesData || [];
      const allCities = citiesData || [];
      setStates(allStates);
      setCities(allCities);

      const { data: postData, error } = await supabase.from("posts").select("*").eq("id", postId).single();
      if (error || !postData) {
        showError("Không thể tải dữ liệu tin đăng.");
        navigate("/profile/my-posts");
        return;
      }

      const [cityName, stateName, zip] = postData.location?.split(', ').map(s => s.trim()) || ["", "", ""];
      const foundState = allStates.find(s => s.name === stateName);
      const foundCity = allCities.find(c => c.name === cityName && c.state_id === foundState?.id);
      
      if (foundState) {
        setFilteredCities(allCities.filter(city => city.state_id === foundState.id));
      }

      const { data: postTags } = await supabase.from('post_tags').select('tag_id').eq('post_id', postId);

      formMethods.reset({
        ...postData,
        state_id: foundState?.id,
        city_id: foundCity?.id,
        zip: zip || "",
        tags: postTags?.map(t => t.tag_id) || [],
      });
      setIsLoading(false);
    };
    fetchPostAndCategories();
  }, [postId, formMethods, navigate]);

  useEffect(() => {
    if (selectedStateId) {
      setFilteredCities(cities.filter(city => city.state_id === Number(selectedStateId)));
      if (!isLoading) {
        formMethods.setValue('city_id', undefined as any);
      }
    } else {
      setFilteredCities([]);
    }
  }, [selectedStateId, cities, formMethods, isLoading]);

  async function onSubmit(data: EditPostFormValues) {
    const toastId = showLoading("Đang cập nhật tin đăng...");
    setIsSubmitting(true);

    const selectedState = states.find(s => s.id === data.state_id);
    const selectedCity = cities.find(c => c.id === data.city_id);
    const locationString = `${selectedCity?.name}, ${selectedState?.name}, ${data.zip}`;
    const { city_id, state_id, zip, tags, ...restOfData } = data;

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

  return (
    <FormProvider {...formMethods}>
      <Form {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-8">
          <FormField control={formMethods.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Tiêu đề</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
          <FormField control={formMethods.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Mô tả</FormLabel><FormControl><Textarea {...field} rows={5} /></FormControl><FormMessage /></FormItem> )}/>
          <FormField control={formMethods.control} name="category" render={({ field }) => ( <FormItem><FormLabel>Loại tin</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Bán tiệm">Bán tiệm</SelectItem><SelectItem value="Cần thợ">Cần thợ</SelectItem><SelectItem value="Học nail">Học nail</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField control={formMethods.control} name="state_id" render={({ field }) => (
                <FormItem><FormLabel>Tiểu bang</FormLabel><Select onValueChange={field.onChange} value={field.value?.toString()}><FormControl><SelectTrigger><SelectValue placeholder="Chọn tiểu bang" /></SelectTrigger></FormControl><SelectContent>{states.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <FormField control={formMethods.control} name="city_id" render={({ field }) => (
                <FormItem><FormLabel>Thành phố</FormLabel><Select onValueChange={field.onChange} value={field.value?.toString()} disabled={!selectedStateId}><FormControl><SelectTrigger><SelectValue placeholder="Chọn thành phố" /></SelectTrigger></FormControl><SelectContent>{filteredCities.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <FormField control={formMethods.control} name="zip" render={({ field }) => ( <FormItem><FormLabel>Mã ZIP</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
          </div>
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