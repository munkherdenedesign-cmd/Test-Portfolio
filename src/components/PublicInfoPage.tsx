import React, { useState } from 'react';
import { ArrowUpRight, Phone } from 'lucide-react';
import { Signature } from './Signature';
import { LiquidSurface } from './ui/LiquidSurface';
import { AboutLanyards } from './AboutLanyards';
import { loadAboutData, DEFAULT_ABOUT_INTRO, type AboutIntro, type Experience } from '../lib/aboutExperience';

function ContactExperience() {
  const [opened, setOpened] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <section className="flex min-h-[calc(100dvh-80px)] sm:min-h-[calc(100vh-100px)] items-center justify-center px-5 py-8 sm:px-6 sm:pb-20 sm:pt-0">
      <div className="relative flex w-full max-w-3xl flex-col items-center justify-center text-center">
        <div className={`flex items-center justify-center gap-3 transition-all duration-500 ${opened ? 'opacity-0 -translate-y-6 pointer-events-none' : 'opacity-100'}`}>
          <span className="relative flex h-2 w-2"><span className="absolute inset-0 rounded-full bg-emerald-400/70 animate-ping" /><span className="relative h-2 w-2 rounded-full bg-emerald-400" /></span>
          <span className="text-[11px] md:text-xs tracking-[0.2em] uppercase text-neutral-400">Available for projects</span>
        </div>
        <div className={`w-full flex flex-col items-center justify-center text-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${opened ? 'opacity-0 -translate-y-10 scale-95 pointer-events-none absolute' : 'opacity-100'}`}>
          <button type="button" onClick={() => setOpened(true)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            className="group mt-12 flex flex-col items-center gap-8 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded-xl" aria-label="Let's work together">
            <h1 className={`text-5xl sm:text-6xl md:text-8xl font-light tracking-[-0.06em] leading-[1.1] transition-transform duration-500 ${hovered ? '-translate-y-1' : ''}`}>
              <span className="block">Let's work</span><span className="block text-neutral-500">together</span>
            </h1>
            <span className={`relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border transition-all duration-500 ${hovered ? 'scale-110 bg-white border-white text-black shadow-[0_0_35px_rgba(255,255,255,0.2)]' : 'border-white/30 text-white'}`}>
              <ArrowUpRight size={27} strokeWidth={1.5} className={`transition-transform duration-500 ${hovered ? 'translate-x-1 -translate-y-1' : ''}`} />
            </span>
          </button>
          <p className="mt-10 px-2 text-center text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">Have a project in mind? I'd love to hear about it. Let's create something exceptional together.</p>
          <a href="mailto:munkherdenemunkhtsooj@gmail.com" className="inline-block mt-4 text-[11px] tracking-wide text-neutral-500 hover:text-white transition-colors">munkherdenemunkhtsooj@gmail.com</a>
        </div>
        <div className={`w-full flex flex-col items-center justify-center text-center gap-8 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${opened ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95 pointer-events-none absolute'}`}>
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Perfect</span>
          <h2 className="text-4xl sm:text-5xl font-light tracking-tight">Let's talk</h2>
          <div className="flex items-center gap-4 sm:gap-10">
            <span className="h-px w-8 sm:w-12 bg-white/20" />
            <a href="tel:+97680792969" className="group flex items-center gap-3 rounded-full border border-white/30 px-7 py-4 hover:bg-white hover:text-black hover:border-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.18)]">
              <Phone size={19} strokeWidth={1.5} /><span className="text-sm tracking-wide">Call</span><ArrowUpRight size={17} strokeWidth={1.5} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <span className="h-px w-8 sm:w-12 bg-white/20" />
          </div>
          <a href="mailto:munkherdenemunkhtsooj@gmail.com" className="text-xs text-neutral-400 hover:text-white transition-colors">munkherdenemunkhtsooj@gmail.com</a>
          <button type="button" onClick={() => setOpened(false)} className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 hover:text-neutral-300 transition-colors mt-4 cursor-pointer">Back</button>
        </div>
      </div>
    </section>
  );
}

export function PublicInfoPage({ page, signatureUrl, onNavigate }: { page: 'about' | 'contact'; signatureUrl?: string; onNavigate?: (path: string) => void }) {
  const about = page === 'about';
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [intro, setIntro] = useState<AboutIntro>(DEFAULT_ABOUT_INTRO);
  React.useEffect(() => { if (about) loadAboutData().then(data => { setExperiences(data.items); setIntro(data.intro); }); }, [about]);
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#eaeaea] font-mono flex flex-col">
      <header className="pt-6 md:pt-8 flex justify-center">
        <a href="/" onClick={(e) => { if (onNavigate && !e.metaKey && !e.ctrlKey) { e.preventDefault(); onNavigate('/'); } }} aria-label="Home" className="inline-flex focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
          <LiquidSurface className="cursor-pointer"><Signature signatureUrl={signatureUrl} className="cursor-pointer" /></LiquidSurface>
        </a>
      </header>
      {about ? <AboutLanyards items={experiences} intro={intro} /> : <ContactExperience />}
    </div>
  );
}
