import { Navbar } from "@/components/ui/navbar";
import { HeroSection } from "@/components/ui/hero-section";
import SpotlightCard from "@/components/ui/spotlight-card";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import '../spotlight.css';

const Index = () => {
  const features = [
    "Access to a wide range of creative talent.",
    "Secure and easy-to-use payment system.",
    "Direct communication with freelancers.",
    "Milestone-based projects to ensure quality.",
    "24/7 customer support.",
    "Verified and reviewed freelancers."
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <section id="features" className="py-20 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold">Why Choose Us?</h2>
              <p className="text-muted-foreground mt-4">
                Everything you need to get your creative projects done.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <SpotlightCard key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="h-6 w-6 mr-4 text-primary" />
                      <span>{feature}</span>
                    </CardTitle>
                  </CardHeader>
                </SpotlightCard>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
