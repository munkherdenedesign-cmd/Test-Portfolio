import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Experience } from '../lib/aboutExperience';
import { MapPin, ArrowUpRight } from 'lucide-react';

export function AboutLanyards({ items }: { items: Experience[] }) {
  const [flipped, setFlipped] = useState<string | null>(null);
  const reduced = useReducedMotion();
  return <section className="relative isolate w-full min-h-[calc(100vh-95px)] overflow-hidden bg-[#090909] text-[#f5f5f5] pt-14 md:pt-20 pb-20">
    <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: 'radial-gradient(circle, #343434 1.6px, transparent 1.8px)', backgroundSize: '36px 36px', maskImage: 'linear-gradient(to bottom, transparent 0%, black 22%, black 92%)' }}/>
    <div className="relative text-center px-6 mb-12 md:mb-16">
      <p className="uppercase tracking-[0.35em] text-neutral-500 text-[10px] md:text-xs mb-5">My journey · Five experiences</p>
      <h1 className="text-3xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.055em] leading-[1.1]">Five chapters of my career.</h1>
      <p className="mt-5 text-xs text-neutral-500">Click a badge to see the other side.</p>
    </div>
    <div className="relative w-full overflow-x-auto pb-10">
      <div className="relative mx-auto w-max min-w-full px-6 md:px-12">
        <div aria-hidden="true" className="absolute top-[14px] left-0 right-0 h-[18px] border-y border-white/25 shadow-[0_7px_12px_#000,0_0_14px_#8888] z-10" style={{ background: 'repeating-linear-gradient(90deg, #565656 0px, #aaa 2px, #555 5px, #2c2c2c 12px, #888 15px)' }}/>
        <div className="relative z-20 flex justify-center gap-5 md:gap-8 lg:gap-11">
          {items.slice(0,5).map((item,index) => {
            const active = flipped === item.id;
            return <div key={item.id} className="relative w-[165px] sm:w-[185px] md:w-[205px] lg:w-[220px] shrink-0 pt-[180px] md:pt-[200px]" style={{ perspective: 1000 }}>
              <div aria-hidden="true" className="absolute top-[4px] left-1/2 -translate-x-1/2 w-5 h-9 rounded-full border-[3px] border-neutral-300 shadow-[inset_0_0_3px_#fff,0_1px_4px_#000] z-20"/>
              <motion.div aria-hidden="true" className="absolute top-[36px] left-[calc(50%-8px)] w-[16px] h-[99px] md:h-[116px] border-x border-white/20" style={{ background: `repeating-linear-gradient(135deg,transparent 0px,transparent 3px,#ffffff22 3px,#ffffff22 5px),${item.color || '#71717a'}`, transformOrigin: 'top center' }} initial={reduced ? false : {rotate:index%2 ? -5 : 5}} animate={{rotate:0}} transition={{type:'spring',stiffness:60,damping:8,delay:index*.12}}/>
              <div aria-hidden="true" className="absolute top-[132px] md:top-[149px] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-[5px] border-neutral-300 bg-[#777] shadow-[inset_0_0_0_3px_#e4e4e4,0_2px_6px_#000] z-10"/>
              <div aria-hidden="true" className="absolute top-[159px] md:top-[176px] left-1/2 -translate-x-1/2 w-2 h-8 bg-gradient-to-r from-neutral-800 via-neutral-300 to-neutral-800"/>
              <motion.div className="relative" animate={{rotateZ: active ? 0 : index%2 ? -2 : 2}} transition={{type:'spring',stiffness:100,damping:12}}>
                <button type="button" aria-label={`Flip ${item.company} badge`} aria-pressed={active} onClick={() => setFlipped(active ? null : item.id)} className="block relative w-full aspect-[0.73] rounded-xl cursor-pointer focus-visible:outline-2 focus-visible:outline-white" style={{perspective:900}}>
                  <motion.div className="absolute inset-0" animate={{rotateY:active?180:0}} transition={reduced ? {duration:0} : {type:'spring',stiffness:110,damping:18}} style={{transformStyle:'preserve-3d'}}>
                    <div className="absolute inset-0 overflow-hidden rounded-xl border border-white/15 bg-[#1c1c1c] shadow-[0_18px_22px_#000a] flex flex-col items-center px-3 pb-4" style={{backfaceVisibility:'hidden'}}>
                      <div className="absolute inset-x-0 top-0 h-[31%]" style={{background:`repeating-linear-gradient(135deg,transparent 0px,transparent 9px,#ffffff22 9px,#ffffff22 11px),${item.color || '#71717a'}`}}/>
                      <div className="relative mt-3 h-2.5 w-10 rounded-full bg-[#0b0b0b] border border-white/20"/>
                      <div className="relative mt-5 md:mt-6 size-[72px] md:size-[88px] rounded-full border-[4px] border-[#292929] shadow-[0_0_0_2px_#888,0_5px_8px_#0009] overflow-hidden bg-[#3a3a3a] flex items-center justify-center text-3xl text-white/50">
                        {item.image ? <img src={item.image} alt="" className="size-full object-cover"/> : item.company.slice(0,1)}
                      </div>
                      <strong className="mt-4 w-full text-center text-sm md:text-base leading-tight font-semibold break-words">{item.company || 'Company'}</strong>
                      <span className="mt-1 text-xs text-neutral-400 text-center">{item.role || 'Role'}</span>
                      <span className="mt-auto w-full pt-4 border-t border-dashed border-neutral-600 text-center font-mono text-[10px] tracking-wider text-neutral-300">{item.period || 'Start — End'}</span>
                    </div>
                    <div className="absolute inset-0 overflow-hidden rounded-xl border border-white/15 bg-[#1c1c1c] shadow-[0_18px_22px_#000a] flex flex-col px-4 pb-5" style={{backfaceVisibility:'hidden',transform:'rotateY(180deg)'}}>
                      <div className="h-[25%] -mx-4" style={{background:`repeating-linear-gradient(135deg,transparent 0px,transparent 9px,#ffffff22 9px,#ffffff22 11px),${item.color || '#71717a'}`}}/>
                      <strong className="mt-5 text-base break-words">{item.company}</strong>
                      <span className="text-xs text-neutral-400 mt-2">{item.role}</span>
                      <span className="text-[11px] text-neutral-500 mt-3">{item.period}</span>
                      <div className="mt-auto space-y-3 text-[11px] text-neutral-300">
                        {item.location && <span className="flex gap-2 items-start"><MapPin size={13} className="shrink-0"/>{item.location}</span>}
                        {item.socialLabel && <span className="flex gap-2 items-center"><ArrowUpRight size={13}/>{item.socialLabel}</span>}
                      </div>
                    </div>
                  </motion.div>
                </button>
              </motion.div>
              {active && item.socialUrl && <a className="block mt-3 text-center text-[11px] text-neutral-400 hover:text-white underline underline-offset-4" href={item.socialUrl} target="_blank" rel="noopener noreferrer">Open {item.socialLabel || 'social media'}</a>}
            </div>;
          })}
        </div>
      </div>
    </div>
  </section>;
}
