import React from 'react';

const ShinyText = ({ text, className = '' }: { text: string, className?: string }) => {
  return (
    <span className={`shiny-text ${className}`}>
      {text}
    </span>
  );
};

export default ShinyText;
