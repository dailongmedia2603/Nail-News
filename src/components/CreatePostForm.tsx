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
  state: z.string({ required_error: "Vui lòng chọn tiểu bang." }),
  city: z.string({ required_error: "Vui lòng chọn thành phố." }),
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

type State = { id: number; name: string; };
type City = { id: number; name: string; state_id: number; };

const PRICING = {
    urgent: 10, // $10/month
    vip: 25,    // $25/month
};

export function CreatePostForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string>('');

  const formMethods = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostFormSchema),
    defaultValues: {
      title: "", description: "", zip: "",
      services: [], tier: "free", duration: 0, tags: [],
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const { data: statesData } = await supabase.from('states').select('*').order('name');
      const { data: citiesData } = await supabase.from('cities').select('*').order('name');
      setStates(statesData || []);
      setCities(citiesData || []);
    };
    fetchCategories();
  }, []);

  const filteredCities = selectedStateId ? cities.filter(c => c.state_id === parseInt(selectedStateId)) : [];

  const selectedTier = formMethods.watch("tier");
  const selectedDuration = formMethods.watch("duration");

  const totalCost = useMemo(() => {
    if (selectedTier === 'free' || !selectedDuration) return 0;
    return PRICING[selectedTier] * selectedDuration;
  }, [selectedTier, selectedDuration]);

  async function onSubmit(data: CreatePostFormValues) {
    // ... onSubmit logic ...
  }

  return (
    <FormProvider {...formMethods}>
      <Form {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-8">
          {/* ... other form fields ... */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={formMethods.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiểu bang</FormLabel>
                  <Select onValueChange={(value) => { field.onChange(value); setSelectedStateId(value); formMethods.setValue('city', ''); }} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Chọn tiểu bang" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {states.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formMethods.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thành phố</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedStateId}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Chọn thành phố" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {filteredCities.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={formMethods.control} name="zip" render={({ field }) => ( <FormItem><FormLabel>Mã ZIP</FormLabel><FormControl><Input placeholder="VD: 77002" {...field} /></FormControl><FormMessage /></FormItem> )}/>
          </div>
          {/* ... other form fields ... */}
        </form>
      </Form>
    </FormProvider>
  );
}