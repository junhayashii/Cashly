import Navbar from "@/components/landing-page/NavBar";
import Hero from "@/components/landing-page/Hero";
import FeaturesSection from "@/components/landing-page/Features";
import PricingSection from "@/components/landing-page/Pricing";
import FAQSection from "@/components/landing-page/FAQ";
import CallToAction from "@/components/landing-page/CallToAction";
import Footer from "@/components/landing-page/Footer";

const page = () => {
  return (
    <main>
      <Navbar />
      <Hero />
      <FeaturesSection />
      <PricingSection />
      <FAQSection />
      <CallToAction />
      <Footer />
    </main>
  );
};

export default page;
