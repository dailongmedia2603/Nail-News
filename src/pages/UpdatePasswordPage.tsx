import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { showLoading, showSuccess, showError, dismissToast } from '@/utils/toast';
import { Loader2 } from 'lucide-react';

const updatePasswordSchema = z.object({
  password: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự."),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp.",
  path: ["confirmPassword"],
});

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

const UpdatePasswordPage = () => {
  const navigate = useNavigate();
  const form = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const handleUpdatePassword = async (data: UpdatePasswordFormValues) => {
    const toastId = showLoading("Đang cập nhật mật khẩu...");
    const { error } = await supabase.auth.updateUser({ password: data.password });
    dismissToast(toastId);

    if (error) {
      showError(`Lỗi: ${error.message}`);
    } else {
      showSuccess("Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.");
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-3xl font-extrabold text-gray-900">Tạo mật khẩu mới</CardTitle>
            <CardDescription className="text-center">Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdatePassword)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="password">Mật khẩu mới</Label>
                      <FormControl>
                        <Input id="password" type="password" {...field} />
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
                      <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                      <FormControl>
                        <Input id="confirmPassword" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Lưu mật khẩu mới
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;