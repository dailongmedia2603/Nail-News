import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

const RenewLicensePage = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'renew_license_content')
        .single();
      
      setContent(data?.value || '<p>Nội dung chưa được cập nhật.</p>');
      setLoading(false);
    };
    fetchContent();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6">
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <article className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
      )}
    </div>
  );
};

export default RenewLicensePage;