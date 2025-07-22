import { Link } from "react-router-dom";
import { CircleUser } from "lucide-react";
import { useState } from "react";
import MobileMenuPage from "./MobileMenuPage";
import LocationSelector from "./LocationSelector";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "../auth/AuthModal";

const MobileHeader = () => {
  const [mobilePage, setMobilePage] = useState(false);
  const { user } = useAuth();
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
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            to="/"
            className="flex items-center"
            onClick={() => setMobilePage(false)}
          >
            <div className="h-8 w-8 mr-2 bg-primary rounded-full flex items-center justify-center text-white text-base font-bold">
              A
            </div>
          </Link>{" "}
          <LocationSelector />
        </div>
        <button
          className="hover:text-primary p-2"
          onClick={() => {
            if (user) {
              setMobilePage(!mobilePage);
            } else {
              openAuthModal("normal");
            }
          }}
          aria-label="Menu"
        >
          <CircleUser className="w-7 h-7 text-primary" />
        </button>
      </div>

      {mobilePage && <MobileMenuPage setMobilePage={setMobilePage} />}
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

export default MobileHeader;
