import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Project, Portfolio } from '../types/portfolio';
import { INITIAL_PROJECTS, INITIAL_PORTFOLIOS } from '../data/seedData';

// Storage keys for offline / fallback persistence
const LOCAL_PROJECTS_KEY = 'editorial_work_library_projects';
const LOCAL_PORTFOLIOS_KEY = 'editorial_work_library_portfolios';
const LOCAL_SUPABASE_CONFIG_KEY = 'editorial_supabase_config';

// The authorized curator email
export const AUTHORIZED_ADMIN_EMAILS = ['munkherdenedesign@gmail.com'];

export function isAuthorizedAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return AUTHORIZED_ADMIN_EMAILS.some(admin => admin.toLowerCase() === normalized);
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function isValidSupabaseUrl(urlStr: string | null | undefined): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  const trimmed = urlStr.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
  if (trimmed.includes('MY_') || trimmed.includes('YOUR_') || trimmed.includes('<') || trimmed === 'https://') return false;
  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.length > 3 && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

// 1. Get credentials from environment or user-saved config
export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (isValidSupabaseUrl(envUrl) && envKey && !envKey.includes('MY_') && !envKey.includes('YOUR_')) {
    return { url: envUrl, anonKey: envKey };
  }

  try {
    const saved = localStorage.getItem(LOCAL_SUPABASE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (isValidSupabaseUrl(parsed.url) && parsed.anonKey && !parsed.anonKey.includes('MY_')) {
        return { url: parsed.url.trim(), anonKey: parsed.anonKey.trim() };
      }
    }
  } catch (err) {
    console.error('Failed to read saved Supabase config:', err);
  }

  return { url: '', anonKey: '' };
}

