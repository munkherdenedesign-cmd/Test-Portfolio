import React, { useState } from 'react';
import { ArrowUpRight, Phone } from 'lucide-react';
import { motion } from 'motion/react';
import { LiquidSurface } from './ui/LiquidSurface';
import { Signature } from './Signature';
import { AboutLanyards } from './AboutLanyards';
import { loadAboutData, DEFAULT_ABOUT_INTRO, type AboutIntro, type Experience } from '../lib/aboutExperience';

function ContactExperience() {
  const [opened, setOpened] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <section className="relative flex flex-1 min-h-[calc(100dvh-80px)] items-center justify-center px-5 py-8 sm:px-6">
      {/* Both states share one centered button anchor on every screen size. */}
      <div className="relative flex w-full max-w-3xl flex-col items-center justify-center text-center">
        <div className={`absolute bottom-full mb-10 sm:mb-12 flex flex-col items-center gap-5 transition-all duration-500 ${opened ? 'opacity-0 translate-y-3 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
          <div className="flex items-center justify-center gap-3">
            <span className="relative flex h-2 w-2"><span className="absolute inset-0 rounded-full bg-emerald-400/70 animate-ping" /><span className="relative h-2 w-2 rounded-full bg-emerald-400" /></span>
            <span className="text-[11px] md:text-xs tracking-[0.2em] uppercase text-neutral-400">Available for projects</span>
          </div>
          <h1 className={`text-5xl sm:text-6xl md:text-8xl font-light tracking-[-0.06em] leading-[1.1] transition-transform duration-500 ${hovered ? '-translate-y-1' : ''}`}>
            <span className="block">Let's work</span><span className="block text-neutral-500">together</span>
          </h1>
        </div>

        {/* One persistent control stays centered while its shape and content morph. */}
        <div className="relative z-10 flex h-16 sm:h-20 w-full items-center justify-center">
          <motion.button
            type="button"
            onClick={() => {
              if (opened) window.location.href = 'tel:+97680792969';
              else { setOpened(true); setHovered(false); }
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            animate={{ width: opened ? 160 : undefined, backgroundColor: hovered ? '#ffffff' : 'rgba(255,255,255,0)', color: hovered ? '#000000' : '#ffffff' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/30 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            aria-label={opened ? 'Call +976 8079 2969' : "Let's work together"}
          >
            <motion.span
              animate={{ opacity: opened ? 0 : 1, scale: opened ? 0.65 : 1 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
              aria-hidden="true"
            >
              <ArrowUpRight size={27} strokeWidth={1.5} />
            </motion.span>
            <motion.span
              animate={{ opacity: opened ? 1 : 0, scale: opened ? 1 : 0.8 }}
              transition={{ duration: 0.3, delay: opened ? 0.12 : 0 }}
              className="absolute inset-0 flex items-center justify-center gap-2.5 whitespace-nowrap"
              aria-hidden="true"
            >
              <Phone size={19} strokeWidth={1.5} />
              <span className="text-sm tracking-wide">Call</span>
              <ArrowUpRight size={17} strokeWidth={1.5} />
            </motion.span>
          </motion.button>
        </div>

        <div className={`absolute top-full mt-9 sm:mt-10 flex w-full flex-col items-center gap-4 transition-all duration-500 ${opened ? 'opacity-0 -translate-y-3 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
          <p className="px-2 text-center text-sm text-neutral-400 max-w-md leading-relaxed">Have a project in mind? I'd love to hear about it. Let's create something exceptional together.</p>
          <a href="mailto:munkherdenemunkhtsooj@gmail.com" className="text-[11px] tracking-wide text-neutral-500 hover:text-white transition-colors">munkherdenemunkhtsooj@gmail.com</a>
        </div>

        <div className={`absolute bottom-full mb-10 flex flex-col items-center gap-4 transition-all duration-500 ${opened ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}>
          <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">Perfect</span>
          <h2 className="text-4xl sm:text-5xl font-light tracking-tight">Let's talk</h2>
        </div>
        <div className={`absolute top-full mt-8 flex flex-col items-center gap-6 transition-all duration-500 ${opened ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'}`}>
          <a href="mailto:munkherdenemunkhtsooj@gmail.com" className="text-xs text-neutral-400 hover:text-white transition-colors">munkherdenemunkhtsooj@gmail.com</a>
          <button type="button" onClick={() => setOpened(false)} className="text-[10px] uppercase tracking-[0.2em] text-neutral-600 hover:text-neutral-300 transition-colors cursor-pointer">Back</button>
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
