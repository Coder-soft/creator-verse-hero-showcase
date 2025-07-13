import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export function HeroSection() {
  const { user } = useAuth();
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
              Showcase Your Creator Universe
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
              The ultimate platform to build and display your personal brand.
              Engage with your audience like never before.
            </p>
          </div>
          <div className="space-x-4 mt-6">
            <Button asChild size="lg">
              <Link to={user ? "/profile" : "/auth"}>Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}