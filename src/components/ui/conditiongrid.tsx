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
    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 p-1.5 sm:gap-2 sm:p-3.5 bg-gradient-to-t from-black/45 via-transparent to-transparent">
      <span className="min-w-0 max-w-[calc(100%-30px)] sm:max-w-[calc(100%-48px)] truncate rounded-md sm:rounded-lg bg-black/90 px-1.5 py-1.5 text-[10px] sm:px-3 sm:py-2 sm:text-sm font-medium text-white shadow-lg">{project.title}</span>
      <span className="flex h-7 w-7 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform group-hover:rotate-45">
        <MoveUpRight className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]"/>
      </span>
    </div>
  </motion.button>
);

/** Asymmetric editorial columns, keeping each uploaded cover's natural aspect ratio. */
export default function ConditionGrid({projects, onSelect}: ConditionGridProps) {
  const left = projects.filter((_, i) => i % 2 === 0);
  const right = projects.filter((_, i) => i % 2 === 1);
  if (!projects.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 sm:gap-4 w-full">
      <div className="sm:col-span-5 flex flex-col gap-2 sm:gap-4">
        {left.map(project => <ProjectTile key={project.id} project={project} onSelect={onSelect}/>)}
      </div>
      <div className="sm:col-span-7 flex flex-col gap-3 sm:gap-4">
        {right.map(project => <ProjectTile key={project.id} project={project} onSelect={onSelect}/>)}
      </div>
    </div>
  );
}
