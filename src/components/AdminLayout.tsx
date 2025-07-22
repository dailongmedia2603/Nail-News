import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Skeleton } from './ui/skeleton';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || profile?.role !== 'admin') {
        navigate('/'); // Redirect non-admins to home page
      } else {
        setIsAdmin(true);
      }
      setLoading(false);
    };

    checkAdminStatus();
  }, [navigate]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return isAdmin ? <Outlet /> : null;
};

export default AdminLayout;