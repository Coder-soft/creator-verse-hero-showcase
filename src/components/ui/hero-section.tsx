import { motion } from "framer-motion";
import { Button } from "./button";
import { useNavigate } from "react-router-dom";

export const HeroSection = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <section className="relative w-full h-[80vh] flex items-center justify-center overflow-hidden bg-gray-900 text-white">
      <div className="absolute inset-0 w-full h-full bg-transparent z-10" style={{ backgroundImage: 'linear-gradient(to right, rgba(30, 30, 30, 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(30, 30, 30, 0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <motion.div
        className="absolute inset-0 w-full h-full bg-transparent z-10"
        initial={{ backgroundPosition: "0 0" }}
        animate={{ backgroundPosition: ["0 0", "40px 40px"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ backgroundImage: 'linear-gradient(to right, rgba(50, 50, 50, 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(50, 50, 50, 0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      ></motion.div>
      <div className="relative z-20 text-center p-4">
        <motion.h1
          className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Unlock Your Potential
        </motion.h1>
        <motion.p
          className="text-lg md:text-2xl mb-8 max-w-2xl mx-auto text-gray-300"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          Discover a world of opportunities and connect with top-tier talent. Your next big project starts here.
        </motion.p>
        <motion.div
          className="flex justify-center gap-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
        >
          <Button
            onClick={() => handleNavigation("/marketplace")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
          >
            Find Talent
          </Button>
          <Button
            onClick={() => handleNavigation("/marketplace")}
            variant="outline"
            className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
          >
            Find Work
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
