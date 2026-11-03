import React from 'react';
import { Signature } from './Signature';

export function PublicInfoPage({ page, signatureUrl }: { page: 'about' | 'contact'; signatureUrl?: string }) {
  const about = page === 'about';
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#eaeaea] font-mono flex flex-col">
      <header className="pt-6 md:pt-8 flex justify-center">
        <a href="/" aria-label="Home" className="inline-flex focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
          <Signature signatureUrl={signatureUrl} />
        </a>
      </header>
      <main className="flex-1 w-full max-w-2xl mx-auto px-7 pt-24 md:pt-32 pb-24">
        <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 mb-5">{about ? 'The person behind the work' : 'Get in touch'}</p>
        <h1 className="text-4xl md:text-6xl font-normal tracking-tight mb-9">{about ? 'About me.' : 'Contact.'}</h1>
        {about ? (
          <div className="space-y-5 text-sm md:text-base leading-relaxed text-neutral-400 max-w-lg">
            <p>I'm Munkherdene. I work across social media, design, photography, video, and digital experiences.</p>
            <p>This portfolio brings together selected projects and the ideas behind them.</p>
          </div>
        ) : (
          <div className="space-y-6 text-sm md:text-base text-neutral-400">
            <p>For projects, collaborations, or just to say hello.</p>
            <a className="inline-block text-white border-b border-white/40 pb-1 hover:border-white transition-colors" href="mailto:munkherdenedesign@gmail.com">munkherdenedesign@gmail.com</a>
          </div>
        )}
      </main>
    </div>
  );
}
