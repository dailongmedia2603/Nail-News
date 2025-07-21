import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { VideoPlayer } from '@/components/VideoPlayer';
import { Skeleton } from '@/components/ui/skeleton';
import { Pin } from 'lucide-react';

type Lesson = {
  id: number;
  title: string;
  description: string | null;
  video_url: string;
  is_pinned: boolean;
};

type Section = {
  id: number;
  title: string;
  lessons: Lesson[];
};

const TutorialsPage = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [pinnedLessons, setPinnedLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutorials = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('video_sections')
        .select(`
          id,
          title,
          lessons:video_lessons (
            id,
            title,
            description,
            video_url,
            is_pinned
          )
        `)
        .order('display_order', { ascending: true })
        .order('display_order', { foreignTable: 'video_lessons', ascending: true });

      if (error) {
        console.error("Lỗi tải video hướng dẫn:", error);
      } else {
        const allLessons = data.flatMap(section => section.lessons);
        setPinnedLessons(allLessons.filter(lesson => lesson.is_pinned));
        setSections(data);
      }
      setLoading(false);
    };

    fetchTutorials();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-8">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
        <Skeleton className="h-12 w-full mt-8" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="space-y-12">
        {/* Pinned Videos */}
        {pinnedLessons.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Pin className="mr-2 h-6 w-6 text-primary" />
              Video nổi bật
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pinnedLessons.map((lesson) => (
                <div key={lesson.id} className="space-y-3">
                  <VideoPlayer videoId={lesson.video_url} />
                  <h3 className="font-semibold text-lg">{lesson.title}</h3>
                  <p className="text-sm text-muted-foreground">{lesson.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All Lessons */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Tất cả bài học</h2>
          <Accordion type="single" collapsible className="w-full">
            {sections.map((section) => (
              <AccordionItem key={section.id} value={`item-${section.id}`}>
                <AccordionTrigger className="text-lg">{section.title}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-8 pt-4">
                    {section.lessons.map((lesson) => (
                      <div key={lesson.id} className="grid md:grid-cols-2 gap-6 items-start">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{lesson.title}</h3>
                          <p className="text-sm text-muted-foreground">{lesson.description}</p>
                        </div>
                        <VideoPlayer videoId={lesson.video_url} />
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </div>
  );
};

export default TutorialsPage;