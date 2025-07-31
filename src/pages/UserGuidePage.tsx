import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type Guide = {
  id: number;
  title: string;
  content: string;
};

const UserGuidePage = () => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuides = async () => {
      setLoading(true);
      const { data } = await supabase.from('user_guide_sections').select('*').order('display_order');
      setGuides(data || []);
      setLoading(false);
    };
    fetchGuides();
  }, []);

  return (
    <div className="container mx-auto max-w-3xl p-4 md:p-6">
      <div className="text-center my-8">
        <h1 className="text-3xl md:text-4xl font-bold">Hướng dẫn sử dụng</h1>
        <p className="text-muted-foreground mt-2">Tất cả những gì bạn cần biết để sử dụng Nailquangcao.com một cách hiệu quả.</p>
      </div>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
          {guides.map((item, index) => (
            <AccordionItem key={item.id} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg font-semibold">{item.title}</AccordionTrigger>
              <AccordionContent className="whitespace-pre-line text-base leading-7">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default UserGuidePage;