import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="hero-gradient py-16 mx-[60px] rounded-[20px]">
      <div className="container mx-auto px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Nourish Your Body with Millet Goodness
            </h1>
            <p className="text-lg md:text-xl mb-6">
              Discover the magic of traditional Hyderabad cuisine with our
              modern millet-based subscription meal service.
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-primary font-medium hover:bg-neutral-light"
              >
                <Link href="/menu">View Today's Menu</Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="bg-accent hover:bg-accent/90 text-white font-medium"
              >
                <Link href="/subscription">Browse Meal Plans</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
