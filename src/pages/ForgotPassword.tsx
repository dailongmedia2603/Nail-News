import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đặt lại mật khẩu
          </h2>
        </div>
        <div className="p-8 rounded-lg shadow-lg bg-white">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            theme="light"
            view="forgotten_password"
            localization={{
              variables: {
                forgotten_password: {
                  email_label: 'Địa chỉ email',
                  email_input_placeholder: 'Địa chỉ email của bạn',
                  button_label: 'Gửi hướng dẫn đặt lại mật khẩu',
                  link_text: 'Quên mật khẩu?',
                },
              },
            }}
          />
          <p className="mt-6 text-center text-sm text-gray-600">
            Nhớ mật khẩu?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;