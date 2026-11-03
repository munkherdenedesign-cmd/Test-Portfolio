export type MediaType = 'image' | 'video' | 'pdf' | 'website' | 'embed';

export type AspectRatio = 'auto' | '16/9' | '9/16' | '4/3' | '1/1' | '3/4' | '2/3';

export interface Project {
  id: string;
  title: string;
  client?: string;
  year?: string;
  description?: string;
  tags?: string[];
  coverUrl: string; // Used as sphere thumbnail and grid cover
  mediaType: MediaType;
  mediaUrl: string; // Direct image/video URL, PDF URL, Website URL, or Embed source
  aspectRatio?: AspectRatio;
  externalLink?: string;
  embedCode?: string; // HTML snippet or embed iframe for Instagram, Facebook, TikTok, Vimeo
  googleDriveUrl?: string; // Jump link for Google Drive assets/footage/folder
  socialUrl?: string;      // Jump link for Instagram / TikTok / YouTube / X
  behanceUrl?: string;     // Jump link for Behance / Dribbble
  figmaUrl?: string;       // Jump link for Figma prototype
  details?: {
    role?: string;
    deliverables?: string[];
    credits?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Portfolio {
  id: string;
  slug: string; // '' for root '/', 'social-media', 'design', 'creator', 'web', or custom
  title: string;
  subtitle?: string;
  introduction: string;
  signatureUrl?: string; // URL or data URI of custom signature PNG/SVG
  status: 'published' | 'draft';
  projectIds: string[]; // Ordered list of project IDs published
  draftProjectIds?: string[]; // Staged project IDs
  draftTitle?: string;
  draftSubtitle?: string;
  draftIntroduction?: string;
  draftSignatureUrl?: string;
  isCustom?: boolean;
  updatedAt: string;
}

export interface SphereProjectItem {
  id: string;
  src: string;
  alt: string;
  title: string;
  description?: string;
  project: Project;
}
