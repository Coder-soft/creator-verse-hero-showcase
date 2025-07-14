import { Navbar } from "@/components/ui/navbar";
import { HeroSection } from "@/components/ui/hero-section";
import { TrendingFreelancers } from "@/components/ui/TrendingFreelancers";
import { OurPartners } from "@/components/ui/OurPartners";
import '../spotlight.css';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <TrendingFreelancers />
        <OurPartners />
      </main>
    </div>
  );
};

export default Index;
