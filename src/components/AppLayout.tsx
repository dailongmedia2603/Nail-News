import { Outlet } from "react-router-dom";
import Header from "./Header";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { transformTranslations } from "@/utils/translation-transformer";

const AppLayout = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const fetchAndApplyBranding = async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value')
        .in('key', ['browser_title', 'favicon_url']);

      if (error) {
        console.error("Error fetching branding settings:", error);
        return;
      }

      type BrandingSettings = { [key: string]: string };
      const settings: BrandingSettings = data.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {});

      if (settings.browser_title) {
        document.title = settings.browser_title;
      }

      if (settings.favicon_url) {
        let faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (faviconLink) {
          faviconLink.href = settings.favicon_url;
        } else {
          faviconLink = document.createElement('link');
          faviconLink.rel = 'icon';
          faviconLink.href = settings.favicon_url;
          document.head.appendChild(faviconLink);
        }
      }
    };

    const fetchAndApplyTranslations = async () => {
      const { data, error } = await supabase.from('translations').select('key, vi, en');

      if (error) {
        console.error("Error fetching dynamic translations:", error);
        return;
      }

      if (data) {
        const resources = transformTranslations(data);
        i18n.addResourceBundle('en', 'translation', resources.en.translation, true, true);
        i18n.addResourceBundle('vi', 'translation', resources.vi.translation, true, true);
      }
    };

    fetchAndApplyBranding();
    fetchAndApplyTranslations();
  }, [i18n]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;