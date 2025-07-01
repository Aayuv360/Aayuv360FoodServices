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
      const headerOffset = 100;
      const elementPosition = menuSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative overflow-hidden py-5 md:py-8">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/90 to-amber-500/90"></div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-white/10 rounded-full animate-rotate-slow"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-white/10 rounded-full animate-rotate-slow delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {isMobile ? (
          <div
            className={`text-center transition-all duration-1000 transform ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <div className="inline-flex items-center bg-grey/10 backdrop-blur-sm px-3 py-1 rounded-full text-white/90 mb-4">
              <Sparkles size={20} className="mr-1 animate-pulse" />
              <span>Experience the future of healthy eating</span>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4 leading-snug">
              Nourish Your Body with{" "}
              <span className="relative underline decoration-white/30">
                Millet
              </span>
            </h1>

            <p className="text-white/90 text-base mb-6 max-w-md mx-auto">
              Discover the magic of traditional Hyderabad cuisine with our
              modern millet-based subscription meal service.
            </p>

            <div className="flex flex-col gap-4 items-center">
              {subScrButName !== "Manage Subscription Plan" && (
                <button
                  className="bg-white text-orange-600 font-medium px-6 py-3 rounded-full hover:bg-orange-100 transition-all duration-300"
                  onClick={() => {
                    scrollToMenuSection();
                  }}
                >
                  View Today's Menu
                </button>
              )}

              <button
                className="bg-white text-orange-600 font-medium px-6 py-3 rounded-full hover:bg-orange-100 transition-all duration-300"
                onClick={() => {
                  navigate("/subscription");
                }}
              >
                {subScrButName}
                <ArrowRight size={18} className="ml-2" />
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`max-w-2xl mx-auto md:mx-0 transition-all duration-1000 transform ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/90 mb-6">
              <Sparkles size={16} className="mr-2 animate-pulse" />
              <span>Experience the future of healthy eating</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Nourish Your Body with{" "}
              <span className="relative">
                Millet
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-white/30 rounded-full"></div>
              </span>{" "}
              Goodness
            </h1>

            <p className="text-white/90 text-lg md:text-xl mb-8 max-w-lg">
              Discover the magic of traditional Hyderabad cuisine with our
              modern millet-based subscription meal service.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {subScrButName !== "Manage Subscription Plan" && (
                <button
                  className="group bg-white text-orange-600 font-medium px-8 py-4 rounded-full hover:bg-orange-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center"
                  onClick={() => {
                    scrollToMenuSection();
                  }}
                >
                  <span className="transform transition-transform duration-300 group-hover:translate-z-10">
                    View Today's Menu
                  </span>
                </button>
              )}

              <button
                className="group bg-white text-orange-600 font-medium px-8 py-4 rounded-full hover:bg-orange-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center"
                onClick={() => {
                  navigate("/subscription");
                }}
              >
                <span className="transform transition-transform duration-300 group-hover:translate-z-10">
                  {subScrButName}
                </span>
                <ArrowRight
                  size={18}
                  className="ml-2 transition-transform duration-300 group-hover:translate-x-1"
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
