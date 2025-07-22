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
    // ... onSubmit logic ...
  }

  return (
    <FormProvider {...formMethods}>
      <Form {...formMethods}>
        <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-8">
          {/* ... all form fields ... */}
        </form>
      </Form>
    </FormProvider>
  );
}