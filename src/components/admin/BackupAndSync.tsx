import React from 'react';
import { getLocalProjects, getLocalPortfolios } from '../../lib/supabase';

export const BackupAndSync: React.FC = () => {
  const download = () => {
    const projectsRaw = localStorage.getItem('editorial_work_library_projects');
    const portfoliosRaw = localStorage.getItem('editorial_work_library_portfolios');
    if (!projectsRaw || !portfoliosRaw) {
      alert('No saved local portfolio data found in this browser. Do not migrate default seed data.');
      return;
    }
    const payload = { version: 1, exportedAt: new Date().toISOString(), projects: getLocalProjects(), portfolios: getLocalPortfolios() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  return <section className="rounded-xl border border-white/20 p-4 space-y-2"><h4 className="text-white font-medium">Backup & Sync to Supabase</h4><p className="text-neutral-400 text-xs">Download a backup of your locally saved projects and page assignments before connecting Supabase. Keep this file safe; do not redeploy until migration is ready.</p><button type="button" onClick={download} className="rounded-lg bg-white text-black px-3 py-2 text-xs">Download local backup</button></section>;
};
