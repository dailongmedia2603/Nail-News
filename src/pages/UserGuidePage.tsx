import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const guideData = [
  {
    title: "1. Quản lý Tài khoản Cá nhân",
    content: "Khu vực cá nhân giúp bạn quản lý mọi thông tin và hoạt động của mình trên website. Để truy cập, hãy nhấp vào biểu tượng tài khoản ở góc trên bên phải và chọn 'Hồ sơ'.\n\n- **Thông tin tài khoản:** Tại đây, bạn có thể cập nhật Họ, Tên và Số điện thoại. Email đăng ký là không thể thay đổi.\n- **Đổi mật khẩu:** Tăng cường bảo mật bằng cách thay đổi mật khẩu định kỳ.\n- **Ví của tôi:** Theo dõi số dư hiện tại và xem lại toàn bộ lịch sử giao dịch, bao gồm cả các khoản thanh toán cho tin đăng.\n- **Quản lý tin đăng:** Nơi tập trung tất cả các tin bạn đã đăng. Bạn có thể xem trạng thái, ngày hết hạn, sửa, xóa hoặc gia hạn tin.\n- **Yêu thích:** Danh sách các tin đăng bạn đã lưu lại để xem sau.\n- **Lịch sử đăng nhập:** Kiểm tra 20 lần đăng nhập gần nhất để đảm bảo an toàn cho tài khoản."
  },
  {
    title: "2. Hướng dẫn Đăng tin",
    content: "Để đăng tin, bạn chỉ cần nhấp vào nút 'Đăng tin' màu xanh ở góc trên bên phải màn hình và làm theo các bước sau:\n\n1. **Điền thông tin cơ bản:** Nhập Tiêu đề, Mô tả chi tiết, chọn Loại tin và Vị trí (Tiểu bang, Thành phố, Mã ZIP).\n2. **Cung cấp thông tin chi tiết:** Tùy thuộc vào 'Loại tin' bạn chọn (ví dụ: Bán tiệm, Cần thợ), sẽ có các trường thông tin bổ sung như diện tích, số ghế, thông tin lương... Hãy điền càng chi tiết càng tốt để thu hút người xem.\n3. **Thêm hình ảnh/video:** Tải lên các hình ảnh hoặc video chất lượng cao để tin đăng của bạn trở nên trực quan và hấp dẫn hơn.\n4. **Chọn Gói đăng tin:** Đây là bước quan trọng để quyết định mức độ hiển thị của tin đăng."
  },
  {
    title: "3. Tìm hiểu về các Gói Tin",
    content: "Chúng tôi cung cấp nhiều lựa chọn để phù hợp với nhu cầu của bạn:\n\n- **Tin Miễn phí:** Gói cơ bản, tin của bạn sẽ được hiển thị theo thứ tự thời gian thông thường.\n- **Tin Gấp:** Tin của bạn sẽ được gắn huy hiệu 'Gấp' nổi bật và được ưu tiên hiển thị hơn tin miễn phí. Gói này phù hợp khi bạn cần tìm thợ hoặc bán tiệm nhanh chóng.\n- **Tin VIP:** Gói cao cấp nhất. Tin của bạn sẽ được gắn huy hiệu 'VIP' sang trọng, được ghim lên đầu trang chủ và các trang danh mục liên quan, đảm bảo tiếp cận tối đa lượng người xem.\n\nSau khi chọn gói, bạn có thể chọn thời hạn đăng tin (3, 6, 9, hoặc 12 tháng) để nhận được các chính sách giảm giá hấp dẫn."
  },
  {
    title: "4. Thanh toán và Gia hạn",
    content: "Hệ thống thanh toán của chúng tôi rất linh hoạt:\n\n- **Thanh toán:** Khi đăng tin trả phí, bạn có thể chọn thanh toán bằng 'Ví của tôi' (nếu số dư đủ) hoặc thanh toán trực tiếp qua cổng Stripe an toàn bằng thẻ tín dụng/ghi nợ.\n- **Gia hạn:** Tại trang 'Quản lý tin đăng', bạn có thể dễ dàng gia hạn các tin sắp hoặc đã hết hạn. Quá trình gia hạn tương tự như đăng tin mới, bạn có thể chọn một gói mới và thời hạn mới cho tin đăng của mình."
  },
  {
    title: "5. Tìm kiếm và Lọc tin",
    content: "Để tìm kiếm thông tin hiệu quả:\n\n- **Thanh tìm kiếm:** Sử dụng thanh tìm kiếm ở trang chủ để tìm nhanh theo từ khóa, tiêu đề, địa điểm, hoặc thậm chí số điện thoại.\n- **Bộ lọc theo Loại tin:** Sử dụng các tab danh mục (Bán tiệm, Cần thợ,...) để xem các tin đăng trong từng lĩnh vực cụ thể.\n- **Bộ lọc Nâng cao:** Nhấp vào nút 'Bộ lọc' để tìm kiếm chi tiết hơn theo Tiểu bang, Thành phố và các Tag (từ khóa) cụ thể."
  }
];

const UserGuidePage = () => {
  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-6">
      <div className="text-center my-8">
        <h1 className="text-3xl md:text-4xl font-bold">Hướng dẫn sử dụng</h1>
        <p className="text-muted-foreground mt-2">Tất cả những gì bạn cần biết để sử dụng Nailquangcao.com một cách hiệu quả.</p>
      </div>
      <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
        {guideData.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-lg font-semibold">{item.title}</AccordionTrigger>
            <AccordionContent className="whitespace-pre-line text-base leading-7">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default UserGuidePage;