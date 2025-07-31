import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqData = [
  {
    question: "Làm thế nào để đăng một tin quảng cáo?",
    answer: "Để đăng tin, bạn chỉ cần nhấp vào nút 'Đăng tin' ở góc trên bên phải, điền đầy đủ thông tin theo mẫu và chọn gói đăng tin phù hợp. Tin của bạn sẽ được hiển thị ngay sau khi hoàn tất.",
  },
  {
    question: "Làm sao để tin của tôi nổi bật hơn?",
    answer: "Chúng tôi cung cấp các gói 'Tin Gấp' và 'Tin VIP' để giúp tin của bạn tiếp cận nhiều người hơn. Tin Gấp sẽ có huy hiệu đặc biệt, còn Tin VIP sẽ được ghim lên đầu trang chủ và các trang danh mục.",
  },
  {
    question: "Việc đăng tin có miễn phí không?",
    answer: "Có, chúng tôi cung cấp gói 'Tin miễn phí' cho phép bạn đăng tin cơ bản. Tuy nhiên, để tin của bạn được ưu tiên hiển thị và có các tính năng nổi bật, bạn nên cân nhắc sử dụng các gói trả phí.",
  },
  {
    question: "Tôi có thể chỉnh sửa tin đã đăng không?",
    answer: "Hoàn toàn có thể. Bạn hãy vào trang cá nhân, chọn mục 'Quản lý tin đăng'. Tại đây, bạn có thể tìm thấy tất cả các tin đã đăng và thực hiện chỉnh sửa hoặc xóa tin.",
  },
  {
    question: "Hệ thống thanh toán hoạt động như thế nào?",
    answer: "Chúng tôi hỗ trợ hai phương thức thanh toán: thanh toán qua 'Ví của tôi' và thanh toán trực tiếp qua cổng Stripe an toàn. Bạn có thể nạp tiền vào ví để thanh toán nhanh hơn cho các lần sau.",
  },
];

const FaqPage = () => {
  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-6">
      <div className="text-center my-8">
        <h1 className="text-3xl md:text-4xl font-bold">Câu hỏi thường gặp (FAQ)</h1>
        <p className="text-muted-foreground mt-2">Tìm câu trả lời cho các thắc mắc của bạn về cách sử dụng website.</p>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {faqData.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
            <AccordionContent>
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FaqPage;