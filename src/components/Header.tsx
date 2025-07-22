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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, PlusCircle, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

type Settings = {
  website_name: string;
  logo_url: string;
};

export default function Header() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userInitial, setUserInitial] = useState("");
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({ website_name: 'NailNews', logo_url: '' });

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);

      // Fetch settings
      const { data: settingsData } = await supabase.from('system_settings').select('key, value');
      if (settingsData) {
        const newSettings = settingsData.reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {});
        setSettings(newSettings as Settings);
      }

      // Fetch session
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
      // Re-fetch user-specific data on auth change
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
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link to="/tutorials" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Học Nail
            </Link>
            <Link to="/blog" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Blog
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {loading ? null : session ? (
            <>
              <Button onClick={() => navigate('/create-post')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Đăng tin
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
                      Đã đăng nhập
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin/dashboard")}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Trang Admin</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Hồ sơ</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => navigate('/login')}>Đăng nhập</Button>
              <Button onClick={() => navigate('/signup')}>Đăng ký</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}