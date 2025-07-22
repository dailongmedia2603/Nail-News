import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center space-x-1">
      <Button
        variant={i18n.language === 'vi' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => changeLanguage('vi')}
      >
        VI
      </Button>
      <Button
        variant={i18n.language === 'en' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => changeLanguage('en')}
      >
        EN
      </Button>
    </div>
  );
}