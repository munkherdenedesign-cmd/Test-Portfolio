import { getSupabaseClient, uploadAssetToSupabase } from './supabase';

export type Experience = { id: string; company: string; role: string; period: string; image: string; location: string; socialLabel: string; socialUrl: string; color: string };
const KEY = 'portfolio_about_experiences_v1';
// Editable demo badges, not claims about actual employment.
export const SEED_EXPERIENCES: Experience[] = [
  { id: 'seed-1', company: 'Experience 01', role: 'Your job title', period: 'Start — End', image: '', location: 'Location', socialLabel: 'Instagram', socialUrl: '', color: '#8b7b6b' },
  { id: 'seed-2', company: 'Experience 02', role: 'Your job title', period: 'Start — End', image: '', location: 'Location', socialLabel: 'Instagram', socialUrl: '', color: '#61717b' },
  { id: 'seed-3', company: 'Experience 03', role: 'Your job title', period: 'Start — End', image: '', location: 'Location', socialLabel: 'Instagram', socialUrl: '', color: '#77715f' },
  { id: 'seed-4', company: 'Experience 04', role: 'Your job title', period: 'Start — End', image: '', location: 'Location', socialLabel: 'Instagram', socialUrl: '', color: '#676079' },
  { id: 'seed-5', company: 'Experience 05', role: 'Your job title', period: 'Start — End', image: '', location: 'Location', socialLabel: 'Instagram', socialUrl: '', color: '#6c7a70' }
];
export const emptyExperience = (): Experience => ({ id: crypto.randomUUID(), company: '', role: '', period: '', image: '', location: '', socialLabel: '', socialUrl: '', color: '#71717a' });
export function localExperiences(): Experience[] {
  try { const raw = localStorage.getItem(KEY); if (raw === null) return SEED_EXPERIENCES; const data = JSON.parse(raw); return Array.isArray(data) ? data.slice(0, 5) : SEED_EXPERIENCES; } catch { return SEED_EXPERIENCES; }
}
export async function loadExperiences(): Promise<Experience[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.from('about_experiences').select('items').eq('id', 1).maybeSingle();
    if (!error && data) { localStorage.setItem(KEY, JSON.stringify(data.items)); return (data.items || []).slice(0, 5); }
  }
  return localExperiences();
}
export async function saveExperiences(items: Experience[]) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Connect Supabase before publishing work experience.');
  const { error } = await client.from('about_experiences').upsert({ id: 1, items: items.slice(0, 5), updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message + ' — run supabase/about_experiences.sql in Supabase SQL Editor.');
  localStorage.setItem(KEY, JSON.stringify(items.slice(0, 5)));
}
export { uploadAssetToSupabase };
