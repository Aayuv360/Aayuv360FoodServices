import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { useState } from "react";
import MobileMenuPage from "./MobileMenuPage";
import LocationSelector from "./LocationSelector";

const MobileHeader = () => {
  const [mobilePage, setMobilePage] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center"
          onClick={() => setMobilePage(false)}
        >
          <div className="h-8 w-8 mr-2 bg-primary rounded-full flex items-center justify-center text-white text-base font-bold">
            A
          </div>
          <h1 className="text-lg font-bold text-primary">Aayuv</h1>
        </Link>

        <button
          className="hover:text-primary p-2"
          onClick={() => {
            setMobilePage(!mobilePage);
          }}
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Location selector for mobile */}
      {/* <div className="mt-2">
        <LocationSelector />
      </div> */}

      {mobilePage && <MobileMenuPage setMobilePage={setMobilePage} />}
    </>
  );
};

export default MobileHeader;
