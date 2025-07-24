import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { User, Heart, MapPin, History, Wallet, List } from "lucide-react";
import { useTranslation } from "react-i18next";

const ProfileLayout = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();

  const sidebarNavItems = [
    {
      title: t('profileLayout.accountInfo'),
      href: "/profile",
      icon: <User className="mr-2 h-4 w-4" />,
    },
    {
      title: t('profileLayout.myWallet'),
      href: "/profile/wallet",
      icon: <Wallet className="mr-2 h-4 w-4" />,
    },
    {
      title: t('profileLayout.myPosts'),
      href: "/profile/my-posts",
      icon: <List className="mr-2 h-4 w-4" />,
    },
    {
      title: t('profileLayout.favorites'),
      href: "/profile/favorites",
      icon: <Heart className="mr-2 h-4 w-4" />,
    },
    {
      title: t('profileLayout.location'),
      href: "/profile/location",
      icon: <MapPin className="mr-2 h-4 w-4" />,
    },
    {
      title: t('profileLayout.loginHistory'),
      href: "/profile/history",
      icon: <History className="mr-2 h-4 w-4" />,
      disabled: true,
    },
  ];

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-10">
       <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            {sidebarNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === "/profile"}
                className={({ isActive }) =>
                  cn(
                    buttonVariants({ variant: "ghost" }),
                    isActive
                      ? "bg-muted hover:bg-muted"
                      : "hover:bg-transparent hover:underline",
                    "justify-start",
                    item.disabled && "cursor-not-allowed opacity-50"
                  )
                }
                onClick={(e) => item.disabled && e.preventDefault()}
              >
                {item.icon}
                {item.title}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

export default ProfileLayout;