export function saveLocalSupabaseConfig(config: SupabaseConfig) {
  try {
    supabaseInstance = null; // reset cached instance
    if (!config.url || !config.anonKey) {
      localStorage.removeItem(LOCAL_SUPABASE_CONFIG_KEY);
    } else {
      localStorage.setItem(LOCAL_SUPABASE_CONFIG_KEY, JSON.stringify(config));
    }
  } catch (err) {
    console.error('Failed to save Supabase config:', err);
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!isValidSupabaseUrl(config.url) || !config.anonKey) {
    return null;
  }
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      });
    } catch (err) {
      console.warn('Could not initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return isValidSupabaseUrl(config.url) && Boolean(config.anonKey);
}

// ==========================================
// SUPABASE STORAGE UPLOADS
// Uploads images, videos, PDFs directly to 'portfolio-assets' bucket
// ==========================================

export async function uploadAssetToSupabase(file: File, folder: string = 'media'): Promise<string> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client is not configured.');
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${folder}/${Date.now()}_${cleanName}`;

  const { error: uploadError } = await client.storage
    .from('portfolio-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    console.error('Supabase storage upload error:', uploadError);
    throw new Error(`Upload to storage failed: ${uploadError.message}`);
  }

  const { data: urlData } = client.storage
    .from('portfolio-assets')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

// ==========================================
// FALLBACK LOCAL STORAGE
// Only used if Supabase is disconnected
// ==========================================

export function getLocalProjects(): Project[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local projects:', e);
  }
  return INITIAL_PROJECTS;
}

export function saveLocalProjects(projects: Project[]) {
  try {
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Error saving local projects:', e);
  }
}

export function getLocalPortfolios(): Portfolio[] {
  try {
    const raw = localStorage.getItem(LOCAL_PORTFOLIOS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading local portfolios:', e);
  }
  return INITIAL_PORTFOLIOS;
}

export function saveLocalPortfolios(portfolios: Portfolio[]) {
  try {
    localStorage.setItem(LOCAL_PORTFOLIOS_KEY, JSON.stringify(portfolios));
  } catch (e) {
    console.error('Error saving local portfolios:', e);
  }
}

// ==========================================
// UNIFIED DATA REPOSITORY WITH ROW LEVEL SECURITY
// ==========================================

export async function fetchPublishedPortfolio(slug: string): Promise<{ portfolio: Portfolio | null; projects: Project[] }> {
  const normalizedSlug = slug.replace(/^\/+/, '').replace(/^p\//, '');
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data: portData, error: portError } = await client
        .from('portfolios')
        .select('*')
        .eq('slug', normalizedSlug)
        .eq('status', 'published')
        .single();

      if (portError || !portData) {
        return { portfolio: null, projects: [] };
      }

      const portfolio: Portfolio = {
        id: portData.id,
        slug: portData.slug,
        title: portData.title,
        subtitle: portData.subtitle,
        introduction: portData.introduction,
        status: portData.status,
        projectIds: portData.project_ids || [],
        updatedAt: portData.updated_at
      };

      if (!portfolio.projectIds.length) {
        return { portfolio, projects: [] };
      }

      const { data: projData, error: projError } = await client
        .from('projects')
        .select('*')
        .in('id', portfolio.projectIds);

      if (projError || !projData) {
        return { portfolio, projects: [] };
      }

      const projectsMap = new Map<string, Project>();
      projData.forEach((row: any) => {
        projectsMap.set(row.id, {
          id: row.id,
          title: row.title,
          client: row.client,
          year: row.year,
          description: row.description,
          tags: row.tags || [],
          coverUrl: row.cover_url,
          mediaType: row.media_type,
          mediaUrl: row.media_url,
          aspectRatio: row.aspect_ratio || '16/9',
          externalLink: row.external_link,
          embedCode: row.embed_code,
          details: row.details,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        });
      });

      const orderedProjects = portfolio.projectIds
        .map(id => projectsMap.get(id))
        .filter((p): p is Project => Boolean(p));

      return { portfolio, projects: orderedProjects };
    } catch (err) {
      console.warn('Supabase fetch published portfolio error:', err);
    }
  }

  // Fallback
  const portfolios = getLocalPortfolios();
  const portfolio = portfolios.find(p => p.slug === normalizedSlug && p.status === 'published') || null;
  if (!portfolio) {
    return { portfolio: null, projects: [] };
  }

  const allProjects = getLocalProjects();
  const projectMap = new Map(allProjects.map(p => [p.id, p]));
  const orderedProjects = portfolio.projectIds
    .map(id => projectMap.get(id))
    .filter((p): p is Project => Boolean(p));

  return { portfolio, projects: orderedProjects };
}

export async function fetchAdminData(): Promise<{ portfolios: Portfolio[]; projects: Project[] }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      let [{ data: portData }, { data: projData }] = await Promise.all([
        client.from('portfolios').select('*').order('updated_at', { ascending: false }),
        client.from('projects').select('*').order('created_at', { ascending: false })
      ]);

      // If Supabase table is brand new, auto-seed with default portfolio versions
      if (!portData || portData.length === 0) {
        const seedPortRows = INITIAL_PORTFOLIOS.map(p => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          subtitle: p.subtitle,
          introduction: p.introduction,
          status: p.status,
          project_ids: p.projectIds,
          is_custom: p.isCustom || false
        }));

        await client.from('portfolios').insert(seedPortRows);
        const { data: seededPorts } = await client.from('portfolios').select('*').order('updated_at', { ascending: false });
        if (seededPorts) portData = seededPorts;
      }

      // If projects table is brand new, auto-seed with initial work library
      if (!projData || projData.length === 0) {
        const seedProjRows = INITIAL_PROJECTS.map(p => ({
          id: p.id,
          title: p.title,
          client: p.client,
          year: p.year,
          description: p.description,
          tags: p.tags,
          cover_url: p.coverUrl,
          media_type: p.mediaType,
          media_url: p.mediaUrl,
          aspect_ratio: p.aspectRatio,
          external_link: p.externalLink,
          embed_code: p.embedCode,
          details: p.details
        }));

        await client.from('projects').insert(seedProjRows);
        const { data: seededProjs } = await client.from('projects').select('*').order('created_at', { ascending: false });
        if (seededProjs) projData = seededProjs;
      }

      if (portData && projData) {
        const portfolios: Portfolio[] = portData.map((row: any) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          subtitle: row.subtitle,
          introduction: row.introduction,
          status: row.status,
          projectIds: row.project_ids || [],
          draftProjectIds: row.draft_project_ids,
          draftTitle: row.draft_title,
          draftSubtitle: row.draft_subtitle,
          draftIntroduction: row.draft_introduction,
          isCustom: row.is_custom,
          updatedAt: row.updated_at
        }));

        const projects: Project[] = projData.map((row: any) => ({
          id: row.id,
          title: row.title,
          client: row.client,
          year: row.year,
          description: row.description,
          tags: row.tags || [],
          coverUrl: row.cover_url,
          mediaType: row.media_type,
          mediaUrl: row.media_url,
          aspectRatio: row.aspect_ratio || '16/9',
          externalLink: row.external_link,
          embedCode: row.embed_code,
          details: row.details,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));

        return { portfolios, projects };
      }
    } catch (err) {
      console.warn('Falling back to local admin data:', err);
    }
  }

  return {
    portfolios: getLocalPortfolios(),
    projects: getLocalProjects()
  };
}
