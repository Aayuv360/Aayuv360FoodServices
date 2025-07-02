import { Link, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const HeroSection = ({ subScrButName }: any) => {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToMenuSection = () => {
    const menuSection = document.getElementById("menu-section");
    if (menuSection) {
      const headerOffset = 70;
      const elementPosition = menuSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const highlightTag = (
    <div
      className={`inline-flex items-center ${
        isMobile
          ? "px-3 py-1 mb-4 text-white/90"
          : "px-4 py-2 mb-6 text-white/90"
      } bg-white/10 backdrop-blur-sm rounded-full`}
    >
      <Sparkles size={isMobile ? 20 : 16} className="mr-2 animate-pulse" />
      <span>Experience the future of healthy eating</span>
    </div>
  );

  const headline = (
    <h1
      className={`font-bold text-white mb-4 ${
        isMobile
          ? "text-4xl leading-snug"
          : "text-5xl md:text-6xl leading-tight mb-6"
      }`}
    >
      Nourish Your Body with{" "}
      <span className="relative">
        Millet
        {!isMobile && (
          <div className="absolute -bottom-2 left-0 w-full h-1 bg-white/30 rounded-full"></div>
        )}
      </span>
      {!isMobile && " Goodness"}
    </h1>
  );

  const description = (
    <p
      className={`text-white/90 ${
        isMobile
          ? "text-base mb-6 max-w-md mx-auto"
          : "text-lg md:text-xl mb-8 max-w-lg"
      }`}
    >
      Discover the magic of traditional Hyderabad cuisine with our modern
      millet-based subscription meal service.
    </p>
  );

  const menuButton =
    subScrButName !== "Manage Subscription Plan" ? (
      <button
        className={`${
          isMobile
            ? "bg-white text-orange-600 px-6 py-3"
            : "group bg-white text-orange-600 px-8 py-4 transform hover:-translate-y-1 hover:shadow-xl"
        } font-medium rounded-full hover:bg-orange-50 transition-all duration-300 flex items-center justify-center`}
        onClick={scrollToMenuSection}
      >
        <span
          className={`${
            !isMobile
              ? "transform transition-transform duration-300 group-hover:translate-z-10"
              : ""
          }`}
        >
          View Today's Menu
        </span>
      </button>
    ) : null;

  const subscriptionButton = (
    <button
      className={`${
        isMobile
          ? "bg-white text-orange-600 px-6 py-3"
          : "group bg-white text-orange-600 px-8 py-4 transform hover:-translate-y-1 hover:shadow-xl"
      } font-medium rounded-full hover:bg-orange-50 transition-all duration-300 flex items-center justify-center`}
      onClick={() => navigate("/subscription")}
    >
      <span
        className={`${
          !isMobile
            ? "transform transition-transform duration-300 group-hover:translate-z-10"
            : ""
        }`}
      >
        {subScrButName}
      </span>
      <ArrowRight
        size={18}
        className={`ml-2 ${!isMobile ? "transition-transform duration-300 group-hover:translate-x-1" : ""}`}
      />
    </button>
  );

  return (
    <section className="relative overflow-hidden py-5 md:py-8">
      {/* Background Gradient and Animations */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/90 to-amber-500/90"></div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-white/10 rounded-full animate-rotate-slow"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-white/10 rounded-full animate-rotate-slow delay-1000"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div
          className={`transition-all duration-1000 transform ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          } ${isMobile ? "text-center" : "max-w-2xl mx-auto md:mx-0"}`}
        >
          {highlightTag}
          {headline}
          {description}
          <div
            className={`flex ${
              isMobile
                ? "flex-col items-center gap-4"
                : "flex-col sm:flex-row gap-4"
            }`}
          >
            {menuButton}
            {subscriptionButton}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
