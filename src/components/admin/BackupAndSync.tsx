import React, { useState } from 'react';
import { getLocalProjects, getLocalPortfolios, getSupabaseClient } from '../../lib/supabase';
import type { Project } from '../../types/portfolio';

type Backup = { version: number; projects: Project[]; portfolios: unknown[] };
const dataUrlToBlob = (url: string): Blob => {
  const [header, encoded] = url.split(',');
  if (!encoded || !header.includes(';base64')) throw new Error('Invalid embedded image');
  const mime = header.match(/^data:([^;]+)/)?.[1] || 'image/jpeg';
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

export const BackupAndSync: React.FC = () => {
  const [backup, setBackup] = useState<Backup | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const download = () => {
    if (!localStorage.getItem('editorial_work_library_projects') || !localStorage.getItem('editorial_work_library_portfolios')) {
      setMessage('No saved local portfolio data found in this browser.');
      return;
    }
    const payload = { version: 1, exportedAt: new Date().toISOString(), projects: getLocalProjects(), portfolios: getLocalPortfolios() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'portfolio-backup.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const load = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Backup;
      if (parsed.version !== 1 || !Array.isArray(parsed.projects) || !Array.isArray(parsed.portfolios) || parsed.projects.some(p => !p.id || !p.title || !p.mediaType)) throw new Error('Not a valid portfolio backup.');
      setBackup(parsed);
      setMessage('Backup loaded: ' + parsed.projects.length + ' projects. Existing Supabase records will not be overwritten. Portfolio page assignments will not be changed.');
    } catch (err: any) { setBackup(null); setMessage(err.message); }
  };
  const importBackup = async () => {
    const client = getSupabaseClient();
    if (!client || !backup) return;
    setBusy(true);
    let imported = 0;
    try {
      const { data: auth, error: authError } = await client.auth.getUser();
      if (authError || !auth.user) throw new Error('Sign in to Supabase first.');
      const { data: existing, error: readError } = await client.from('projects').select('id');
      if (readError) throw readError;
      const known = new Set((existing || []).map(p => p.id));
      for (const project of backup.projects) {
        if (known.has(project.id)) continue;
        const copy: Project = { ...project };
        for (const key of ['coverUrl', 'mediaUrl'] as const) {
          const value = copy[key];
          if (typeof value === 'string' && value.startsWith('data:')) {
            const blob = dataUrlToBlob(value);
            const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
            const filePath = 'restored/' + encodeURIComponent(copy.id) + '-' + key + '.' + extension;
            const { error } = await client.storage.from('portfolio-assets').upload(filePath, blob, { contentType: blob.type, upsert: false });
            if (error && !/already exists|duplicate/i.test(error.message)) throw error;
            copy[key] = client.storage.from('portfolio-assets').getPublicUrl(filePath).data.publicUrl;
          }
        }
        const row = {
          id: copy.id, title: copy.title, client: copy.client || null, year: copy.year || null,
          description: copy.description || null, tags: copy.tags || [],
          cover_url: copy.coverUrl, media_type: copy.mediaType, media_url: copy.mediaUrl,
          aspect_ratio: copy.aspectRatio || '16/9', external_link: copy.externalLink || null,
          embed_code: copy.embedCode || null, details: copy.details || {},
          created_at: copy.createdAt || new Date().toISOString(),
          updated_at: copy.updatedAt || new Date().toISOString()
        };
        const { error } = await client.from('projects').insert(row);
        if (error) throw error;
        imported++;
      }
      setMessage('Imported ' + imported + ' projects. ' + (backup.projects.length - imported) + ' already existed. Refresh the admin dashboard to see them. Page assignments were not changed.');
    } catch (err: any) { setMessage('Import stopped after ' + imported + ' projects: ' + (err.message || String(err)) + '. You can retry safely.'); }
    finally { setBusy(false); }
  };
  return <section className="rounded-xl border border-white/20 p-4 space-y-3 mb-5">
    <h4 className="text-white font-medium">Backup & Sync to Supabase</h4>
    <p className="text-neutral-400 text-xs">Keep your original JSON backup. Import adds missing projects and uploads embedded images; it does not delete existing work or change page assignments.</p>
    <button type="button" onClick={download} className="rounded-lg bg-white text-black px-3 py-2 text-xs">Download local backup</button>
    <div><label className="text-xs text-neutral-300 block mb-1">Choose portfolio-backup.json</label><input type="file" accept=".json,application/json" onChange={e => load(e.target.files?.[0])} className="text-xs max-w-full"/></div>
    {backup && <button type="button" disabled={busy} onClick={importBackup} className="rounded-lg bg-white text-black px-3 py-2 text-xs disabled:opacity-50">{busy ? 'Importing, please wait...' : 'Import ' + backup.projects.length + ' projects to Supabase'}</button>}
    {message && <p role="status" className="text-xs text-neutral-300 break-words">{message}</p>}
  </section>;
};
