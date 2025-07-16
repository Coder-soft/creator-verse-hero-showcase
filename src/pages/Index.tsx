import { Navbar } from "@/components/ui/navbar";
import { HeroSection } from "@/components/ui/hero-section";
import { TrendingFreelancers } from "@/components/ui/TrendingFreelancers";
import { OurPartners } from "@/components/ui/OurPartners";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import '../spotlight.css';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <AnimatedSection>
          <HeroSection />
        </AnimatedSection>
        <AnimatedSection delay={0.2}>
          <TrendingFreelancers />
        </AnimatedSection>
        <AnimatedSection delay={0.4}>
          <OurPartners />
        </AnimatedSection>
      </main>
    </div>
  );
};

export default Index;