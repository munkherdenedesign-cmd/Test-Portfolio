import { Project, Portfolio } from '../types/portfolio';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'Aura Spatial Sound',
    client: 'Aura Audio Lab',
    year: '2026',
    description: 'Generative sound identity and visual brand system for next-generation spatial acoustics hardware.',
    tags: ['Identity', 'Motion', 'Hardware'],
    coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=85',
    aspectRatio: '16/9',
    googleDriveUrl: 'https://drive.google.com/drive/folders/1AuraSpatialSoundAssets',
    socialUrl: 'https://www.instagram.com',
    details: {
      role: 'Creative Director & Visual System',
      deliverables: ['Brand Guidelines', '3D Package Renders', 'Interactive Soundscape'],
      credits: 'Sound design in collaboration with Studio Resonate'
    },
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z'
  },
  {
    id: 'proj-2',
    title: 'Monolith Magazine — Issue 09',
    client: 'Monolith Press Zurich',
    year: '2025',
    description: 'Editorial design, custom typographic treatment, and bilingual layout for contemporary architectural criticism.',
    tags: ['Editorial', 'Print', 'Typography'],
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    mediaType: 'pdf',
    mediaUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    aspectRatio: '3/4',
    googleDriveUrl: 'https://drive.google.com/drive/folders/1MonolithPressPrintProofs',
    externalLink: 'https://monolithpress.example',
    details: {
      role: 'Editorial Lead & Typographer',
      deliverables: ['240-page Hardcover', 'Digital PDF Archive', 'Exhibition Poster'],
      credits: 'Photography by Kenji Takahashi'
    },
    createdAt: '2025-11-20T12:00:00Z',
    updatedAt: '2025-11-20T12:00:00Z'
  },
  {
    id: 'proj-3',
    title: 'Kinetic Fashion Film',
    client: 'Maison Noir Atelier',
    year: '2026',
    description: 'Autumn/Winter digital campaign celebrating slow-fashion tactile craftsmanship through cinematic macro videography.',
    tags: ['Video', 'Direction', 'Fashion'],
    coverUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    aspectRatio: '16/9',
    googleDriveUrl: 'https://drive.google.com/drive/folders/1MaisonNoirRawFootage',
    socialUrl: 'https://www.instagram.com',
    details: {
      role: 'Director of Photography & Colorist',
      deliverables: ['60s Campaign Film', 'Vertical Reels Cutdown', 'Key Visuals'],
      credits: 'Styling by Sarah Jenkins'
    },
    createdAt: '2026-02-04T14:30:00Z',
    updatedAt: '2026-02-04T14:30:00Z'
  },
  {
    id: 'proj-4',
    title: 'Verve Minimalist E-Commerce',
    client: 'Verve Ceramics Copenhagen',
    year: '2026',
    description: 'High-performance headless e-commerce experience designed with bespoke micro-interactions and editorial curation.',
    tags: ['Web Design', 'Full-Stack', 'E-Commerce'],
    coverUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    mediaType: 'website',
    mediaUrl: 'https://example.com',
    aspectRatio: '16/9',
    googleDriveUrl: 'https://drive.google.com/drive/folders/1VerveCeramicsDeliverables',
    externalLink: 'https://example.com',
    details: {
      role: 'Lead UI/UX Designer & Frontend Engineer',
      deliverables: ['Design System', 'Custom Checkout Flow', 'Inventory CMS'],
      credits: 'Developed in React & Tailwind'
    },
    createdAt: '2026-01-28T09:15:00Z',
    updatedAt: '2026-01-28T09:15:00Z'
  },
  {
    id: 'proj-5',
    title: 'Social Capsule: Solstice Launch',
    client: 'Nordic Skincare Co.',
    year: '2026',
    description: 'Multi-platform social campaign spanning 12 TikTok & Instagram reels, carousel guides, and community AR filters.',
    tags: ['Social Media', 'Content Strategy', 'Campaign'],
    coverUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    mediaType: 'embed',
    mediaUrl: 'https://www.instagram.com',
    googleDriveUrl: 'https://drive.google.com/drive/folders/1NordicSkincareSocialAssets',
    socialUrl: 'https://www.instagram.com',
    embedCode: `<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="https://www.instagram.com/p/DF9Example/" data-instgrm-version="14" style="background:#FFF; border:0; border-radius:12px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%;"><div style="padding:16px;"><div style="display:flex; flex-direction:row; align-items:center;"><div style="background-color:#F4F4F4; border-radius:50%; flex-grow:0; height:40px; margin-right:14px; width:40px;"></div><div style="display:flex; flex-direction:column; flex-grow:1; justify-content:center;"><div style="background-color:#F4F4F4; border-radius:4px; flex-grow:0; height:14px; margin-bottom:6px; width:100px;"></div><div style="background-color:#F4F4F4; border-radius:4px; flex-grow:0; height:14px; width:60px;"></div></div></div><div style="padding:19% 0;"></div><div style="display:block; height:50px; margin:0 auto 12px; width:50px;"><div style="text-align:center; font-family:sans-serif; color:#777; font-size:14px;">Solstice Social Campaign • 1.2M Impressions</div></div></div></blockquote>`,
    aspectRatio: '9/16',
    details: {
      role: 'Content Creator & Creative Strategist',
      deliverables: ['12 Reels / TikToks', '6 Micro-Carousels', 'Paid Ads Creative'],
      credits: 'Organic Reach +340%'
    },
    createdAt: '2026-02-12T16:00:00Z',
    updatedAt: '2026-02-12T16:00:00Z'
  },
  {
    id: 'proj-6',
    title: 'Archive Typography Poster Series',
    client: 'Design Biennial Basel',
    year: '2025',
    description: 'Silkscreen poster trilogy exploring brutalist structural geometry and modernist Swiss grid deviations.',
    tags: ['Poster', 'Screenprint', 'Typography'],
    coverUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1600&q=85',
    aspectRatio: '2/3',
    googleDriveUrl: 'https://drive.google.com/drive/folders/1BaselPosterHiResVectorPdfs',
    details: {
      role: 'Graphic Designer & Printmaker',
      deliverables: ['A1 Limited Edition Prints', 'Typographic Specimen', 'Exhibition Catalogue']
    },
    createdAt: '2025-10-05T08:00:00Z',
    updatedAt: '2025-10-05T08:00:00Z'
  },
  {
    id: 'proj-7',
    title: 'Ephemeral Worlds 3D Series',
    client: 'Metaspace Arts Collective',
    year: '2026',
    description: 'Curated 3D procedural compositions rendered in high dynamic range for digital installations.',
    tags: ['3D CGI', 'Digital Art', 'Lighting'],
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=85',
    aspectRatio: '1/1',
    googleDriveUrl: 'https://drive.google.com/drive/folders/1EphemeralWorlds3DAssets',
    details: {
      role: '3D Artist & Art Director',
      deliverables: ['8 Ultra-Res Wallpapers', '4K Loop Displays', 'Collector NFT Series']
    },
    createdAt: '2026-02-20T11:45:00Z',
    updatedAt: '2026-02-20T11:45:00Z'
  },
  {
    id: 'proj-8',
    title: 'Studio Monograph Document',
    client: 'Self-Initiated',
    year: '2026',
    description: 'Comprehensive 80-page design process documentation detailing methodologies, sketches, and case studies.',
    tags: ['Process', 'Monograph', 'PDF'],
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
    mediaType: 'pdf',
    mediaUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    aspectRatio: '3/4',
    googleDriveUrl: 'https://drive.google.com/drive/folders/1StudioMonographCompletePdf',
    details: {
      role: 'Author & Layout Designer',
      deliverables: ['Interactive PDF Monograph', 'Case Study Index']
    },
    createdAt: '2026-01-05T13:20:00Z',
    updatedAt: '2026-01-05T13:20:00Z'
  },
  {
    id: 'proj-9',
    title: 'Creator Studio: Vertical Storytelling',
    client: 'Substack & YouTube Creators',
    year: '2026',
    description: 'Series of short-form vertical editorial videos examining design history, industrial ergonomics, and culture.',
    tags: ['Creator', 'Video', 'Culture'],
    coverUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    aspectRatio: '9/16',
    googleDriveUrl: 'https://drive.google.com/drive/folders/1VerticalStorytellingClips',
    socialUrl: 'https://www.youtube.com',
    details: {
      role: 'Creator, Host & Editor',
      deliverables: ['Weekly Video Essays', 'Community Newsletter', 'Resource Kit']
    },
    createdAt: '2026-02-18T15:10:00Z',
    updatedAt: '2026-02-18T15:10:00Z'
  },
  {
    id: 'proj-10',
    title: 'Prism Architectural Monolith',
    client: 'Studio Kura Architecture',
    year: '2025',
    description: 'Minimalist web exhibition platform featuring horizontal scroll canvas, blueprint overlays, and high-fidelity project cards.',
    tags: ['Web Design', 'WebGL', 'Architecture'],
    coverUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    mediaType: 'website',
    mediaUrl: 'https://example.com',
    aspectRatio: '16/9',
    googleDriveUrl: 'https://drive.google.com/drive/folders/1PrismArchitecturalFloorplans',
    externalLink: 'https://example.com',
    details: {
      role: 'UI/UX & Creative Technologist',
      deliverables: ['Responsive Web Experience', 'Interactive Floorplans', 'Case Study Gallery']
    },
    createdAt: '2025-12-08T18:00:00Z',
    updatedAt: '2025-12-08T18:00:00Z'
  }
];

