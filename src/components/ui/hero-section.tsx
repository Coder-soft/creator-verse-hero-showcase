import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function HeroSection() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className="text-center my-16"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4"
        variants={itemVariants}
      >
        <Sparkles className="inline-block h-4 w-4 mr-2" />
        Find Your Perfect Freelancer
      </motion.div>
      <motion.h1
        className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
        variants={itemVariants}
      >
        Creators Market
      </motion.h1>
      <motion.p
        className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground"
        variants={itemVariants}
      >
        Discover talented freelancers, browse their portfolios, and hire the perfect fit for your next project.
      </motion.p>
      <motion.div className="mt-8 flex justify-center gap-4" variants={itemVariants}>
        <Button size="lg" onClick={() => navigate("/marketplace")}>
          Explore Marketplace
        </Button>
        <Button size="lg" variant="outline" onClick={() => navigate("/freelancer-application")}>
          Become a Freelancer
        </Button>
      </motion.div>
    </motion.div>
  );
}