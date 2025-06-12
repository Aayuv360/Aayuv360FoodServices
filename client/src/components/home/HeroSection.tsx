import { Link } from "wouter";

import React, { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative overflow-hidden py-10 md:py-16">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/90 to-amber-500/90"></div>

      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-white/10 rounded-full animate-rotate-slow"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-white/10 rounded-full animate-rotate-slow delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto md:mx-0">
          <div
            className={`transition-all duration-1000 transform perspective-1000 ${
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
              <button className="group bg-white text-orange-600 font-medium px-8 py-4 rounded-full hover:bg-orange-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center perspective-1000">
                <span className="transform transition-transform duration-300 group-hover:translate-z-10">
                  <Link href="/menu">View Today's Menu</Link>
                </span>
              </button>

              <button className="group bg-transparent text-white border-2 border-white/50 font-medium px-8 py-4 rounded-full hover:bg-white/10 transition-all duration-300 flex items-center justify-center perspective-1000">
                <span className="transform transition-transform duration-300 group-hover:translate-z-10">
                  <Link href="/subscription">Browse Meal Plans</Link>
                </span>
                <ArrowRight
                  size={18}
                  className="ml-2 transition-transform duration-300 group-hover:translate-x-1"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
