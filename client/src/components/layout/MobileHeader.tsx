import { Link } from "react-router-dom";
import { Menu, CircleUser, UserRound } from "lucide-react";
import { useState } from "react";
import MobileMenuPage from "./MobileMenuPage";
import LocationSelector from "./LocationSelector";

const MobileHeader = () => {
  const [mobilePage, setMobilePage] = useState(false);

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
            {/* <h1 className="text-lg font-bold text-primary">Aayuv</h1> */}{" "}
          </Link>{" "}
          <LocationSelector />
        </div>

        <button
          className="hover:text-primary p-2"
          onClick={() => {
            setMobilePage(!mobilePage);
          }}
          aria-label="Menu"
        >
          <CircleUser className="w-7 h-7 text-primary" />
        </button>
      </div>

      {mobilePage && <MobileMenuPage setMobilePage={setMobilePage} />}
    </>
  );
};

export default MobileHeader;
