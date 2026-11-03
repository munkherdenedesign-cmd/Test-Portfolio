import React, { useEffect, useCallback } from 'react';
import { Project } from '../types/portfolio';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  Play,
  Sparkles,
  FolderGit2,
  HardDrive,
  Instagram,
  Youtube,
  Share2,
  ArrowUpRight
} from 'lucide-react';

interface ProjectViewerModalProps {
  project: Project | null;
  projectsList: Project[];
  onClose: () => void;
  onNavigate: (project: Project) => void;
}

export const ProjectViewerModal: React.FC<ProjectViewerModalProps> = ({
  project,
  projectsList,
  onClose,
  onNavigate,
}) => {
  const currentIndex = project ? projectsList.findIndex(p => p.id === project.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < projectsList.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) onNavigate(projectsList[currentIndex - 1]);
  }, [hasPrev, currentIndex, projectsList, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) onNavigate(projectsList[currentIndex + 1]);
  }, [hasNext, currentIndex, projectsList, onNavigate]);

  useEffect(() => {
    if (!project) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, onClose, handlePrev, handleNext]);

  if (!project) return null;

  const isInstagram = project.mediaUrl.includes('instagram.com') || (project.socialUrl && project.socialUrl.includes('instagram.com'));
  const isFacebook = project.mediaUrl.includes('facebook.com');
  const isYouTube = project.mediaUrl.includes('youtube.com') || project.mediaUrl.includes('youtu.be') || (project.socialUrl && project.socialUrl.includes('youtube.com'));
  const isTikTok = project.mediaUrl.includes('tiktok.com') || (project.socialUrl && project.socialUrl.includes('tiktok.com'));
  const isReel = project.aspectRatio === '9/16' || project.mediaUrl.includes('/reel/');

  // Determine Google Drive Link
  const driveUrl = project.googleDriveUrl || (
    project.externalLink?.includes('drive.google.com') ? project.externalLink : null
  );

  // Determine Primary Social Media Link
  const socialUrl = project.socialUrl || (
    (isInstagram || isFacebook || isYouTube || isTikTok) ? project.mediaUrl : null
  );

  // Determine Web / External Project Link
  const webUrl = (project.externalLink && !project.externalLink.includes('drive.google.com'))
    ? project.externalLink
    : (project.mediaType === 'website' ? project.mediaUrl : null);

  const renderMediaContent = () => {
    switch (project.mediaType) {
      case 'video':
        return (
          <div className="relative w-full flex items-center justify-center bg-black/80 rounded-2xl overflow-hidden p-2 border border-white/10">
            <video
              src={project.mediaUrl}
              controls
              playsInline
              autoPlay
              muted
              className={`w-auto max-w-full object-contain rounded-xl shadow-2xl ${
                project.aspectRatio === '9/16' ? 'max-h-[72vh] aspect-[9/16]' : 'max-h-[68vh]'
              }`}
            />
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full flex flex-col items-center justify-center bg-neutral-900/80 rounded-2xl border border-white/10 p-3">
            <div className="w-full h-[60vh] rounded-xl overflow-hidden bg-neutral-950">
              <iframe
                src={`${project.mediaUrl}#toolbar=0&navpanes=0`}
                title={project.title}
                className="w-full h-full border-none"
              />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <a
                href={project.mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-xs font-mono rounded-lg text-white transition-all border border-white/10"
              >
                <FileText size={13} /> Open PDF Document
              </a>
            </div>
          </div>
        );

      case 'website':
        return (
          <div className="w-full flex flex-col items-center justify-center bg-neutral-900/80 rounded-2xl border border-white/10 p-3">
            <div className="w-full flex items-center justify-between px-3 py-2 bg-neutral-950 rounded-t-xl border-b border-white/10 text-xs font-mono text-neutral-400">
              <span className="truncate max-w-md">{project.mediaUrl}</span>
              <a
                href={project.mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white flex items-center gap-1.5 transition-colors shrink-0"
              >
                Launch <ExternalLink size={12} />
              </a>
            </div>
            <div className="w-full h-[60vh] rounded-b-xl overflow-hidden bg-neutral-950">
              <iframe
                src={project.mediaUrl}
                title={project.title}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>
        );

      case 'embed':
        let embedSrc = '';
        if (project.embedCode && project.embedCode.includes('src="')) {
          const match = project.embedCode.match(/src="([^"]+)"/);
          if (match) embedSrc = match[1];
        } else if (isInstagram) {
          const cleanUrl = project.mediaUrl.trim().split('?')[0].replace(/\/+$/, '');
          embedSrc = `${cleanUrl}/embed/`;
        } else if (isFacebook) {
          const cleanUrl = project.mediaUrl.trim().split('?')[0];
          const encoded = encodeURIComponent(cleanUrl);
          embedSrc = isReel
            ? `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false`
            : `https://www.facebook.com/plugins/post.php?href=${encoded}&show_text=true`;
        }

        return (
          <div className="w-full flex flex-col items-center justify-center py-2">
            <div
              className={`w-full overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/80 flex items-center justify-center ${
                isReel
                  ? 'max-w-[380px] aspect-[9/16] min-h-[520px] max-h-[72vh]'
                  : 'max-w-[500px] aspect-square min-h-[440px] max-h-[68vh]'
              }`}
            >
              {embedSrc ? (
                <iframe
                  src={embedSrc}
                  title={project.title}
                  className="w-full h-full border-none"
                  scrolling="no"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="p-8 text-center font-mono">
                  <p className="text-sm text-neutral-400 mb-4">Embedded Content Preview</p>
                  <a
                    href={project.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-mono font-medium rounded-lg"
                  >
                    Open Post <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </div>
          </div>
        );

      case 'image':
      default:
        return (
          <div className="relative w-full flex items-center justify-center">
            <img
              src={project.mediaUrl || project.coverUrl}
              alt={project.title}
              className={`max-h-[72vh] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-white/10 ${
                project.aspectRatio === '9/16' ? 'aspect-[9/16]' : ''
              }`}
            />
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-200 p-4 md:p-6"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="absolute top-0 inset-x-0 h-14 px-6 md:px-10 flex items-center justify-between z-20 border-b border-white/10 bg-black/70 backdrop-blur-md font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">
            {currentIndex >= 0
              ? `${String(currentIndex + 1).padStart(2, '0')} / ${String(projectsList.length).padStart(2, '0')}`
              : 'Project'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider text-neutral-400 bg-white/5 border border-white/10">
            {project.mediaType}
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Arrows */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/70 hover:bg-black text-neutral-300 hover:text-white border border-white/15 backdrop-blur-md transition-all cursor-pointer shadow-lg"
          aria-label="Previous Project"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/70 hover:bg-black text-neutral-300 hover:text-white border border-white/15 backdrop-blur-md transition-all cursor-pointer shadow-lg"
          aria-label="Next Project"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Main Modal Popup Card */}
      <div
        className="w-full max-w-5xl max-h-[86vh] mt-12 bg-neutral-950/80 border border-white/10 rounded-2xl shadow-2xl p-4 md:p-6 flex flex-col lg:flex-row gap-6 items-center justify-between overflow-y-auto font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media Frame */}
        <div className="w-full lg:flex-1 flex items-center justify-center">
          {renderMediaContent()}
        </div>

        {/* Project Info & Jump-Out Actions Sidebar */}
        <div className="w-full lg:w-80 flex flex-col justify-between py-1 text-left shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
              {project.year && <span>{project.year}</span>}
              {project.client && (
                <>
                  <span>/</span>
                  <span className="text-neutral-400">{project.client}</span>
                </>
              )}
            </div>

            <h2 className="text-lg md:text-xl font-mono text-white font-semibold tracking-tight leading-snug">
              {project.title}
            </h2>

            {project.description && (
              <p className="mt-3 text-xs text-neutral-400 leading-relaxed">
                {project.description}
              </p>
            )}

            {/* Jump-Out Quick Action Buttons */}
            <div className="mt-5 pt-4 border-t border-white/10 space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1.5">
                Quick Jump
              </span>

              {/* Google Drive Jump Button */}
              {driveUrl ? (
                <a
                  href={driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white text-neutral-200 hover:text-black text-xs font-mono font-medium transition-all duration-200 border border-white/10 group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 87.3 78" fill="currentColor">
                      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA"/>
                      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00AC47"/>
                      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#EA4335"/>
                      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832D"/>
                      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684FC"/>
                      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00"/>
                    </svg>
                    <span>Google Drive</span>
                  </span>
                  <ArrowUpRight size={13} className="text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              ) : (
                /* Default Drive Jump Fallback */
                <a
                  href={`https://drive.google.com/drive/search?q=${encodeURIComponent(project.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white text-xs font-mono transition-all border border-white/10 group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HardDrive size={13} className="text-neutral-400" />
                    <span>Google Drive Assets</span>
                  </span>
                  <ArrowUpRight size={12} className="text-neutral-500 group-hover:text-white" />
                </a>
              )}

              {/* Social Media Jump Button */}
              {socialUrl && (
                <a
                  href={socialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white text-neutral-200 hover:text-black text-xs font-mono font-medium transition-all duration-200 border border-white/10 group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {isInstagram && <Instagram size={14} className="text-pink-400 group-hover:text-black" />}
                    {isYouTube && <Youtube size={14} className="text-rose-500 group-hover:text-black" />}
                    {!isInstagram && !isYouTube && <Share2 size={14} className="text-neutral-300 group-hover:text-black" />}
                    <span>{isInstagram ? 'Instagram Post' : isYouTube ? 'YouTube Channel' : 'Social Media Page'}</span>
                  </span>
                  <ArrowUpRight size={13} className="text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              )}

              {/* External / Web Destination */}
              {webUrl && (
                <a
                  href={webUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white text-xs font-mono transition-all border border-white/10 group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Globe size={13} className="text-neutral-400" />
                    <span>Live Project</span>
                  </span>
                  <ArrowUpRight size={12} className="text-neutral-500 group-hover:text-white" />
                </a>
              )}
            </div>

            {/* Deliverables / Details */}
            {project.details && (
              <div className="mt-4 pt-3 border-t border-white/10 space-y-2 text-xs">
                {project.details.role && (
                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase tracking-wider block mb-0.5">Role</span>
                    <span className="text-neutral-300">{project.details.role}</span>
                  </div>
                )}
                {project.details.deliverables && project.details.deliverables.length > 0 && (
                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase tracking-wider block mb-0.5">Deliverables</span>
                    <ul className="text-neutral-300 space-y-0.5 list-disc list-inside text-[11px]">
                      {project.details.deliverables.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1">
                {project.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-white/10 text-[10px] text-neutral-600 flex items-center justify-between">
            <span>&larr; &rarr; Navigate</span>
            <span>ESC Close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectViewerModal;