export const INITIAL_PORTFOLIOS: Portfolio[] = [
  {
    id: 'port-general',
    slug: '',
    title: 'Selected Works & Archive',
    subtitle: 'Well, hello there.',
    introduction: 'A comprehensive cross-disciplinary curation exploring spatial identities, physical publications, kinetic media, and interactive digital systems. Built with precision and deliberate editorial tension.',
    status: 'published',
    projectIds: ['proj-1', 'proj-3', 'proj-2', 'proj-4', 'proj-7', 'proj-6', 'proj-9', 'proj-10'],
    updatedAt: '2026-02-25T12:00:00Z'
  },
  {
    id: 'port-social-media',
    slug: 'social-media',
    title: 'Social Media',
    subtitle: 'Campaigns, Short-Form Kinetic Media & Community',
    introduction: 'High-impact social narratives, multi-format brand campaigns, and data-informed visual storytelling designed to build cultural resonance and active audiences.',
    status: 'published',
    projectIds: ['proj-5', 'proj-3', 'proj-9', 'proj-1'],
    updatedAt: '2026-02-22T10:00:00Z'
  },
  {
    id: 'port-design',
    slug: 'design',
    title: 'Graphic Design',
    subtitle: 'Editorial Typography, Physical Monograph & Brand Systems',
    introduction: 'Rooted in Swiss modernist typography, rigorous editorial grids, and tactile print craft. Crafting indelible visual identities that transcend fleeting digital trends.',
    status: 'published',
    projectIds: ['proj-2', 'proj-6', 'proj-1', 'proj-8', 'proj-7'],
    updatedAt: '2026-02-20T14:00:00Z'
  },
  {
    id: 'port-creator',
    slug: 'creator',
    title: 'Content Creator',
    subtitle: 'Video Essays, Visual Production & Community Direction',
    introduction: 'Original visual narratives, educational essays on industrial design, and episodic vertical video formats crafted with cinematic lighting and nuanced soundscapes.',
    status: 'published',
    projectIds: ['proj-9', 'proj-3', 'proj-5', 'proj-7'],
    updatedAt: '2026-02-18T16:00:00Z'
  },
  {
    id: 'port-web',
    slug: 'web',
    title: 'Web Design',
    subtitle: 'Interactive Interfaces, Kinetic Web & Architecture',
    introduction: 'Bespoke web applications, experimental digital canvases, and high-performance digital flagship destinations engineered with clean typographic rhythm and fluid physics.',
    status: 'published',
    projectIds: ['proj-4', 'proj-10', 'proj-1'],
    updatedAt: '2026-02-16T11:00:00Z'
  }
];
