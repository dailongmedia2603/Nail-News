import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { showLoading, showSuccess, showError, dismissToast } from "@/utils/toast";
import { Skeleton } from "./ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

const countryCodes = [
    { label: "USA (+1)", value: "+1" },
    { label: "Việt Nam (+84)", value: "+84" },
];

export function AccountForm() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  const accountFormSchema = z.object({
    first_name: z.string().min(1, t('accountForm.validation.firstNameRequired')),
    last_name: z.string().min(1, t('accountForm.validation.lastNameRequired')),
    email: z.string().email(),
    country_code: z.string(),
    phone: z.string().regex(/^\d*$/, t('accountForm.validation.phoneInvalid')).optional().or(z.literal('')),
  });

  type AccountFormValues = z.infer<typeof accountFormSchema>;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      country_code: "+84",
      phone: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Lỗi tải hồ sơ:", error);
          showError(t('toasts.profileLoadError'));
        } else {
            const phone = user.phone || '';
            let countryCode = '+84';
            let phoneNumber = '';

            const matchedCode = countryCodes.find(c => phone.startsWith(c.value));
            if (matchedCode) {
                countryCode = matchedCode.value;
                phoneNumber = phone.substring(matchedCode.value.length);
            } else if (phone) {
                phoneNumber = phone.replace(/^\+/, ''); // Fallback for other codes
            }

            form.reset({
                email: user.email || "",
                first_name: profile?.first_name || "",
                last_name: profile?.last_name || "",
                country_code: countryCode,
                phone: phoneNumber,
            });
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [form, t]);

  async function onSubmit(data: AccountFormValues) {
    const toastId = showLoading(t('toasts.updatingInfo'));
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        dismissToast(toastId);
        showError(t('toasts.userNotFound'));
        return;
    }

    const phoneToUpdate = data.phone ? data.country_code + data.phone : '';
    const { error: functionError } = await supabase.functions.invoke('update-phone', {
        body: { phone: phoneToUpdate },
    });

    if (functionError) {
        dismissToast(toastId);
        showError(t('toasts.phoneUpdateError', { message: functionError.message }));
        return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
      })
      .eq("id", user.id);

    dismissToast(toastId);
    if (profileError) {
      showError(t('toasts.profileUpdateError', { message: profileError.message }));
    } else {
      showSuccess(t('toasts.profileUpdateSuccess'));
    }
  }

  if (loading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('accountForm.email')}</FormLabel>
              <FormControl>
                <Input {...field} readOnly disabled />
              </FormControl>
              <FormDescription>
                {t('accountForm.emailDescription')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('accountForm.firstName')}</FormLabel>
                <FormControl>
                    <Input placeholder={t('accountForm.firstNamePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('accountForm.lastName')}</FormLabel>
                <FormControl>
                    <Input placeholder={t('accountForm.lastNamePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormItem>
            <FormLabel>{t('accountForm.phone')}</FormLabel>
            <div className="flex gap-2">
                <FormField
                    control={form.control}
                    name="country_code"
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl className="w-[140px]">
                                <SelectTrigger>
                                    <SelectValue placeholder={t('accountForm.countryCode')} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {countryCodes.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormControl>
                            <Input placeholder={t('accountForm.phonePlaceholder')} {...field} />
                        </FormControl>
                    )}
                />
            </div>
            <FormMessage>{form.formState.errors.phone?.message}</FormMessage>
        </FormItem>
        <Button type="submit" disabled={form.formState.isSubmitting}>{t('accountForm.updateProfile')}</Button>
      </form>
    </Form>
  );
}