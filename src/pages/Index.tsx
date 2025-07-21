import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Index = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold mb-4">Chào mừng bạn đã trở lại!</h1>
        {userEmail && <p className="text-xl text-gray-600 mb-6">Bạn đã đăng nhập với email: {userEmail}</p>}
        <div className="flex justify-center gap-4">
            <Button onClick={() => navigate('/profile')}>
                Quản lý hồ sơ
            </Button>
            <Button onClick={handleLogout} variant="outline">
                Đăng xuất
            </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;