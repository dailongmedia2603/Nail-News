import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { showLoading, showSuccess, showError, dismissToast } from "@/utils/toast";
import { useNavigate } from "react-router-dom";

const passwordFormSchema = z.object({
  oldPassword: z.string().min(1, "Mật khẩu cũ không được để trống."),
  newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu mới không khớp.",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function PasswordForm({ onFinished }: { onFinished?: () => void }) {
  const navigate = useNavigate();
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: PasswordFormValues) {
    const toastId = showLoading("Đang xử lý...");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      dismissToast(toastId);
      showError("Không thể xác định người dùng. Vui lòng đăng nhập lại.");
      return;
    }

    // Verify old password by trying to sign in with it
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: data.oldPassword,
    });

    if (signInError) {
      dismissToast(toastId);
      showError("Mật khẩu cũ không chính xác.");
      return;
    }

    // If old password is correct, update to the new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.newPassword,
    });

    dismissToast(toastId);

    if (updateError) {
      showError("Cập nhật mật khẩu thất bại: " + updateError.message);
    } else {
      showSuccess("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      onFinished?.();
      await supabase.auth.signOut();
      navigate('/login');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="oldPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu cũ</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu mới</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Xác nhận mật khẩu mới</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          Lưu thay đổi
        </Button>
      </form>
    </Form>
  );
}