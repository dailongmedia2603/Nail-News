import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { type Post } from './PostCard';
import { FileText, Loader2 } from 'lucide-react';

export function PostSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    setIsOpen(true);
    
    // Use the new RPC function for powerful searching
    const { data, error } = await supabase
      .rpc('search_posts', { search_term: searchQuery })
      .limit(10);
    
    if (error) {
      console.error('Lỗi tìm kiếm:', error);
      setResults([]);
    } else {
      setResults(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      clearTimeout(timerId);
    };
  }, [query, performSearch]);

  const handleSelect = (postId: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/posts/${postId}`);
  };

  return (
    <div className="relative w-full">
      <Command shouldFilter={false} className="rounded-lg border shadow-md overflow-visible">
        <CommandInput 
          placeholder="Tìm theo tiêu đề, thành phố, tiểu bang, ZIP, SĐT..." 
          value={query}
          onValueChange={setQuery}
          onFocus={() => query.length > 1 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        />
        {isOpen && (
          <CommandList className="absolute z-10 top-full mt-1 w-full bg-background border rounded-md shadow-lg">
            {loading && (
              <div className="p-4 flex items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tìm kiếm...
              </div>
            )}
            {!loading && results.length === 0 && query.length >= 2 && <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>}
            {results.length > 0 && (
              <CommandGroup heading="Gợi ý">
                {results.map((post) => (
                  <CommandItem
                    key={post.id}
                    value={post.id} // Use unique ID for value
                    onSelect={() => handleSelect(post.id)}
                    className="cursor-pointer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span>{post.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        )}
      </Command>
    </div>
  );
}