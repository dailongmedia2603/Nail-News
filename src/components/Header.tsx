import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, PlusCircle, Shield, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useIsMobile } from "@/hooks/use-mobile";

type Settings = {
  website_name: string;
  logo_url: string;
};

const NavLinks = () => {
  const { t } = useTranslation();
  return (
    <>
      <Link to="/tutorials" className="transition-colors hover:text-foreground/80 text-foreground">
        {t('header.tutorials')}
      </Link>
      <Link to="/blog" className="transition-colors hover:text-foreground/80 text-foreground">
        {t('header.blog')}
      </Link>
    </>
  );
};

export default function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userInitial, setUserInitial] = useState("");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({ website_name: 'NailNews', logo_url: '' });

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);

      const { data: settingsData } = await supabase.from('system_settings').select('key, value');
      if (settingsData) {
        const newSettings = settingsData.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {});
        setSettings(newSettings as Settings);
      }

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        setUserInitial(session.user.email?.charAt(0).toUpperCase() || "");
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        setIsAdmin(profile?.role === 'admin');
      } else {
        setIsAdmin(false);
        setUserInitial("");
      }
      setLoading(false);
    };

    fetchInitialData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUserInitial(session.user.email?.charAt(0).toUpperCase() || "");
        supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({ data: profile }) => {
          setIsAdmin(profile?.role === 'admin');
        });
      } else {
        setIsAdmin(false);
        setUserInitial("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            {settings.logo_url ? <img src={settings.logo_url} alt="Logo" className="h-8" /> : <span className="font-bold">{settings.website_name}</span>}
          </Link>
          {!isMobile && (
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <NavLinks />
            </nav>
          )}
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <LanguageSwitcher />
          {loading ? null : session ? (
            <>
              <Button onClick={() => navigate('/create-post')} size={isMobile ? "icon" : "default"}>
                <PlusCircle className={isMobile ? "h-4 w-4" : "mr-2 h-4 w-4"} />
                {!isMobile && t('header.post_ad')}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder-user.jpg" alt="User avatar" />
                      <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-xs leading-none text-muted-foreground">
                      {t('header.logged_in_as')}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>{t('header.admin_dashboard')}</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('header.profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('header.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            !isMobile && (
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => navigate('/login')}>{t('header.login')}</Button>
                <Button onClick={() => navigate('/signup')}>{t('header.signup')}</Button>
              </div>
            )
          )}
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <nav className="flex flex-col items-start space-y-4 pt-8 text-lg">
                  <NavLinks />
                  {!session && (
                    <>
                      <Button variant="outline" onClick={() => navigate('/login')} className="w-full">{t('header.login')}</Button>
                      <Button onClick={() => navigate('/signup')} className="w-full">{t('header.signup')}</Button>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}