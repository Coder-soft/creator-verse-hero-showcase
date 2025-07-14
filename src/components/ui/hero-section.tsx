import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative w-full pt-32 pb-20 lg:pt-48 lg:pb-32 bg-gradient-to-b from-background to-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl">
          Welcome to Creators Market
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
          The ultimate platform for freelancers and clients to connect, collaborate, and create amazing things.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link to="/marketplace">
            <Button size="lg">Browse Marketplace</Button>
          </Link>
          <Link to="/auth">
            <Button size="lg" variant="outline">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}