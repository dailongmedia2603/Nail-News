import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Building } from "lucide-react";

const ContactPage = () => {
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
          <div className="flex items-center gap-4">
            <Building className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-semibold">Địa chỉ</h3>
              <p className="text-muted-foreground">123 Nail St, Beauty City, USA</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Mail className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-semibold">Email</h3>
              <a href="mailto:lienhe@nailquangcao.com" className="text-muted-foreground hover:text-primary">
                lienhe@nailquangcao.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Phone className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-semibold">Số điện thoại</h3>
              <a href="tel:+11234567890" className="text-muted-foreground hover:text-primary">
                (123) 456-7890
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactPage;