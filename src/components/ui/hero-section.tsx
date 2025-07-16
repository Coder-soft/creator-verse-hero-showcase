import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ShinyText from "@/components/ui/ShinyText";
import { motion } from "framer-motion";
import { ArrowRight, UserPlus } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export function HeroSection() {
  return (
    <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary/10 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={itemVariants}>
            <ShinyText className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Unleash Your Creative Power
            </ShinyText>
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="mt-6 text-lg md:text-xl text-muted-foreground"
          >
            Creators Market is the ultimate platform to hire expert freelancers
            and showcase your own creative services. Find the perfect talent or
            start earning today.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/marketplace">
              <Button size="lg" className="w-full sm:w-auto">
                Explore Marketplace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                Become a Freelancer
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}