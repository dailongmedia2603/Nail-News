import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng nhập vào tài khoản của bạn
          </h2>
        </div>
        <div className="p-8 rounded-lg shadow-lg bg-white">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            theme="light"
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email hoặc Số điện thoại',
                  password_label: 'Mật khẩu',
                  email_input_placeholder: 'Email hoặc số điện thoại của bạn',
                  password_input_placeholder: 'Mật khẩu của bạn',
                  button_label: 'Đăng nhập',
                  social_provider_text: 'Đăng nhập với {{provider}}',
                  link_text: 'Đã có tài khoản? Đăng nhập',
                },
                sign_up: {
                  email_label: 'Địa chỉ email',
                  password_label: 'Tạo mật khẩu',
                  email_input_placeholder: 'Địa chỉ email của bạn',
                  password_input_placeholder: 'Mật khẩu của bạn',
                  button_label: 'Đăng ký',
                  link_text: 'Chưa có tài khoản? Đăng ký',
                },
                forgotten_password: {
                  email_label: 'Địa chỉ email',
                  email_input_placeholder: 'Địa chỉ email của bạn',
                  button_label: 'Gửi hướng dẫn đặt lại mật khẩu',
                  link_text: 'Quên mật khẩu?',
                },
                update_password: {
                    password_label: 'Mật khẩu mới',
                    password_input_placeholder: 'Mật khẩu mới của bạn',
                    button_label: 'Cập nhật mật khẩu',
                }
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;