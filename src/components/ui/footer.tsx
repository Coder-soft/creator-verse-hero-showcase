import React from "react";
import "../../shiny-text.css";

const Footer: React.FC = () => {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} crimson-okapi-hug. All Rights Reserved.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Powered by</span>
          <a
            href="https://renderdragon.org"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary inline-flex items-center"
          >
            <img
              src="https://renderdragon.org/renderdragon.png"
              alt="Renderdragon Favicon"
              className="h-4 w-4 mr-1.5"
            />
            <span className="shiny-text">Renderdragon</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

