import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError, showLoading, dismissToast } from '@/utils/toast';
import { useNavigate, Link } from 'react-router-dom';

const isEmail = (input: string) => {
  return input.includes('@');
};

export function CustomLoginForm() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = showLoading('Đang đăng nhập...');

    let phoneValue = emailOrPhone;
    if (!isEmail(emailOrPhone) && !emailOrPhone.startsWith('+')) {
      phoneValue = `+${emailOrPhone}`;
    }

    const credentials = {
      password,
      ...(isEmail(emailOrPhone) ? { email: emailOrPhone } : { phone: phoneValue }),
    };

    const { error } = await supabase.auth.signInWithPassword(credentials);

    dismissToast(toastId);
    setLoading(false);

    if (error) {
      showError(error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } else {
      navigate('/');
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      <div>
        <Label htmlFor="emailOrPhone">Email hoặc Số điện thoại</Label>
        <Input
          id="emailOrPhone"
          type="text"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
          placeholder="Email hoặc số điện thoại của bạn"
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mật khẩu của bạn"
          required
          className="mt-1"
        />
      </div>
      <div className="text-sm text-right">
        <Link to="/forgot-password" className="font-medium text-primary hover:underline">
          Quên mật khẩu?
        </Link>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Đang xử lý...' : 'Đăng nhập'}
      </Button>
    </form>
  );
}