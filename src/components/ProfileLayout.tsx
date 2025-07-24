import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { User, Heart, MapPin, History, Wallet, List } from "lucide-react";
import { useTranslation } from "react-i18next";

const sidebarNavItems = [
  { titleKey: "profileLayout.accountInfo", href: "/profile", icon: <User className="mr-2 h-4 w-4" /> },
  { titleKey: "profileLayout.myWallet", href: "/profile/wallet", icon: <Wallet className="mr-2 h-4 w-4" /> },
  { titleKey: "profileLayout.myPosts", href: "/profile/my-posts", icon: <List className="mr-2 h-4 w-4" /> },
  { titleKey: "profileLayout.favorites", href: "/profile/favorites", icon: <Heart className="mr-2 h-4 w-4" /> },
  { titleKey: "profileLayout.location", href: "/profile/location", icon: <MapPin className="mr-2 h-4 w-4" /> },
  { titleKey: "profileLayout.loginHistory", href: "/profile/history", icon: <History className="mr-2 h-4 w-4" />, disabled: false },
];

interface ProfileLayoutProps {
  children: React.ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  const { t } = useTranslation();
  return (
    <div className="container mx-auto flex flex-1 flex-col space-y-8 p-4 md:p-10">
       <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <nav className="flex space-x-2 overflow-x-auto pb-4 lg:flex-col lg:space-x-0 lg:space-y-1 lg:overflow-visible lg:pb-0">
            {sidebarNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === "/profile"}
                className={({ isActive }) =>
                  cn(
                    buttonVariants({ variant: "ghost" }),
                    "whitespace-nowrap justify-start",
                    isActive ? "bg-muted hover:bg-muted" : "hover:bg-transparent hover:underline",
                    item.disabled && "cursor-not-allowed opacity-50"
                  )
                }
                onClick={(e) => item.disabled && e.preventDefault()}
              >
                {item.icon}
                {t(item.titleKey)}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}