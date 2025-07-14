import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, ChefHat, ClipboardList, User } from "lucide-react";
import { motion } from "framer-motion";
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
    // { href: "/menu", icon: <Utensils />, text: "Today's Menu" },
    // {
    //   href: "/subscription",
    //   icon: <CalendarCheck />,
    //   text: "Subscription Plans",
    // },
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
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);

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
                icon={item.icon}
                text={item.text}
                setMobilePage={setMobilePage}
                click={() => {
                  navigate(item.href || "/");
                }}
              />
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <MenuItem
              icon={<LogOut />}
              text="Logout"
              click={() => {
                logout();
                setMobilePage?.(false);
              }}
            />
          </motion.div>
        </div>
      </div>

      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
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
    <Link to={href} onClick={handleClick}>
      {content}
    </Link>
  ) : (
    <button onClick={handleClick} className="w-full text-left">
      {content}
    </button>
  );
};

export default MobileMenuPage;
