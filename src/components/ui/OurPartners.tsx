import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './card';

const partners = [
  {
    name: 'Creator Coaster',
    logo: 'https://cdn.discordapp.com/icons/1075932452842909806/a_40d64cc9e3aabcd7b42a6027a399d2e6.gif?size=4096',
    description: 'A vibrant community platform for creators to connect, collaborate, and grow together.',
    url: 'https://discord.gg/creators-coaster-1075932452842909806'
  },
  {
    name: 'Xa Hosting',
    logo: 'https://cdn.discordapp.com/icons/1286371701139181618/b18a512cfd09171c4c5a6fa5403bacc2.png?size=1024',
    description: 'Premium hosting solutions with exceptional performance and reliability for all your web projects.',
    url: 'https://discord.gg/xahosting'
  },
];

export function OurPartners() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Animated gradient styles */}
      <style>
        {`
          @keyframes gradientMove {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
          .animated-gradient-text {
            background-size: 200% auto;
            background-clip: text;
            -webkit-background-clip: text;
            text-fill-color: transparent;
            -webkit-text-fill-color: transparent;
            color: transparent;
            background-image: linear-gradient(90deg, 
              #FFFFFF, /* White */
              #ffd700, /* Gold */
              #FFFFFF, /* White */
              #ffd700  /* Gold again for seamless loop */
            );
            animation: gradientMove 3s linear infinite;
          }
        `}
      </style>

      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-background/80 z-0" />
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-secondary/30 blur-3xl" />
      </div>
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-block"
          >
            <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary">
              Trusted Partnerships
            </span>
          </motion.div>
          
          <motion.h2 
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Our <span className="animated-gradient-text">Valued Partners</span>
          </motion.h2>
          
          <motion.p 
            className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Collaborating with industry leaders to deliver exceptional experiences and opportunities
          </motion.p>
        </div>
        
        {/* Partners Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <Card 
                className={`h-full overflow-hidden border-0 group relative ${
                  activeIndex === index ? 'ring-2 ring-primary/50' : ''
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-background/40 to-background/20 z-0" />
                
                <CardContent className="p-8 relative z-10">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Partner Logo */}
                    <motion.div 
                      className="flex-shrink-0 relative"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-secondary rounded-full opacity-75 blur-sm group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative flex items-center justify-center bg-card w-24 h-24 rounded-full">
                        <img 
                          src={partner.logo}
                          alt={`${partner.name} logo`}
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      </div>
                    </motion.div>
                    
                    {/* Partner Info */}
                    <div className="flex-grow text-center md:text-left">
                      <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                        {partner.name}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {partner.description}
                      </p>
                      <a 
                        href={partner.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors duration-300"
                      >
                        <span>Visit Partner</span>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          className="group-hover:translate-x-1 transition-transform duration-300"
                        >
                          <path d="M5 12h14"></path>
                          <path d="m12 5 7 7-7 7"></path>
                        </svg>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Bottom Highlight */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-muted-foreground">
            Interested in partnering with us? <a href="#contact" className="text-primary hover:underline">Get in touch</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}