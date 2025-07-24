import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type State = { id: number; name: string; };
type City = { id: number; name: string; state_id: number; };
type Tag = { id: number; name: string; };

interface PostFiltersProps {
  onFiltersApply: (filters: { stateId: number | null; cityId: number | null; tagIds: number[] }) => void;
}

export function PostFilters({ onFiltersApply }: PostFiltersProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);

  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: statesData } = await supabase.from('states').select('*').order('name');
      const { data: citiesData } = await supabase.from('cities').select('*').order('name');
      const { data: tagsData } = await supabase.from('tags').select('*').order('name');
      setStates(statesData || []);
      setCities(citiesData || []);
      setTags(tagsData || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedState) {
      setFilteredCities(cities.filter(city => city.state_id === selectedState));
      setSelectedCity(null);
    } else {
      setFilteredCities([]);
    }
  }, [selectedState, cities]);

  const handleTagChange = (tagId: number, checked: boolean) => {
    setSelectedTags(prev => 
      checked ? [...prev, tagId] : prev.filter(id => id !== tagId)
    );
  };

  const handleApply = () => {
    onFiltersApply({
      stateId: selectedState,
      cityId: selectedCity,
      tagIds: selectedTags,
    });
    setIsOpen(false);
  };

  const handleReset = () => {
    setSelectedState(null);
    setSelectedCity(null);
    setSelectedTags([]);
    onFiltersApply({ stateId: null, cityId: null, tagIds: [] });
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Bộ lọc
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('postFilters.title')}</SheetTitle>
        </SheetHeader>
        <div className="py-4 space-y-6">
          <div className="space-y-2">
            <Label>{t('postFilters.location')}</Label>
            <Select onValueChange={(value) => setSelectedState(Number(value))} value={selectedState?.toString()}>
              <SelectTrigger><SelectValue placeholder={t('postFilters.selectState')} /></SelectTrigger>
              <SelectContent>{states.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={(value) => setSelectedCity(Number(value))} value={selectedCity?.toString()} disabled={!selectedState}>
              <SelectTrigger><SelectValue placeholder={t('postFilters.selectCity')} /></SelectTrigger>
              <SelectContent>{filteredCities.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('postFilters.tagsKeywords')}</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
              {tags.map(tag => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`tag-${tag.id}`} 
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={(checked) => handleTagChange(tag.id, !!checked)}
                  />
                  <Label htmlFor={`tag-${tag.id}`} className="font-normal">{tag.name}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button variant="ghost" onClick={handleReset}>{t('common.resetFilters')}</Button>
          <Button onClick={handleApply}>{t('common.apply')}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}