import React, { useState, useEffect } from 'react';
import { Portfolio, Project } from '../types/portfolio';
import SphereImageGrid, { ImageData } from './SphereImageGrid';
import { ProjectViewerModal } from './ProjectViewerModal';
import { Signature } from './Signature';
import { Compass, Grid, ArrowUpRight, Shield } from 'lucide-react';

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
          <Signature
            signatureUrl={portfolio.signatureUrl}
            className="cursor-pointer"
          />
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
          /* Index Grid */
          <div className="w-full max-w-5xl my-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="group cursor-pointer rounded-xl bg-neutral-900/60 border border-white/10 hover:border-white/30 overflow-hidden transition-all duration-200 flex flex-col"
                >
                  <div className="relative aspect-[16/10] bg-black overflow-hidden">
                    <img
                      src={project.coverUrl}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/10">
                      {project.mediaType}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono text-neutral-500 mb-1">
                        <span>{project.year || '2026'}</span>
                        <span>{project.client}</span>
                      </div>
                      <h3 className="text-sm font-mono font-medium text-white">
                        {project.title}
                      </h3>
                      {project.description && (
                        <p className="mt-1.5 text-xs text-neutral-400 line-clamp-2 leading-relaxed font-mono">
                          {project.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-neutral-500 group-hover:text-white transition-colors">
                      <span>View Preview</span>
                      <ArrowUpRight size={13} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom-Center View Toggle (continuous gentle circular orbit motion) */}
      <div className="fixed bottom-6 left-1/2 z-30 animate-orbit-floating pointer-events-auto">
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-neutral-900/85 backdrop-blur-md border border-white/15 shadow-2xl shadow-black/80">
          <button
            onClick={() => setViewMode('sphere')}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              viewMode === 'sphere'
                ? 'bg-white text-black shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
            title="Sphere View"
            aria-label="Sphere View"
          >
            <Compass size={16} />
          </button>
          <button
            onClick={() => setViewMode('index')}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              viewMode === 'index'
                ? 'bg-white text-black shadow-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
            title="Index Grid View"
            aria-label="Index Grid View"
          >
            <Grid size={16} />
          </button>
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
