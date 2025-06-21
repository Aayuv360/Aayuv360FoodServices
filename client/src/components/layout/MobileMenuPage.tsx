import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LogOut,
  Utensils,
  CalendarCheck,
  ChefHat,
  ClipboardList,
  LogIn,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { AuthModal } from "@/components/auth/AuthModal";
import { useState } from "react";
import CartSidebar from "@/components/cart/CartSidebar";

interface MenuItemType {
  href?: string;
  icon: React.ReactNode;
  text: string;
}

const getMenuItems = (user: boolean): MenuItemType[] => {
  return [
    ...(user
      ? [{ href: "/profile", icon: <User />, text: "Your Profile" }]
      : []),
    { href: "/menu", icon: <Utensils />, text: "Today's Menu" },
    {
      href: "/subscription",
      icon: <CalendarCheck />,
      text: "Subscription Plans",
    },
    ...(user
      ? [
          {
            href: "/profile?tab=subscriptions",
            icon: <ChefHat />,
            text: "My Subscriptions",
          },
          {
            href: "/profile?tab=orders",
            icon: <ClipboardList />,
            text: "Order History",
          },
        ]
      : []),
  ];
};

const MobileMenuPage = ({
  setMobilePage,
}: {
  setMobilePage?: (val: boolean) => void;
}) => {
  const { user, logout } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"normal" | "subscribe">(
    "normal",
  );
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">(
    "login",
  );
  const [authRedirectUrl, setAuthRedirectUrl] = useState("");

  const openAuthModal = (
    mode: "normal" | "subscribe" = "normal",
    redirectUrl = "",
    tab: "login" | "register" = "login",
  ) => {
    setAuthModalMode(mode);
    setAuthRedirectUrl(redirectUrl);
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 px-4 py-6">
        <div className="space-y-4">
          {getMenuItems(!!user).map((item, index) => (
            <motion.div
              key={item.href || item.text}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <MenuItem
                href={item.href}
                icon={item.icon}
                text={item.text}
                setMobilePage={setMobilePage}
              />
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {user ? (
              <MenuItem
                href="/"
                icon={<LogOut />}
                text="Sign Out"
                click={logout}
              />
            ) : (
              <MenuItem
                icon={<LogIn />}
                text="Login"
                click={() => openAuthModal("normal")}
              />
            )}
          </motion.div>
        </div>
      </div>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />

      <AuthModal
        isOpen={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultTab={authModalTab}
        redirectUrl={authRedirectUrl}
        mode={authModalMode}
      />
    </>
  );
};

interface MenuItemProps {
  href?: string;
  icon: React.ReactNode;
  text: string;
  click?: () => void;
  setMobilePage?: (val: boolean) => void;
}

const MenuItem = ({
  href,
  icon,
  text,
  click,
  setMobilePage,
}: MenuItemProps) => {
  const handleClick = () => {
    setMobilePage?.(false);
    click?.();
  };

  const content = (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all hover:bg-gray-100 active:scale-[0.98]">
      <div className="text-primary text-xl">{icon}</div>
      <span className="text-base font-semibold text-gray-800">{text}</span>
    </div>
  );

  return href ? (
    <Link href={href} onClick={handleClick}>
      {content}
    </Link>
  ) : (
    <button onClick={handleClick} className="w-full text-left">
      {content}
    </button>
  );
};

export default MobileMenuPage;
