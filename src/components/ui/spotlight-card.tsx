
import React, { useRef, useState, useEffect } from 'react';
import '@/spotlight.css';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({ children, className = '' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: -100, y: -100 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setPosition({ x, y });
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: -100, y: -100 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-lg border bg-card p-6 shadow-lg transition-shadow duration-300 hover:shadow-xl ${className}`}
      style={{
        background: `radial-gradient(circle at ${position.x}px ${position.y}px, rgba(255, 255, 255, 0.1), transparent 40%)`,
      }}
    >
      {children}
    </div>
  );
};

export default SpotlightCard;
