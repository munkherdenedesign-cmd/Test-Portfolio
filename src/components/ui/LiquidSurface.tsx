import React, { useId, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export function LiquidSurface({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const filterId = 'liquid' + useId().replace(/:/g, '');
  const [hover, setHover] = useState(false);
  const reduceMotion = useReducedMotion();
  return (
    <motion.span className={'relative inline-flex items-center justify-center ' + className}
      onHoverStart={() => setHover(true)} onHoverEnd={() => setHover(false)}
      animate={reduceMotion ? undefined : { scale: hover ? 1.04 : 1, rotate: hover ? -0.8 : 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}>
      <svg width="0" height="0" aria-hidden="true" className="absolute pointer-events-none">
        <filter id={filterId} x="-20%" y="-30%" width="140%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="2" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={reduceMotion ? 0 : hover ? 3 : 0} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <span className="inline-flex items-center justify-center" style={{ filter: 'url(#' + filterId + ')' }}>{children}</span>
    </motion.span>
  );
}
