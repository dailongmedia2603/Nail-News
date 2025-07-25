import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { showLoading, showSuccess, showError, dismissToast } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import ReactQuill from 'react-quill';
import { useMemo } from 'react';

const RenewLicensePage = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'renew_license_content')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        showError("Không thể tải nội dung.");
      } else {
        setContent(data?.value || '');
      }
      setLoading(false);
    };
    fetchContent();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = showLoading("Đang lưu nội dung...");
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key: 'renew_license_content', value: content });
    
    dismissToast(toastId);
    if (error) {
      showError("Lưu thất bại: " + error.message);
    } else {
      showSuccess("Đã lưu nội dung thành công.");
    }
    setIsSaving(false);
  };

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['link', 'image'],
      ['clean']
    ],
  }), []);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Quản lý Nội dung Renew License</h1>
      <Card>
        <CardHeader>
          <CardTitle>Chỉnh sửa nội dung</CardTitle>
          <CardDescription>Nội dung bạn nhập ở đây sẽ được hiển thị trên trang Renew License cho người dùng.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="space-y-4">
              <ReactQuill theme="snow" value={content} onChange={setContent} modules={quillModules} className="bg-background" />
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RenewLicensePage;