import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Building } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type ContactInfo = {
  contact_address: string;
  contact_email: string;
  contact_phone: string;
};

const ContactPage = () => {
  const [info, setInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContactInfo = async () => {
      setLoading(true);
      const { data } = await supabase.from('system_settings').select('key, value').in('key', ['contact_address', 'contact_email', 'contact_phone']);
      const settings = data?.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {} as any) || {};
      setInfo(settings);
      setLoading(false);
    };
    fetchContactInfo();
  }, []);

  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-6">
      <div className="text-center my-8">
        <h1 className="text-3xl md:text-4xl font-bold">Thông tin liên hệ</h1>
        <p className="text-muted-foreground mt-2">Chúng tôi luôn sẵn sàng hỗ trợ bạn.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Nailquangcao.com</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <Building className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Địa chỉ</h3>
                  <p className="text-muted-foreground">{info?.contact_address}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <a href={`mailto:${info?.contact_email}`} className="text-muted-foreground hover:text-primary">
                    {info?.contact_email}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Số điện thoại</h3>
                  <a href={`tel:${info?.contact_phone}`} className="text-muted-foreground hover:text-primary">
                    {info?.contact_phone}
                  </a>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactPage;