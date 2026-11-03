export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- SUPABASE POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- Copy and run this script in your Supabase SQL Editor.
-- ==========================================

-- 1. Create Projects Table (Central Work Library)
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  client TEXT,
  year TEXT,
  description TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  cover_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'pdf', 'website', 'embed')),
  media_url TEXT NOT NULL,
  aspect_ratio TEXT DEFAULT '16/9',
  external_link TEXT,
  embed_code TEXT,
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Portfolios Table (Independent Portfolio Pages)
CREATE TABLE IF NOT EXISTS public.portfolios (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL, -- '' for general root '/', 'social-media', 'design', 'creator', 'web', or custom
  title TEXT NOT NULL,
  subtitle TEXT,
  introduction TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  project_ids TEXT[] DEFAULT ARRAY[]::TEXT[], -- Live published project order
  draft_project_ids TEXT[], -- Private draft project order
  draft_title TEXT,
  draft_subtitle TEXT,
  draft_introduction TEXT,
  is_custom BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- Strict protection: only published content is publicly accessible.
-- Drafts and unauthenticated writes are strictly blocked.
-- ==========================================

-- PORTFOLIOS POLICIES
-- Public can ONLY view published portfolios
CREATE POLICY "Public read published portfolios" 
ON public.portfolios 
FOR SELECT 
USING (status = 'published');

-- Authenticated Admin has full access to view, draft, insert, update, and delete
CREATE POLICY "Admin full access portfolios" 
ON public.portfolios 
FOR ALL 
TO authenticated 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- PROJECTS POLICIES
-- Public can view projects that are included in any published portfolio
CREATE POLICY "Public read published portfolio projects" 
ON public.projects 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.portfolios 
    WHERE public.portfolios.status = 'published' 
    AND public.projects.id = ANY(public.portfolios.project_ids)
  )
);

-- Authenticated Admin has full access to the entire Work Library
CREATE POLICY "Admin full access projects" 
ON public.projects 
FOR ALL 
TO authenticated 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- ==========================================
-- STORAGE BUCKET FOR UPLOADED ASSETS
-- Creates 'portfolio-assets' bucket for posters, videos, PDFs & covers
-- ==========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-assets', 'portfolio-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read assets
CREATE POLICY "Public view portfolio assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-assets');

-- Authenticated Admin can upload, update, and delete assets
CREATE POLICY "Admin upload portfolio assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'portfolio-assets');

CREATE POLICY "Admin update portfolio assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'portfolio-assets');

CREATE POLICY "Admin delete portfolio assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'portfolio-assets');
`;
