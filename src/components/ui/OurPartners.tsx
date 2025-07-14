import React from 'react';
import { motion } from 'framer-motion';

const partners = [
  {
    name: 'Creators Coaster',
    logo: 'https://cdn.discordapp.com/icons/1075932452842909806/a_40d64cc9e3aabcd7b42a6027a399d2e6.gif',
    url: 'https://discord.gg/creators-coaster-1075932452842909806'
  },
  {
    name: 'XA Hosting',
    logo: 'https://cdn.discordapp.com/icons/1286371701139181618/b18a512cfd09171c4c5a6fa5403bacc2.png',
    url: 'https://discord.gg/xahosting'
  },
];

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
      duration: 0.5,
    },
  },
};

export function OurPartners() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tighter">Our Partners</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            We collaborate with industry leaders to bring you the best opportunities and services.
          </p>
        </div>
        <motion.div
          className="flex justify-center items-center gap-12 flex-wrap"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {partners.map((partner) => (
            <motion.a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="grayscale hover:grayscale-0 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ scale: 1.1 }}
            >
              <img 
                src={partner.logo} 
                alt={`${partner.name} Logo`}
                className="h-24 w-24 object-contain rounded-full" 
              />
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
