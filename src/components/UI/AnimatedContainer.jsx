import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  enter: { opacity: 1, y: 0, scale: 1 },
  initial: { opacity: 0, y: 8, scale: 0.997 },
  exit: { opacity: 0, y: -8, scale: 0.997 },
};

export default function AnimatedContainer({ children, className = '', style, ...props }) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={variants}
  transition={{ type: 'spring', stiffness: 140, damping: 22, mass: 0.8 }}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
  );
}
