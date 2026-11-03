import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Experience } from '../lib/aboutExperience';
import { MapPin, ArrowUpRight } from 'lucide-react';

export function AboutLanyards({ items }: { items: Experience[] }) {
  const [flipped, setFlipped] = useState<string | null>(null);
  const reduced = useReducedMotion();
  return (
    <section className="w-full max-w-6xl mx-auto px-5 mt-12 md:mt-20">
      <div className="flex justify-between items-end gap-4 mb-10">
        <div><p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-3">Selected experience</p><h2 className="text-2xl md:text-4xl tracking-tight">Where I've worked.</h2></div>
        <p className="text-[10px] text-neutral-500 text-right">Tap a badge to flip</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-10 justify-items-center">
        {items.slice(0,5).map((item, index) => (
          <div key={item.id} className="relative w-full max-w-[180px] pt-16 md:pt-20" style={{ perspective: 950 }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-3 rounded-full bg-neutral-400 z-10" />
            <motion.div aria-hidden="true" className="absolute top-2 left-1/2 w-[9px] h-[68px] md:h-[83px] -translate-x-1/2 rounded-b-lg opacity-80"
              style={{ background: item.color || '#71717a', transformOrigin: 'top center' }}
              initial={reduced ? false : { rotate: index % 2 ? -5 : 5 }}
              animate={{ rotate: 0 }} transition={{ type: 'spring', stiffness: 70, damping: 9, delay: index * 0.1 }} />
            <button type="button" aria-label={`Flip ${item.company} badge`} aria-pressed={flipped === item.id}
              onClick={() => setFlipped(flipped === item.id ? null : item.id)}
              className="relative w-full aspect-[0.64] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded-xl"
              style={{ transformStyle: 'preserve-3d' }}>
              <motion.div className="absolute inset-0" animate={{ rotateY: flipped === item.id ? 180 : 0, rotateZ: flipped === item.id ? 0 : index % 2 ? -2 : 2 }}
                transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 110, damping: 17 }} style={{ transformStyle: 'preserve-3d' }}>
                <div className="absolute inset-0 rounded-xl overflow-hidden bg-[#f4f3ef] text-[#202025] shadow-xl border border-black/10 flex flex-col items-center px-3 pb-4" style={{ backfaceVisibility: 'hidden' }}>
                  <div className="w-full h-11 absolute top-0 left-0" style={{ background: item.color || '#71717a' }} />
                  <div className="relative mt-5 w-12 h-2 rounded-full bg-[#f4f3ef] shadow-inner shrink-0" />
                  <div className="mt-5 w-20 h-20 rounded-full bg-neutral-200 overflow-hidden border-4 border-white shadow-md flex items-center justify-center text-neutral-400 text-2xl">
                    {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : item.company.slice(0,1)}
                  </div>
                  <div className="mt-4 text-sm font-semibold text-center leading-tight break-words w-full">{item.company || 'Company'}</div>
                  <div className="mt-2 text-[10px] text-center text-neutral-500 leading-snug">{item.role || 'Role'}</div>
                  <div className="mt-auto border-t border-dashed border-neutral-300 pt-3 w-full text-center text-[10px] font-mono tracking-wide">{item.period || 'Timeline'}</div>
                </div>
                <div className="absolute inset-0 rounded-xl overflow-hidden bg-[#f4f3ef] text-[#202025] shadow-xl border border-black/10 flex flex-col px-4 pb-5" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <div className="h-11 -mx-4 shrink-0" style={{ background: item.color || '#71717a' }} />
                  <div className="mt-5 text-base font-semibold break-words">{item.company}</div>
                  <div className="mt-2 text-xs text-neutral-500">{item.role}</div>
                  <div className="mt-5 text-[11px] text-neutral-600">{item.period}</div>
                  <div className="mt-auto space-y-3 text-[11px]">
                    {item.location && <div className="flex items-start gap-2"><MapPin size={13} className="shrink-0" /> <span>{item.location}</span></div>}
                    {item.socialUrl && <span className="flex items-center gap-2 break-all"><ArrowUpRight size={13} className="shrink-0" />{item.socialLabel || 'Social media'}</span>}
                  </div>
                </div>
              </motion.div>
            </button>
            {flipped === item.id && item.socialUrl && <a href={item.socialUrl} target="_blank" rel="noopener noreferrer" className="block text-center mt-3 text-[10px] text-neutral-400 underline underline-offset-4 hover:text-white">Open {item.socialLabel || 'social media'}</a>}
          </div>
        ))}
      </div>
    </section>
  );
}
