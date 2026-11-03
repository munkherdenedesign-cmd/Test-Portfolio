import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Portfolio, Project } from '../types/portfolio';
import SphereImageGrid, { ImageData } from './SphereImageGrid';
import { ProjectViewerModal } from './ProjectViewerModal';
import ConditionGrid from './ui/conditiongrid';
import { Compass, Grid, Shield } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { LiquidSurface } from './ui/LiquidSurface';
import { Signature } from './Signature';

interface PublicPortfolioViewProps {
  portfolio: Portfolio;
  projects: Project[];
  previewMode?: boolean;
}

export const PublicPortfolioView: React.FC<PublicPortfolioViewProps> = ({
  portfolio,
  projects,
  previewMode = false
}) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'sphere' | 'index'>(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches ? 'index' : 'sphere');
  const [sphereSize, setSphereSize] = useState<number>(500);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const reducedMotion = useReducedMotion();
  const [hoveredView, setHoveredView] = useState<'sphere' | 'index' | null>(null);
  const [sphereCircleHovered, setSphereCircleHovered] = useState(false);
  const sphereRef = useRef<HTMLDivElement>(null);
  const signatureRef = useRef<HTMLAnchorElement>(null);
  const [signatureHoverOffset, setSignatureHoverOffset] = useState(0);
  useEffect(() => {
    if (viewMode !== 'sphere' || !sphereCircleHovered) {
      setSignatureHoverOffset(0);
      return;
    }

    let frame = 0;
    const updateSignaturePosition = () => {
      const anchor = signatureRef.current;
      const sphere = sphereRef.current;
      const signatureImage = anchor?.querySelector('img');
      if (anchor && sphere && signatureImage) {
        const visibleCircles = Array.from(sphere.querySelectorAll<HTMLElement>('[data-sphere-circle]'));
        const circleTops = visibleCircles
          .filter(circle => Number.parseFloat(getComputedStyle(circle).opacity) > 0.05)
          .map(circle => circle.getBoundingClientRect().top);
        if (circleTops.length) {
          const nearestCircleTop = Math.min(...circleTops);
          const anchorRect = anchor.getBoundingClientRect();
          // Signature's image is scaled 3x around its center; the anchor itself stays unscaled.
          const enlargedHeight = signatureImage.offsetHeight * 3;
          const anchorCenter = anchorRect.top + anchorRect.height / 2;
          const destination = nearestCircleTop - 60 - enlargedHeight / 2;
          setSignatureHoverOffset(previous =>
            Math.abs(previous - (destination - anchorCenter)) > 1 ? destination - anchorCenter : previous
          );
        }
      }
      frame = requestAnimationFrame(updateSignaturePosition);
    };
    frame = requestAnimationFrame(updateSignaturePosition);
    return () => cancelAnimationFrame(frame);
  }, [viewMode, sphereCircleHovered]);
  const handleSphereCircleHover = useCallback((hovering: boolean) => {
    setSphereCircleHovered(hovering);
  }, []);

  // Responsive sphere sizing based on window width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setSphereSize(Math.min(width - 32, 340));
      } else if (width < 1024) {
        setSphereSize(420);
      } else {
        setSphereSize(500);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (viewMode !== "sphere") setSphereCircleHovered(false);
  }, [viewMode]);

  // Transform projects to Sphere ImageData format
  const sphereImages: ImageData[] = projects.map(p => ({
    id: p.id,
    src: p.coverUrl,
    alt: p.title,
    title: p.title,
    description: p.description,
    project: p
  }));

  const handleSphereSelect = (imageData: ImageData) => {
    const proj = projects.find(p => p.id === imageData.id) || (imageData as any).project;
    if (proj) {
      setSelectedProject(proj);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#eaeaea] font-mono flex flex-col justify-between selection:bg-white selection:text-black overflow-x-hidden relative">
      {/* Draft Preview Banner */}
      {previewMode && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs py-2 px-6 flex items-center justify-between font-mono z-40">
          <span className="flex items-center gap-2">
            <Shield size={14} /> Draft Preview
          </span>
          <button
            onClick={() => window.history.back()}
            className="hover:underline text-[11px] uppercase tracking-wider"
          >
            &larr; Return to Admin
          </button>
        </div>
      )}

      {/* Real uploaded signature only; Signature has no placeholder fallback. */}
      <header className="w-full pt-6 md:pt-8 pb-3 px-6 flex items-center justify-center relative z-40 pointer-events-none">
        <a ref={signatureRef} href="/" className="pointer-events-auto inline-flex rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-white" aria-label="Go to home page" title="Home">
          <motion.span
            className="inline-flex origin-center"
            animate={{ scale: 1, y: sphereCircleHovered && viewMode === "sphere" ? signatureHoverOffset : 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          >
            <LiquidSurface className="cursor-pointer" active={sphereCircleHovered} subtle>
              <Signature signatureUrl={portfolio.signatureUrl} enlarged={viewMode === "sphere" && sphereCircleHovered} className="cursor-pointer" />
            </LiquidSurface>
          </motion.span>
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-10 pt-5 pb-4 sm:py-2 max-w-6xl mx-auto w-full relative">
        {/* Intro (if present) */}
        {(portfolio.subtitle || portfolio.introduction) && (
          <motion.section
            className="text-center max-w-md mx-auto mb-5 sm:mb-2 px-2 sm:px-4"
            animate={{ opacity: sphereCircleHovered ? 0 : 1, y: sphereCircleHovered ? 8 : 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.16, ease: 'easeOut' }}
            style={{ pointerEvents: sphereCircleHovered ? 'none' : 'auto' }}
            aria-hidden={sphereCircleHovered}
          >
            {portfolio.subtitle && (
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500 mb-1">
                {portfolio.subtitle}
              </p>
            )}
            {portfolio.introduction && (
              <p className="text-[11px] md:text-xs text-neutral-400 font-mono leading-relaxed max-w-sm mx-auto">
                {portfolio.introduction}
              </p>
            )}
          </motion.section>
        )}

        {/* 3D Sphere */}
        {viewMode === 'sphere' ? (
          <div className="flex flex-col items-center w-full my-auto">
            <div ref={sphereRef} className="relative flex items-center justify-center my-1">
              <SphereImageGrid
                images={sphereImages}
                containerSize={sphereSize}
                sphereRadius={sphereSize * 0.46}
                autoRotate={true}
                autoRotateSpeed={0.25}
                dragSensitivity={0.55}
                onSelectImage={handleSphereSelect}
                onCircleHoverChange={handleSphereCircleHover}
                className="transition-all duration-300"
              />
            </div>
          </div>
        ) : (
          /* Editorial grid: preserves uploaded aspect ratios without cropping */
          <div className="w-full max-w-[1100px] my-3 sm:my-4 pb-24 sm:pb-20">
            <ConditionGrid projects={projects} onSelect={setSelectedProject} />
          </div>
        )}
      </main>

      {/* On mobile, portal the switch outside the animated page wrapper so it stays fixed to the viewport even when the grid scrolls. */}
      {isMobile ? createPortal(<div className="fixed bottom-[max(20px,env(safe-area-inset-bottom))] sm:bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <div role="group" aria-label="Portfolio view" className="relative flex items-center gap-1 p-1 rounded-full bg-neutral-900/95 backdrop-blur-md border border-white/20 shadow-2xl shadow-black/80">
          <motion.span aria-hidden="true"
            className="absolute top-1 left-1 w-10 h-10 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.25)]"
            animate={{ x: viewMode === 'sphere' ? 0 : 44, scale: hoveredView === viewMode ? 1.16 : 1, boxShadow: hoveredView === viewMode ? "0 0 24px 6px rgba(255,255,255,0.55)" : "0 0 12px 2px rgba(255,255,255,0.16)" }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 19, mass: 0.8 }} />
          {([
            { id: 'sphere' as const, label: 'Sphere View', Icon: Compass },
            { id: 'index' as const, label: 'Grid View', Icon: Grid }
          ]).map(({ id, label, Icon }) => (
            <button key={id} type="button" onClick={() => setViewMode(id)}
              title={label} aria-label={label} aria-pressed={viewMode === id}
              onMouseEnter={() => setHoveredView(id)} onMouseLeave={() => setHoveredView(null)}
              onFocus={() => setHoveredView(id)} onBlur={() => setHoveredView(null)}
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors duration-200 ${viewMode === id ? 'text-black' : 'text-neutral-300 hover:text-white'}`}>
              {hoveredView === id && viewMode !== id && (
                <motion.span aria-hidden="true" className="absolute inset-0 rounded-full bg-white/15"
                  initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1.16, opacity: 1, boxShadow: "0 0 20px 4px rgba(255,255,255,0.28)" }}
                  exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.18 }} />
              )}
              <LiquidSurface>
                <Icon size={19} strokeWidth={2} aria-hidden="true" />
              </LiquidSurface>
            </button>
          ))}
        </div>
      </div>, document.body) : <div className="fixed bottom-[max(20px,env(safe-area-inset-bottom))] sm:bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <div role="group" aria-label="Portfolio view" className="relative flex items-center gap-1 p-1 rounded-full bg-neutral-900/95 backdrop-blur-md border border-white/20 shadow-2xl shadow-black/80">
          <motion.span aria-hidden="true"
            className="absolute top-1 left-1 w-10 h-10 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.25)]"
            animate={{ x: viewMode === 'sphere' ? 0 : 44, scale: hoveredView === viewMode ? 1.16 : 1, boxShadow: hoveredView === viewMode ? "0 0 24px 6px rgba(255,255,255,0.55)" : "0 0 12px 2px rgba(255,255,255,0.16)" }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 19, mass: 0.8 }} />
          {([
            { id: 'sphere' as const, label: 'Sphere View', Icon: Compass },
            { id: 'index' as const, label: 'Grid View', Icon: Grid }
          ]).map(({ id, label, Icon }) => (
            <button key={id} type="button" onClick={() => setViewMode(id)}
              title={label} aria-label={label} aria-pressed={viewMode === id}
              onMouseEnter={() => setHoveredView(id)} onMouseLeave={() => setHoveredView(null)}
              onFocus={() => setHoveredView(id)} onBlur={() => setHoveredView(null)}
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors duration-200 ${viewMode === id ? 'text-black' : 'text-neutral-300 hover:text-white'}`}>
              {hoveredView === id && viewMode !== id && (
                <motion.span aria-hidden="true" className="absolute inset-0 rounded-full bg-white/15"
                  initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1.16, opacity: 1, boxShadow: "0 0 20px 4px rgba(255,255,255,0.28)" }}
                  exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.18 }} />
              )}
              <LiquidSurface>
                <Icon size={19} strokeWidth={2} aria-hidden="true" />
              </LiquidSurface>
            </button>
          ))}
        </div>
      </div>}

      {/* Project Viewer Popup Modal */}
      {selectedProject && (
        <ProjectViewerModal
          project={selectedProject}
          projectsList={projects}
          onClose={() => setSelectedProject(null)}
          onNavigate={(p) => setSelectedProject(p)}
        />
      )}
    </div>
  );
};

export default PublicPortfolioView;
