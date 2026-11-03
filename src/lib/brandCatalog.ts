import { getSupabaseClient } from './supabase';

const KEY = 'portfolio_brand_catalog';
const normalize = (names: string[]) => Array.from(new Map(names.map(s => s.trim()).filter(Boolean).map(s => [s.toLocaleLowerCase(), s])).values()).sort((a,b) => a.localeCompare(b));
export const splitBrands = (value?: string) => (value || '').split(',').map(s => s.trim()).filter(Boolean);
export const getLocalBrands = (): string[] => {
  try { return normalize(JSON.parse(localStorage.getItem(KEY) || '[]')); }
  catch { return []; }
};
export const saveLocalBrands = (brands: string[]) => localStorage.setItem(KEY, JSON.stringify(normalize(brands)));
export const getBrandOptions = (projects: {client?: string}[], saved: string[] = []) =>
  normalize([...saved, ...projects.flatMap(p => splitBrands(p.client))]);

export async function fetchBrandCatalog(): Promise<string[]> {
  const local = getLocalBrands();
  const client = getSupabaseClient();
  if (!client) return local;
  const { data, error } = await client.from('portfolio_brands').select('name').order('name');
  if (error) return local; // Old deployments work before the optional table is installed.
  const names = normalize([...local, ...(data || []).map(row => row.name)]);
  saveLocalBrands(names);
  return names;
}
export async function addBrand(name: string): Promise<void> {
  const cleaned = name.trim().replace(/,/g, '');
  if (!cleaned || cleaned.length > 100) throw new Error('Enter a brand name under 100 characters.');
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.from('portfolio_brands').upsert({name: cleaned}, {onConflict: 'name', ignoreDuplicates: true});
    if (error) throw new Error('Brand could not be saved to Supabase. Run the brand catalog SQL setup first.');
  }
  saveLocalBrands([...getLocalBrands(), cleaned]);
}
export async function removeBrand(name: string): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.from('portfolio_brands').delete().eq('name', name);
    if (error) throw new Error('Brand could not be deleted from Supabase.');
  }
  saveLocalBrands(getLocalBrands().filter(s => s !== name));
}
