import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-6 w-6" />
            <span className="text-lg font-bold">Creators Market</span>
          </div>
          <p className="text-sm text-muted-foreground mt-4 md:mt-0">
            © {new Date().getFullYear()} All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}