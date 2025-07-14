import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="w-full bg-background text-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh] py-28 sm:py-40">
          {/* Left Column: Text Content */}
          <div className="flex flex-col justify-center text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter leading-tight">
                Unlock Your
                <span className="block text-primary">Creative Potential</span>
              </h1>
              <p className="mt-6 max-w-xl mx-auto lg:mx-0 text-lg text-muted-foreground">
                Discover a world of opportunities. Connect with clients, showcase your portfolio, and collaborate on exciting projects. Your next big thing starts here.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link to="/marketplace">
                <Button size="lg" className="w-full sm:w-auto">
                  Explore Marketplace
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign Up
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Visuals */}
          <div className="relative hidden lg:flex items-center justify-center h-full">
            <div className="absolute w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-blob"></div>
            <div className="absolute w-72 h-72 bg-secondary/10 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute w-72 h-72 bg-muted/10 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="relative w-full max-w-md h-auto"
            >
              <div className="aspect-w-16 aspect-h-9 rounded-xl bg-muted/50 border border-border/50 p-4 shadow-lg backdrop-blur-sm">
                <div className="flex flex-col items-start justify-between h-full">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Featured Creator</p>
                    <p className="text-lg font-semibold">Alex Doe</p>
                  </div>
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Web Design</span>
                      <span className="text-sm font-bold text-primary">$75/hr</span>
                    </div>
                    <div className="w-full bg-border/50 rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full w-[75%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
      `}</style>
    </section>
  );
}
