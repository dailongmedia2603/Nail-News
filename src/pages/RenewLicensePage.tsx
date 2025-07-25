import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredLicenses = useMemo(() => {
    if (!searchTerm) return licenses;
    return licenses.filter(license => 
      license.license_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [licenses, searchTerm]);

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
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm theo loại bằng, tên, hoặc nơi cấp..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
                {filteredLicenses.length > 0 ? (
                  filteredLicenses.map(license => (
                    <TableRow key={license.id}>
                      <TableCell>{license.license_type}</TableCell>
                      <TableCell>{license.name}</TableCell>
                      <TableCell>{license.location}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">Không tìm thấy kết quả.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RenewLicensePage;