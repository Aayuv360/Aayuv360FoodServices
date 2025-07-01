import HeroSection from "@/components/home/HeroSection";
import HowItWorks from "@/components/home/HowItWorks";
import TodaysMenu from "@/components/home/TodaysMenu";
import SubscriptionPlans from "@/components/home/SubscriptionPlans";
import Testimonials from "@/components/home/Testimonials";
import CallToAction from "@/components/home/CallToAction";
import Menu from "@/pages/menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

const Home = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: subscriptions = [] } = useQuery<any[]>({
    queryKey: ["/api/subscriptions"],
    queryFn: async () => {
      const res = await fetch("/api/subscriptions");
      if (!res.ok) {
        throw new Error("Failed to fetch subscriptions");
      }
      return res.json();
    },

    enabled: !!user,
  });
  const hasActiveSubscription = user && subscriptions.length > 0;
  return (
    <>
      <HeroSection
        subScrButName={
          hasActiveSubscription
            ? "Manage Subscription Plan"
            : "Subscription Meal Plans"
        }
      />

      {!isMobile && !hasActiveSubscription && <HowItWorks />}

      {!hasActiveSubscription && (
        <SubscriptionPlans previousPlansData={subscriptions} />
      )}
      {/* <TodaysMenu />
       */}
      <Menu />
      {/* <div className="my-16">
        <Testimonials />
      </div> */}
      {/* <CallToAction /> */}
    </>
  );
};

export default Home;
