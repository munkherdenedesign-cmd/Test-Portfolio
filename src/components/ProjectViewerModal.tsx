import React, { useCallback, useEffect } from 'react';
import { Project } from '../types/portfolio';
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ProjectViewerModalProps {
  project: Project | null;
  projectsList: Project[];
  onClose: () => void;
  onNavigate: (project: Project) => void;
}

export const ProjectViewerModal: React.FC<ProjectViewerModalProps> = ({ project, projectsList, onClose, onNavigate }) => {
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

  const source = project.mediaUrl || project.coverUrl;
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
      <header className="absolute inset-x-0 top-0 z-30 h-14 px-4 md:px-8 flex items-center justify-between border-b border-white/10 bg-black/90" onClick={e => e.stopPropagation()}>
        <span className="text-[11px] tracking-widest text-neutral-400">{currentIndex >= 0 ? String(currentIndex + 1).padStart(2, '0') + ' / ' + String(projectsList.length).padStart(2, '0') : 'PROJECT'}</span>
        <button onClick={onClose} aria-label="Close project" className="p-2 rounded-full hover:bg-white/10"><X size={19} /></button>
      </header>
      <div className="absolute inset-x-0 top-14 bottom-0 overflow-y-auto overscroll-contain" onClick={e => e.stopPropagation()}>
        <div className="min-h-full flex flex-col items-center justify-center px-4 md:px-16 py-5 md:py-8">
          <div className="group relative w-full max-w-6xl flex flex-col items-center">
            <div className="relative w-full flex items-center justify-center bg-[#101012] border border-white/10 rounded-xl overflow-hidden">
              {media}
              {/* On desktop the project remains uncropped; information floats over the bottom on hover or keyboard focus. */}
              <div className="hidden md:block absolute inset-x-0 bottom-0 z-10 max-h-[85%] overflow-y-auto bg-[#101012]/95 border-t border-white/15 backdrop-blur-2xl px-7 py-7 lg:px-10 lg:py-9 translate-y-full opacity-0 transition-[transform,opacity] duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
                {information}
              </div>
            </div>
            {/* Mobile: no hover dependency. Details are always shown underneath the full media. */}
            <section className="md:hidden w-full px-1 pt-7 pb-20">{information}</section>
            <p className="hidden md:block mt-3 text-[10px] text-neutral-500 tracking-wider">HOVER TO EXPLORE PROJECT DETAILS</p>
          </div>
        </div>
      </div>
      {hasPrev && <button onClick={e => { e.stopPropagation(); prev(); }} aria-label="Previous project" className="fixed z-30 left-2 md:left-5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 border border-white/20 hover:bg-neutral-800"><ChevronLeft size={20} /></button>}
      {hasNext && <button onClick={e => { e.stopPropagation(); next(); }} aria-label="Next project" className="fixed z-30 right-2 md:right-5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 border border-white/20 hover:bg-neutral-800"><ChevronRight size={20} /></button>}
    </div>
  );
};

export default ProjectViewerModal;
