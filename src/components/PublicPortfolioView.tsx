import React, { useState, useEffect } from 'react';
import { Portfolio, Project } from '../types/portfolio';
import SphereImageGrid, { ImageData } from './SphereImageGrid';
import { ProjectViewerModal } from './ProjectViewerModal';
import { Signature } from './Signature';
import ConditionGrid from './ui/conditiongrid';
import { Compass, Grid, Shield } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { LiquidSurface } from './ui/LiquidSurface';

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
  const [viewMode, setViewMode] = useState<'sphere' | 'index'>('sphere');
  const [sphereSize, setSphereSize] = useState<number>(500);
  const reducedMotion = useReducedMotion();

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

      {/* Top Center: Signature with Exclusion Effect */}
      <header className="w-full pt-6 md:pt-8 pb-3 px-6 flex items-center justify-center relative z-20 pointer-events-none">
        <a href="/" className="pointer-events-auto inline-flex rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-white" aria-label="Go to home page" title="Home">
          <LiquidSurface className="cursor-pointer">
            <Signature signatureUrl={portfolio.signatureUrl} className="cursor-pointer" />
          </LiquidSurface>
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-10 py-2 max-w-6xl mx-auto w-full relative">
        {/* Intro (if present) */}
        {(portfolio.subtitle || portfolio.introduction) && (
          <section className="text-center max-w-md mx-auto mb-2 px-4">
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
          </section>
        )}

        {/* 3D Sphere */}
        {viewMode === 'sphere' ? (
          <div className="flex flex-col items-center w-full my-auto">
            <div className="relative flex items-center justify-center my-1">
              <SphereImageGrid
                images={sphereImages}
                containerSize={sphereSize}
                sphereRadius={sphereSize * 0.46}
                autoRotate={true}
                autoRotateSpeed={0.25}
                dragSensitivity={0.55}
                onSelectImage={handleSphereSelect}
                className="transition-all duration-300"
              />
            </div>
          </div>
        ) : (
          /* Editorial grid: preserves uploaded aspect ratios without cropping */
          <div className="w-full max-w-6xl my-4 pb-20">
            <ConditionGrid projects={projects} onSelect={setSelectedProject} />
          </div>
        )}
      </main>

      {/* Bottom view switch: liquid SVG icons and a spring-moving selection pill */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <div role="group" aria-label="Portfolio view" className="flex items-center gap-1 p-1 rounded-full bg-neutral-900/90 backdrop-blur-md border border-white/15 shadow-2xl shadow-black/80">
          {([
            { id: 'sphere' as const, label: 'Sphere View', Icon: Compass },
            { id: 'index' as const, label: 'Grid View', Icon: Grid }
          ]).map(({ id, label, Icon }) => (
            <button key={id} type="button" onClick={() => setViewMode(id)}
              title={label} aria-label={label} aria-pressed={viewMode === id}
              className={`relative isolate w-10 h-10 rounded-full flex items-center justify-center cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${viewMode === id ? 'text-black' : 'text-neutral-400 hover:text-white'}`}>
              {viewMode === id && (
                <motion.span layoutId="liquid-view-selection" className="absolute inset-0 rounded-full bg-white -z-10"
                  transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 24 }} />
              )}
              <LiquidSurface>
                <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              </LiquidSurface>
            </button>
          ))}
        </div>
      </div>

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
