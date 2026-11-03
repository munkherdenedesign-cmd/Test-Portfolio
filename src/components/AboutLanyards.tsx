import React from 'react';
import LanyardBadge from './SingleLanyardBadge';
import type { Experience } from '../lib/aboutExperience';
import { MapPin, ArrowUpRight } from 'lucide-react';

const COLORS = ['#f3a31f', '#a855f7', '#f34667', '#00b98b', '#2563eb'];

export function AboutLanyards({ items }: { items: Experience[] }) {
  return (
    <section className="relative isolate min-h-[calc(100svh-85px)] overflow-hidden bg-[#090909] text-white pt-10 md:pt-14 pb-16">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-50" style={{ backgroundImage: 'radial-gradient(#343434 1.5px, transparent 1.5px)', backgroundSize: '36px 36px', maskImage: 'linear-gradient(transparent, black 25%, black 90%)' }}/>
      <header className="relative z-10 text-center px-4 mb-12 md:mb-16">
        <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-500 mb-5">MY JOURNEY · FIVE EXPERIENCES</p>
        <h1 className="text-3xl md:text-5xl lg:text-6xl tracking-tight font-semibold">Five chapters of my career.</h1>
        <p className="text-xs text-neutral-500 mt-5">Drag a lanyard to swing it. Tap a badge to flip it.</p>
      </header>
      <div className="relative overflow-x-auto pb-8">
        <div className="relative mx-auto min-w-max px-5 md:px-10">
          <div aria-hidden="true" className="absolute top-0 left-0 right-0 h-4 z-10 border-y border-white/30 shadow-[0_5px_13px_#000] pointer-events-none" style={{ background: 'repeating-linear-gradient(90deg,#555 0px,#aaa 2px,#555 5px,#282828 11px,#777 15px)' }}/>
          <div className="relative flex justify-center gap-1 md:gap-2">
            {items.slice(0,5).map((item,index) => {
              const color = item.color && item.color !== '#71717a' ? item.color : COLORS[index];
              const face = (back: boolean) => <div className="relative w-full h-full bg-[#1b1b1d] text-white overflow-hidden flex flex-col items-center px-3 pb-4 border border-white/10 rounded-xl">
                <div className="absolute inset-x-0 top-0 h-[30%]" style={{ background: `repeating-linear-gradient(135deg,transparent 0 9px,#ffffff24 9px 11px),${color}` }}/>
                <div className="relative mt-10 w-[72px] h-[72px] rounded-full border-4 border-[#252525] shadow-[0_0_0_2px_#aaa] overflow-hidden flex items-center justify-center bg-[#333] text-3xl">
                  {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover"/> : (item.company || '?').charAt(0)}
                </div>
                <div className="relative mt-5 font-semibold text-base text-center leading-tight w-full break-words">{item.company || `Experience ${index+1}`}</div>
                <div className="relative mt-2 text-xs text-neutral-400 text-center">{item.role || 'Job title'}</div>
                {back ? <div className="relative mt-auto w-full space-y-3 text-xs text-neutral-300">
                  {item.location && <div className="flex gap-2 items-start"><MapPin size={14} className="shrink-0"/>{item.location}</div>}
                  {item.socialUrl && <a href={item.socialUrl} target="_blank" rel="noopener noreferrer" onPointerDown={e => e.stopPropagation()} onClick={e=>e.stopPropagation()} className="flex items-center gap-2 underline underline-offset-4"><ArrowUpRight size={14}/>{item.socialLabel || 'Social media'}</a>}
                </div> : <div className="relative mt-auto w-full border-t border-dashed border-white/25 pt-3 text-center text-xs font-mono tracking-wide">{item.period || 'Start — End'}</div>}
              </div>;
              return <div key={item.id} className="w-[210px] md:w-[240px] shrink-0">
                <LanyardBadge
                  front={face(false)}
                  back={face(true)}
                  strapColor={color}
                  inkColor="#f2f2f2"
                  strapText={item.company || 'WORK EXPERIENCE'}
                  strapLabel={item.period || 'CAREER'}
                  cardWidth={190}
                  height="590px"
                  flipButton={false}
                />
              </div>;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
