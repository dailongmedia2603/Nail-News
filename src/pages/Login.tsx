import { CustomLoginForm } from '@/components/CustomLoginForm';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
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
          <CustomLoginForm />
          <p className="mt-6 text-center text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;