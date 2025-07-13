import { Button } from "@/components/ui/button";
import { TypingText } from "@/components/ui/typing-text";
import { ArrowRight, Sparkles, Zap, Users } from "lucide-react";

export function HeroSection() {
  const typingTexts = [
    "thumbnails",
    "Developers", 
    "editors",
    "Animators",
    "logos & Renders"
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* Main Heading */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="block text-foreground mb-4">
                Your one stop place
              </span>
              <span className="block text-foreground mb-4">
                to get{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  <TypingText texts={typingTexts} />
                </span>
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in delay-200">
            Connect with talented creators and bring your vision to life. From stunning thumbnails to professional animations, 
            we've got everything you need to make your content stand out.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-fade-in delay-400">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-gradient-primary shadow-glow-primary animate-glow-pulse group"
            >
              Start Creating
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6 border-primary/50 hover:bg-primary/10"
            >
              View Portfolio
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in delay-600">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-primary mr-2" />
                <span className="text-3xl font-bold text-foreground">1000+</span>
              </div>
              <p className="text-muted-foreground">Happy Creators</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-6 w-6 text-primary mr-2" />
                <span className="text-3xl font-bold text-foreground">5000+</span>
              </div>
              <p className="text-muted-foreground">Projects Delivered</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Sparkles className="h-6 w-6 text-primary mr-2" />
                <span className="text-3xl font-bold text-foreground">24/7</span>
              </div>
              <p className="text-muted-foreground">Support Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
}