import HeroSection from "@/components/home/HeroSection";
import HowItWorks from "@/components/home/HowItWorks";
import TodaysMenu from "@/components/home/TodaysMenu";
import SubscriptionPlans from "@/components/home/SubscriptionPlans";
import Testimonials from "@/components/home/Testimonials";
import CallToAction from "@/components/home/CallToAction";

const Home = () => {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <TodaysMenu />
      <SubscriptionPlans />
      <Testimonials />
      <CallToAction />
    </>
  );
};

export default Home;
