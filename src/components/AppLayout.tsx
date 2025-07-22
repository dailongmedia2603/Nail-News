import { Outlet } from "react-router-dom";
import Header from "./Header";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AppLayout = () => {
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

      // Define the type for the settings object to fix the TypeScript errors
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

    fetchAndApplyBranding();
  }, []);

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