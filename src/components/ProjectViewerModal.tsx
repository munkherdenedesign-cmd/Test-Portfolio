import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Project } from '../types/portfolio';
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ProjectViewerModalProps {
  project: Project | null;
  projectsList: Project[];
  onClose: () => void;
  onNavigate: (project: Project) => void;
}

export const ProjectViewerModal: React.FC<ProjectViewerModalProps> = ({ project, projectsList, onClose, onNavigate }) => {
  const [activePage, setActivePage] = useState(0);
  const [showSocialEmbed, setShowSocialEmbed] = useState(false);
  const touchStart = useRef<number | null>(null);
  useEffect(() => { setActivePage(0); setShowSocialEmbed(false); }, [project?.id]);
  const currentIndex = project ? projectsList.findIndex(p => p.id === project.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < projectsList.length - 1;
  const prev = useCallback(() => { if (hasPrev) onNavigate(projectsList[currentIndex - 1]); }, [hasPrev, currentIndex, projectsList, onNavigate]);
  const next = useCallback(() => { if (hasNext) onNavigate(projectsList[currentIndex + 1]); }, [hasNext, currentIndex, projectsList, onNavigate]);

  useEffect(() => {
    if (!project) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') prev();
      if (event.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [project, onClose, prev, next]);

  useEffect(() => {
    if (!project) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [project]);

  if (!project) return null;

  const carousel = Boolean(project.details?.isCarousel && project.mediaType === 'image');
  const pages = carousel ? [project.mediaUrl || project.coverUrl, ...(project.details?.carouselPages || [])].filter(Boolean) : [];
  const source = carousel ? pages[Math.min(activePage, pages.length - 1)] : project.mediaUrl || project.coverUrl;
  const isPortraitSocial = project.mediaType === 'embed' && (/instagram\\.com\\/(reel|p|tv)\\//i.test(source) || /facebook\\.com\\/(reel|videos)\\//i.test(source));
  const socialCover = project.coverUrl && !/instagram\\.com\\/|facebook\\.com\\//i.test(project.coverUrl) ? project.coverUrl : '';
  const socialUrl = project.socialUrl || (/instagram\.com|facebook\.com|youtu\.be|youtube\.com|tiktok\.com/.test(source) ? source : '');
  const driveUrl = project.googleDriveUrl || (project.externalLink?.includes('drive.google.com') ? project.externalLink : '');
  const websiteUrl = project.externalLink && !project.externalLink.includes('drive.google.com')
    ? project.externalLink : project.mediaType === 'website' ? source : '';
  const links = [
    { label: 'View original', url: socialUrl },
    { label: 'Visit website', url: websiteUrl && websiteUrl !== socialUrl ? websiteUrl : '' },
    { label: 'Google Drive', url: driveUrl },
    { label: 'Behance', url: project.behanceUrl },
    { label: 'Figma', url: project.figmaUrl },
  ].filter((item): item is { label: string; url: string } => Boolean(item.url));

  const media = (() => {
    if (project.mediaType === 'video') {
      return <video key={source} src={source} controls playsInline preload="metadata" className="block max-w-full w-auto h-auto max-h-[68dvh] md:max-h-[78dvh] object-contain" />;
    }
    if (project.mediaType === 'pdf') {
      return <iframe title={project.title} src={source} className="block w-full h-[65dvh] md:h-[76dvh] border-0 bg-white" />;
    }
    if (project.mediaType === 'website') {
      return <div className="w-full"><div className="px-4 py-2 text-[11px] text-neutral-400 border-b border-white/10 truncate">{source}</div><iframe title={project.title} src={source} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" className="block w-full h-[62dvh] md:h-[73dvh] border-0 bg-white" /></div>;
    }
    if (project.mediaType === 'embed') {
      let embedSrc = '';
      const match = project.embedCode?.match(/src=["']([^"']+)["']/);
      if (match) embedSrc = match[1];
      else if (/instagram\.com/.test(source)) embedSrc = source.split('?')[0].replace(/\/+$/, '') + '/embed/';
      else if (/facebook\.com/.test(source)) {
        const isVideo = /\/reel\/|\/videos\/|\/watch\//.test(source);
        embedSrc = 'https://www.facebook.com/plugins/' + (isVideo ? 'video.php' : 'post.php') + '?href=' + encodeURIComponent(source.split('?')[0]) + '&show_text=true';
      } else if (/youtube\.com\/watch|youtu\.be\//.test(source)) {
        try {
          const url = new URL(source);
          const id = url.hostname.includes('youtu.be') ? url.pathname.slice(1) : url.searchParams.get('v');
          if (id) embedSrc = 'https://www.youtube.com/embed/' + encodeURIComponent(id);
        } catch { /* invalid link */ }
      }
      if (isPortraitSocial) {
        return <div className="relative mx-auto w-full max-w-[min(420px,calc(72dvh*9/16))] aspect-[9/16] bg-[#171719] overflow-hidden">
          {!showSocialEmbed && socialCover ? <>
            <img src={socialCover} alt={project.title + ' reel cover'} className="absolute inset-0 h-full w-full object-contain" />
            <button type="button" onClick={() => setShowSocialEmbed(true)} aria-label="Play reel" className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/25 transition-colors">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/70 border border-white/60 text-white text-xl shadow-xl" aria-hidden="true">▶</span>
            </button>
          </> : embedSrc ? <iframe title={project.title} src={embedSrc} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen className="absolute inset-0 block h-full w-full border-0 bg-[#171719]" /> : socialCover ? <img src={socialCover} alt={project.title} className="absolute inset-0 h-full w-full object-contain" /> : <a href={source} target="_blank" rel="noopener noreferrer" className="absolute inset-0 flex items-center justify-center text-sm underline">View original reel ↗</a>}
        </div>;
      }
      return embedSrc
        ? <iframe title={project.title} src={embedSrc} allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen className="block w-full h-[65dvh] md:h-[76dvh] border-0" />
        : <a href={source} target="_blank" rel="noopener noreferrer" className="p-10 text-sm underline underline-offset-4">Open original post ↗</a>;
    }
    return <img src={source} alt={project.title} className="block max-w-full w-auto h-auto max-h-[68dvh] md:max-h-[78dvh] object-contain" />;
  })();

  const information = (
    <div className="w-full text-left">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(220px,0.8fr)] gap-7 lg:gap-12">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.16em] text-neutral-400 mb-3">
            {project.client && <span>{project.client}</span>}
            {project.client && project.year && <span className="text-neutral-600">/</span>}
            {project.year && <span>{project.year}</span>}
          </div>
          <h2 className="text-[22px] md:text-[28px] leading-[1.15] tracking-[-0.04em] font-medium text-white break-words">{project.title}</h2>
          {project.description && <p className="mt-4 text-[12px] md:text-[13px] leading-[1.8] text-neutral-300 whitespace-pre-line max-w-[58ch]">{project.description}</p>}
        </div>
        <div className="min-w-0 lg:border-l lg:border-white/15 lg:pl-7 flex flex-col gap-5">
          {project.details?.role && <div><p className="text-[10px] uppercase tracking-[0.15em] text-neutral-500 mb-1.5">My role</p><p className="text-xs leading-relaxed text-neutral-200">{project.details.role}</p></div>}
          {Boolean(project.details?.deliverables?.length) && <div><p className="text-[10px] uppercase tracking-[0.15em] text-neutral-500 mb-1.5">What I made</p><p className="text-xs leading-[1.8] text-neutral-200">{project.details?.deliverables?.join(' · ')}</p></div>}
          {project.details?.credits && <div><p className="text-[10px] uppercase tracking-[0.15em] text-neutral-500 mb-1.5">Credits</p><p className="text-xs leading-relaxed text-neutral-200">{project.details.credits}</p></div>}
          {Boolean(project.tags?.length) && <div className="flex flex-wrap gap-1.5">{project.tags?.map(tag => <span key={tag} className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] text-neutral-400">{tag}</span>)}</div>}
          {links.length > 0 && <div className="flex flex-wrap gap-2">{links.map(link => <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-2 text-[11px] text-white hover:bg-white hover:text-black transition-colors">{link.label}<ArrowUpRight size={12} /></a>)}</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg font-mono text-white" role="dialog" aria-modal="true" aria-label={project.title} onClick={onClose}>
      <div className="absolute inset-0 overflow-y-auto overscroll-contain" onClick={e => e.stopPropagation()}>
        <div className="min-h-full flex flex-col items-center justify-center px-4 md:px-16 py-12 md:py-10">
          <div className="group relative w-full max-w-6xl flex flex-col items-center">
            <button type="button" onClick={onClose} aria-label="Close project" title="Close project" className="absolute top-3 right-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/85 border border-white/30 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><X size={20} /></button>
            <div className="relative w-full flex items-center justify-center bg-[#101012] border border-white/10 rounded-xl overflow-hidden"
              onTouchStart={e => { touchStart.current = e.touches[0]?.clientX ?? null; }}
              onTouchEnd={e => { if (!carousel || touchStart.current === null) return; const delta = (e.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current; if (Math.abs(delta) > 45) setActivePage(p => Math.max(0, Math.min(pages.length - 1, p + (delta < 0 ? 1 : -1)))); touchStart.current = null; }}>
              {media}
              {/* On desktop the project remains uncropped; information floats over the bottom on hover or keyboard focus. */}
              <div className="hidden md:block absolute inset-x-0 bottom-0 z-10 max-h-[85%] overflow-y-auto bg-[#101012]/95 border-t border-white/15 backdrop-blur-2xl px-7 py-7 lg:px-10 lg:py-9 translate-y-full opacity-0 transition-[transform,opacity] duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
                {information}
              </div>
            </div>
            {carousel && pages.length > 1 && <div className="w-full flex items-center gap-2 mt-4">
              <button type="button" onClick={() => setActivePage(p => Math.max(0, p - 1))} disabled={activePage === 0} aria-label="Previous carousel page" className="shrink-0 p-2 border border-white/20 rounded-full disabled:opacity-30"><ChevronLeft size={16}/></button>
              <div className="flex-1 min-w-0 flex gap-2 overflow-x-auto py-1">
                {pages.map((url, i) => <button key={url + i} type="button" onClick={() => setActivePage(i)} aria-label={`Show carousel page ${i + 1}`} aria-current={i === activePage ? 'true' : undefined} className={`shrink-0 w-14 h-16 rounded-md border-2 overflow-hidden bg-neutral-900 ${i === activePage ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}><img src={url} alt={`Page ${i + 1}`} className="w-full h-full object-contain"/></button>)}
              </div>
              <button type="button" onClick={() => setActivePage(p => Math.min(pages.length - 1, p + 1))} disabled={activePage === pages.length - 1} aria-label="Next carousel page" className="shrink-0 p-2 border border-white/20 rounded-full disabled:opacity-30"><ChevronRight size={16}/></button>
            </div>}
            {/* Mobile: no hover dependency. Details are always shown underneath the full media. */}
            <section className="md:hidden w-full px-1 pt-7 pb-20">{information}</section>
          </div>
        </div>
      </div>
      {projectsList.length > 1 && <nav aria-label="Browse projects" className="fixed left-1/2 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 -translate-x-1/2 flex items-center justify-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 backdrop-blur-md">
        {projectsList.map((item, index) => (
          <button key={item.id} type="button" onClick={() => onNavigate(item)} aria-label={`View project ${index + 1}: ${item.title}`} aria-current={index === currentIndex ? 'true' : undefined} title={item.title}
            className="group/dot flex h-5 min-w-2.5 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
            <span className={`block rounded-full transition-all duration-300 ease-out ${index === currentIndex ? 'h-2 w-2 bg-white shadow-[0_0_10px_rgba(255,255,255,0.4)]' : 'h-1 w-1 bg-white/35 group-hover/dot:bg-white/80 group-hover/dot:scale-125'}`} />
          </button>
        ))}
      </nav>}
      {hasPrev && <button onClick={e => { e.stopPropagation(); prev(); }} aria-label="Previous project" className="fixed z-30 left-2 md:left-5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 border border-white/20 hover:bg-neutral-800"><ChevronLeft size={20} /></button>}
      {hasNext && <button onClick={e => { e.stopPropagation(); next(); }} aria-label="Next project" className="fixed z-30 right-2 md:right-5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 border border-white/20 hover:bg-neutral-800"><ChevronRight size={20} /></button>}
    </div>
  );
};

export default ProjectViewerModal;
