import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const CallToAction = () => {
  return (
    <section className="cta-gradient py-16 m-[60px] rounded-[20px]">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Ready to Transform Your Eating Habits?
        </h2>
        <p className="text-xl max-w-2xl mx-auto mb-8">
          Join thousands of satisfied customers who have discovered the health
          benefits and delicious taste of our millet-based meals.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="bg-white text-primary hover:bg-neutral-light font-medium"
          >
            <Link href="/subscription">
              <a>Get Started Today</a>
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white/10 font-medium"
          >
            <Link href="/menu">
              <a>Learn More</a>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
