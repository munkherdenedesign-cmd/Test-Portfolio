import React from 'react';

export function PublicSiteNavigation({ currentPath, onNavigate }: { currentPath: string; onNavigate?: (path: string) => void }) {
  const links = [
    { href: '/contact', label: 'Contact', side: 'left' },
    { href: '/about', label: 'About', side: 'right' }
  ];
  return (
    <nav aria-label="Public navigation" className="pointer-events-none fixed inset-x-0 top-0 z-50">
      {links.map(({ href, label, side }) => (
        <a key={href} href={href} onClick={(e) => { if (onNavigate && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); onNavigate(href); } }} aria-current={currentPath === href ? 'page' : undefined}
          className={`pointer-events-auto absolute top-7 md:top-9 ${side === 'left' ? 'left-5 md:left-10' : 'right-5 md:right-10'} text-[11px] md:text-xs font-mono tracking-[0.12em] transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${currentPath === href ? 'text-white underline underline-offset-8 decoration-white/60' : 'text-neutral-400'}`}>
          {label}
        </a>
      ))}
    </nav>
  );
}
