import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type License = {
  id: number;
  license_type: string;
  name: string;
  location: string;
};

const RenewLicensePage = () => {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase.from('system_settings').select('key, value').in('key', ['renew_license_content', 'renew_license_image_url']);
      const settings = data?.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {} as { [key: string]: string }) || {};
      setContent(settings.renew_license_content || '<p>Nội dung chưa được cập nhật.</p>');
      setImageUrl(settings.renew_license_image_url || null);

      const { data: licensesData } = await supabase.from('licenses').select('*').order('created_at', { ascending: false });
      setLicenses(licensesData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8">
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {imageUrl && <img src={imageUrl} alt="Renew License" className="w-full rounded-lg" />}
          <article className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>DANH SÁCH BẰNG HẾT HẠN HÔM NAY</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-40 w-full" /> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>From</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map(license => (
                  <TableRow key={license.id}>
                    <TableCell>{license.license_type}</TableCell>
                    <TableCell>{license.name}</TableCell>
                    <TableCell>{license.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RenewLicensePage;