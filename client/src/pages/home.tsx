import HeroSection from "@/components/home/HeroSection";
import HowItWorks from "@/components/home/HowItWorks";
import TodaysMenu from "@/components/home/TodaysMenu";
import SubscriptionPlans from "@/components/home/SubscriptionPlans";
import Testimonials from "@/components/home/Testimonials";
import CallToAction from "@/components/home/CallToAction";

const Home = () => {
  return (
    <>
      <div className="my-16">
        <HeroSection />
      </div>
      <div className="mb-16">
        <HowItWorks />
      </div>
      <div className="mb-16">
        <SubscriptionPlans />
      </div>
      <div className="mb-16">
        <TodaysMenu />
      </div>
      {/* <div className="my-16">
        <Testimonials />
      </div> */}
      {/* <CallToAction /> */}
    </>
  );
};

export default Home;
