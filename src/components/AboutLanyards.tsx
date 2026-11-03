import React from 'react';
import LanyardBadge from './SingleLanyardBadge';
import type { Experience } from '../lib/aboutExperience';
import { MapPin, ArrowUpRight } from 'lucide-react';

function DecorativeQR({ seed }: { seed: string }) {
  let n = 2166136261;
  for (let i=0;i<seed.length;i++) n = Math.imul(n ^ seed.charCodeAt(i), 16777619) >>> 0;
  const finder = (x:number,y:number,ox:number,oy:number) => {
    const a=x-ox,b=y-oy;
    return a>=0&&a<7&&b>=0&&b<7 ? (a===0||b===0||a===6||b===6||(a>=2&&a<=4&&b>=2&&b<=4)) : null;
  };
  const cells: React.ReactNode[] = [];
  for(let y=0;y<21;y++) for(let x=0;x<21;x++){
    const reserved = [[0,0],[14,0],[0,14]].some(([ox,oy])=>x>=ox-1&&x<=ox+7&&y>=oy-1&&y<=oy+7);
    const f = finder(x,y,0,0) ?? finder(x,y,14,0) ?? finder(x,y,0,14);
    n = (Math.imul(n,1664525)+1013904223)>>>0;
    if(f===true || (!reserved && (n&3)!==0)) cells.push(<rect key={y*21+x} x={x} y={y} width="1" height="1"/>);
  }
  return <svg aria-label="Decorative QR pattern" role="img" viewBox="0 0 21 21" className="w-[66px] h-[66px] bg-white p-1 rounded-sm text-black shrink-0" fill="currentColor">{cells}</svg>;
}

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
        <div className="relative mx-auto w-max min-w-full px-8 md:px-14">
          <div aria-hidden="true" className="absolute top-0 left-0 right-0 h-4 z-10 border-y border-white/30 shadow-[0_5px_13px_#000] pointer-events-none" style={{ background: 'repeating-linear-gradient(90deg,#555 0px,#aaa 2px,#555 5px,#282828 11px,#777 15px)' }}/>
          <div className="relative flex justify-center gap-0">
            {items.slice(0,5).map((item,index) => {
              const color = item.color && item.color !== '#71717a' ? item.color : COLORS[index];
              const front = <div className="relative w-full h-full bg-[#1b1b1d] text-white overflow-hidden flex flex-col items-center px-3 pb-4 border border-white/10 rounded-xl">
                <div className="absolute inset-x-0 top-0 h-[30%]" style={{ background: `repeating-linear-gradient(135deg,transparent 0 9px,#ffffff24 9px 11px),${color}` }}/>
                <div className="relative mt-10 w-[72px] h-[72px] rounded-full border-4 border-[#252525] shadow-[0_0_0_2px_#aaa] overflow-hidden flex items-center justify-center bg-[#333] text-3xl">
                  {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover"/> : (item.company || '?').charAt(0)}
                </div>
                <div className="relative mt-5 font-semibold text-base text-center leading-tight w-full break-words">{item.company || `Experience ${index+1}`}</div>
                <div className="relative mt-2 text-xs text-neutral-400 text-center">{item.role || 'Job title'}</div>
                <div className="relative mt-auto w-full border-t border-dashed border-white/25 pt-3 text-center text-xs font-mono tracking-wide">{item.period || 'Start — End'}</div>
              </div>;
              const back = <div className="relative w-full h-full bg-[#191919] text-white overflow-hidden flex flex-col border border-white/10 rounded-xl">
                <div className="h-[17%] shrink-0" style={{background:`repeating-linear-gradient(135deg,transparent 0 9px,#ffffff24 9px 11px),${color}`}}/>
                <div className="px-3 pt-3 flex-1 flex flex-col min-h-0">
                  <div className="font-semibold text-base leading-tight break-words">{item.company || `Experience ${index+1}`}</div>
                  <div className="text-xs text-neutral-400 mt-1">{item.role || 'Job title'}</div>
                  <p className="text-[12px] leading-[1.45] mt-3 text-neutral-200 break-words line-clamp-5">{item.description || 'Add a short description of this experience in the admin panel.'}</p>
                  <div className="flex flex-wrap gap-1 mt-3">{(item.keywords || []).filter(Boolean).slice(0,3).map((word,i)=><span key={i} className="text-[10px] rounded-full border border-white/20 px-2 py-0.5 text-neutral-400">{word}</span>)}</div>
                  <div className="mt-auto pb-3 flex items-end justify-between gap-1">
                    <div className="flex flex-col gap-2 text-[10px] text-neutral-300 min-w-0">
                      {item.location && <span className="flex items-start gap-1"><MapPin size={12} className="shrink-0"/><span className="break-words">{item.location}</span></span>}
                      {item.socialLabel && <span className="flex items-start gap-1"><ArrowUpRight size={12} className="shrink-0"/><span>{item.socialLabel}</span></span>}
                    </div>
                    <DecorativeQR seed={item.id}/>
                  </div>
                </div>
              </div>;
              return <div key={item.id} className="w-[255px] shrink-0 bg-transparent overflow-visible">
                <LanyardBadge
                  front={front}
                  back={back}
                  strapColor={color}
                  inkColor="#f2f2f2"
                  strapText={item.company || 'WORK EXPERIENCE'}
                  strapLabel={item.period || 'CAREER'}
                  cardWidth={190}
                  height="640px"
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
