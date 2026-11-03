import { getSupabaseClient, uploadAssetToSupabase } from './supabase';

export type Experience = { id: string; company: string; role: string; period: string; image: string; location: string; socialLabel: string; socialUrl: string; description?: string; keywords?: string[]; color: string };
const KEY = 'portfolio_about_experiences_v1';
// Editable demo badges, not claims about actual employment.
export const SEED_EXPERIENCES: Experience[] = [
  { id: 'seed-1', company: 'Experience 01', role: 'Your job title', period: 'Start — End', image: '', location: 'Location', socialLabel: 'Instagram', socialUrl: '', color: '#8b7b6b' },
  { id: 'seed-2', company: 'Experience 02', role: 'Your job title', period: 'Start — End', image: '', location: 'Location', socialLabel: 'Instagram', socialUrl: '', color: '#61717b' },
  { id: 'seed-3', company: 'Experience 03', role: 'Your job title', period: 'Start — End', image: '', location: 'Location', socialLabel: 'Instagram', socialUrl: '', color: '#77715f' },
  { id: 'seed-4', company: 'Experience 04', role: 'Your job title', period: 'Start — End', image: '', location: 'Location', socialLabel: 'Instagram', socialUrl: '', color: '#676079' },
  { id: 'seed-5', company: 'Experience 05', role: 'Your job title', period: 'Start — End', image: '', location: 'Location', socialLabel: 'Instagram', socialUrl: '', color: '#6c7a70' }
];
export const emptyExperience = (): Experience => ({ id: crypto.randomUUID(), company: '', role: '', period: '', image: '', location: '', socialLabel: '', socialUrl: '', description: '', keywords: ['', '', ''], color: '#71717a' });
export type AboutIntro = { eyebrow: string; heading: string; description: string };
export const DEFAULT_ABOUT_INTRO: AboutIntro = {
  eyebrow: 'A LITTLE ABOUT ME',
  heading: 'I skipped the usual route.',
  description: 'I jumped straight into content and marketing after high school. Creativity led the way — from ideas and visuals to stories worth sharing.'
};
const INTRO_ID = '__about_intro__';
const INTRO_KEY = 'portfolio_about_intro_v1';
type StoredIntro = AboutIntro & { id: string };
function isIntro(value: any): value is StoredIntro { return value?.id === INTRO_ID; }
function splitStored(value: unknown): { items: Experience[]; intro: AboutIntro } {
  const array = Array.isArray(value) ? value : [];
  const stored = array.find(isIntro);
  return {
    items: array.filter((entry: any) => !isIntro(entry)).slice(0, 5) as Experience[],
    intro: stored ? { eyebrow: stored.eyebrow ?? DEFAULT_ABOUT_INTRO.eyebrow, heading: stored.heading ?? DEFAULT_ABOUT_INTRO.heading, description: stored.description ?? DEFAULT_ABOUT_INTRO.description } : DEFAULT_ABOUT_INTRO
  };
}
function localStored(): any[] {
  try { const raw = localStorage.getItem(KEY); return raw === null ? SEED_EXPERIENCES : JSON.parse(raw); }
  catch { return SEED_EXPERIENCES; }
}
export function localExperiences(): Experience[] { return splitStored(localStored()).items; }
export function localAboutIntro(): AboutIntro {
  try { return JSON.parse(localStorage.getItem(INTRO_KEY) || 'null') || splitStored(localStored()).intro; }
  catch { return DEFAULT_ABOUT_INTRO; }
}
export async function loadAboutData(): Promise<{ items: Experience[]; intro: AboutIntro }> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.from('about_experiences').select('items').eq('id', 1).maybeSingle();
    if (!error && data) {
      const parsed = splitStored(data.items);
      localStorage.setItem(KEY, JSON.stringify(data.items));
      localStorage.setItem(INTRO_KEY, JSON.stringify(parsed.intro));
      return parsed;
    }
  }
  return { items: localExperiences(), intro: localAboutIntro() };
}
export async function loadExperiences(): Promise<Experience[]> { return (await loadAboutData()).items; }
export async function loadAboutIntro(): Promise<AboutIntro> { return (await loadAboutData()).intro; }
export async function saveAboutData(items: Experience[], intro: AboutIntro) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Connect Supabase before publishing About page changes.');
  const stored = [...items.slice(0, 5), { id: INTRO_ID, ...intro }];
  const { error } = await client.from('about_experiences').upsert({ id: 1, items: stored, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message + ' — check the About experiences table and admin permissions.');
  localStorage.setItem(KEY, JSON.stringify(stored));
  localStorage.setItem(INTRO_KEY, JSON.stringify(intro));
}
export async function saveExperiences(items: Experience[]) {
  await saveAboutData(items, await loadAboutIntro());
}
export { uploadAssetToSupabase };
