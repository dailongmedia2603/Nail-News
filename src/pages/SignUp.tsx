import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';

const SignUp = () => {
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
            Tạo tài khoản mới
          </h2>
        </div>
        <div className="p-8 rounded-lg shadow-lg bg-white">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            theme="light"
            view="sign_up"
            localization={{
              variables: {
                sign_up: {
                  email_label: 'Địa chỉ email',
                  password_label: 'Tạo mật khẩu',
                  email_input_placeholder: 'Địa chỉ email của bạn',
                  password_input_placeholder: 'Mật khẩu của bạn',
                  button_label: 'Đăng ký',
                  link_text: 'Chưa có tài khoản? Đăng ký',
                },
              },
            }}
          />
           <p className="mt-6 text-center text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;