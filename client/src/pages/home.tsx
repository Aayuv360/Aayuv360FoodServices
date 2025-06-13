import HeroSection from "@/components/home/HeroSection";
import HowItWorks from "@/components/home/HowItWorks";
import TodaysMenu from "@/components/home/TodaysMenu";
import SubscriptionPlans from "@/components/home/SubscriptionPlans";
import Testimonials from "@/components/home/Testimonials";
import CallToAction from "@/components/home/CallToAction";
import Menu from "@/pages/menu";

const Home = () => {
  return (
    <>
      <HeroSection />

      <HowItWorks />

      <SubscriptionPlans />
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
