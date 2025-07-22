import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Skeleton } from './ui/skeleton';

type Tag = {
  id: number;
  name: string;
};

interface TagSelectorProps {
  name: string;
}

export function TagSelector({ name }: TagSelectorProps) {
  const { control } = useFormContext();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('tags').select('*').order('name');
      if (!error) {
        setTags(data);
      }
      setLoading(false);
    };
    fetchTags();
  }, []);

  if (loading) {
    return <div className="flex gap-4"><Skeleton className="h-6 w-20" /><Skeleton className="h-6 w-20" /></div>;
  }

  return (
    <div className="flex flex-wrap gap-4">
      {tags.map((tag) => (
        <FormField
          key={tag.id}
          control={control}
          name={name}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value?.includes(tag.id)}
                  onCheckedChange={(checked) => {
                    return checked
                      ? field.onChange([...(field.value || []), tag.id])
                      : field.onChange(field.value?.filter((value: number) => value !== tag.id));
                  }}
                />
              </FormControl>
              <FormLabel className="font-normal">{tag.name}</FormLabel>
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}