import React from 'react';
import { MoveUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import type { Project } from '../../types/portfolio';

interface ConditionGridProps {
  projects: Project[];
  onSelect: (project: Project) => void;
}

const ProjectTile: React.FC<{project: Project; onSelect: (project: Project) => void}> = ({project, onSelect}) => (
  <motion.button
    type="button"
    onClick={() => onSelect(project)}
    initial={{y: 24, opacity: 0}}
    whileInView={{y: 0, opacity: 1}}
    viewport={{once: true, amount: 0.12}}
    transition={{duration: 0.45, ease: 'easeOut'}}
    className="group relative block w-full overflow-hidden rounded-lg sm:rounded-xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-white bg-[#161619] cursor-pointer"
    aria-label={'View ' + project.title}
  >
    <img src={project.coverUrl} alt={project.title} loading="lazy"
      className="block w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.015]"/>
    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 p-1 sm:gap-2 sm:p-3.5 bg-gradient-to-t from-black/45 via-transparent to-transparent">
      <span className="min-w-0 max-w-full sm:max-w-[calc(100%-48px)] truncate rounded-md sm:rounded-lg bg-black/90 px-1 py-1 text-[9px] sm:px-3 sm:py-2 sm:text-sm font-medium text-white shadow-lg">{project.title}</span>
      <span className="flex hidden sm:flex sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform group-hover:rotate-45">
        <MoveUpRight className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]"/>
      </span>
    </div>
  </motion.button>
);

/** Group by the existing client field, retaining the editorial masonry cards. */
export default function ConditionGrid({projects, onSelect}: ConditionGridProps) {
  if (!projects.length) return null;

  const groups = new Map<string, Project[]>();
  for (const project of projects) {
    const company = project.client?.trim() || 'Independent Work';
    if (!groups.has(company)) groups.set(company, []);
    groups.get(company)!.push(project);
  }

  return (
    <div className="flex w-full flex-col gap-16 sm:gap-24">
      {Array.from(groups, ([company, companyProjects]) => (
        <section key={company} className="relative grid grid-cols-1 gap-3 sm:grid-cols-[minmax(150px,220px)_minmax(0,1fr)] sm:gap-8">
          <div className="sticky top-3 z-20 self-start sm:top-8">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#101012]/90 px-3 py-2.5 backdrop-blur-xl sm:flex-col sm:items-start sm:justify-start sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
              <h2 className="min-w-0 text-[11px] font-medium uppercase tracking-[0.1em] text-white sm:text-xs">{company}</h2>
              <span className="shrink-0 text-[10px] text-neutral-500">{String(companyProjects.length).padStart(2, '0')} PROJECTS</span>
            </div>
          </div>
          <div className="min-w-0">
            {/* Compact mobile gallery, preserving the original three-column masonry. */}
            <div className="grid grid-cols-3 gap-1.5 w-full sm:hidden">
              {[0, 1, 2].map(column => (
                <div key={column} className="flex min-w-0 flex-col gap-1.5">
                  {companyProjects.filter((_, index) => index % 3 === column).map(project => (
                    <ProjectTile key={project.id} project={project} onSelect={onSelect}/>
                  ))}
                </div>
              ))}
            </div>
            {/* Desktop gallery, retaining natural image proportions. */}
            <div className="hidden sm:grid sm:grid-cols-3 sm:gap-4 w-full">
              {[0, 1, 2].map(column => (
                <div key={column} className="flex min-w-0 flex-col gap-4">
                  {companyProjects.filter((_, index) => index % 3 === column).map(project => (
                    <ProjectTile key={project.id} project={project} onSelect={onSelect}/>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
