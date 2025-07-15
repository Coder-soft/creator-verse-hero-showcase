import { Link } from "react-router-dom";
import ShinyText from "./ShinyText";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { motion } from "framer-motion";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Left Side: Privacy, Terms, Copyright */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-4">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {currentYear} All rights reserved.
            </p>
          </div>

          {/* Right Side: Powered By Renderdragon */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://renderdragon.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 mt-6 md:mt-0"
                >
                  <span className="text-sm text-muted-foreground">Powered By</span>
                  <div className="flex items-center">
                    <img
                      src="https://renderdragon.org/renderdragon.png"
                      alt="Renderdragon"
                      className="h-6 w-6 mr-1"
                    />
                    <ShinyText
                      text="Renderdragon"
                      className="text-lg font-bold"
                    />
                  </div>
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  Get free content creating assets now!
                </motion.p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </footer>
  );
}