import React, { useState, useRef } from 'react';
import { Project, MediaType, AspectRatio, Portfolio } from '../../types/portfolio';
import { uploadAssetToSupabase, isSupabaseConfigured } from '../../lib/supabase';
import { parseSocialOrMediaUrl } from '../../lib/socialMediaParser';
import {
  Plus,
  Upload,
  Link as LinkIcon,
  Check,
  Loader2,
  Sparkles,
  X
} from 'lucide-react';

interface SimpleAddProjectProps {
  portfolios: Portfolio[];
  activeRoleFilter: string; // 'all' or portfolio.id
  onAddProject: (project: Project, assignedPortfolioIds: string[]) => Promise<void> | void;
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';

export const SimpleAddProject: React.FC<SimpleAddProjectProps> = ({
  portfolios,
  activeRoleFilter,
  onAddProject
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [title, setTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('embed');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16/9');
  const [embedCode, setEmbedCode] = useState('');
  const [detectedBadge, setDetectedBadge] = useState<string | null>(null);

  // Selected portfolio roles
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(() => {
    if (activeRoleFilter !== 'all') {
      return [activeRoleFilter];
    }
    return portfolios.map(p => p.id);
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect URL on paste/type
  const handleUrlInput = (val: string) => {
    setInputUrl(val);
    if (!val.trim()) {
      setDetectedBadge(null);
      setMediaUrl('');
      return;
    }

    const parsed = parseSocialOrMediaUrl(val);
    if (parsed) {
      setDetectedBadge(`${parsed.label} (${parsed.aspectRatio})`);
      setTitle(prev => prev || parsed.suggestedTitle);
      setMediaType(parsed.mediaType);
      setMediaUrl(parsed.originalUrl);
      setAspectRatio(parsed.aspectRatio);
      setEmbedCode(parsed.embedCode);
      if (parsed.thumbnailUrl) setCoverUrl(parsed.thumbnailUrl);
    } else {
      setDetectedBadge('Link');
      setMediaUrl(val);
      setMediaType('website');
      if (!title) {
        try {
          const u = new URL(val);
          setTitle(u.hostname.replace('www.', ''));
        } catch {
          setTitle('Web Project');
        }
      }
    }
  };

  // Quick file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let finalUrl = '';
      if (isSupabaseConfigured()) {
        finalUrl = await uploadAssetToSupabase(file, 'media');
      } else {
        finalUrl = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(file);
        });
      }

      setMediaUrl(finalUrl);
      setCoverUrl(finalUrl);
      setInputUrl(file.name);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }

      if (file.type.startsWith('video/')) {
        setMediaType('video');
        setAspectRatio('16/9');
        setDetectedBadge('Video MP4');
      } else if (file.type === 'application/pdf') {
        setMediaType('pdf');
        setAspectRatio('16/9');
        setDetectedBadge('PDF Document');
      } else {
        setMediaType('image');
        setAspectRatio('auto');
        setDetectedBadge('Image');
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleRole = (pId: string) => {
    setSelectedRoleIds(prev =>
      prev.includes(pId) ? prev.filter(id => id !== pId) : [...prev, pId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !inputUrl.trim()) return;

    setIsSubmitting(true);
    const now = new Date().toISOString();
    const finalTitle = title.trim() || inputUrl.trim() || 'Untitled Project';
    const finalCover = coverUrl.trim() || mediaUrl.trim() || DEFAULT_COVER;
    const finalMedia = mediaUrl.trim() || inputUrl.trim() || finalCover;

    const isDrive = inputUrl.includes('drive.google.com');
    const isSocial = inputUrl.includes('instagram.com') || inputUrl.includes('facebook.com') || inputUrl.includes('youtube.com') || inputUrl.includes('tiktok.com');

    const newProj: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: finalTitle,
      year: new Date().getFullYear().toString(),
      coverUrl: finalCover,
      mediaType,
      mediaUrl: finalMedia,
      aspectRatio,
      externalLink: inputUrl.startsWith('http') ? inputUrl : undefined,
      googleDriveUrl: isDrive ? inputUrl : undefined,
      socialUrl: isSocial ? inputUrl : undefined,
      embedCode: embedCode || undefined,
      createdAt: now,
      updatedAt: now
    };

    const targetRoles = selectedRoleIds.length > 0 ? selectedRoleIds : portfolios.map(p => p.id);
    await onAddProject(newProj, targetRoles);

    // Reset Form
    setInputUrl('');
    setTitle('');
    setMediaUrl('');
    setCoverUrl('');
    setDetectedBadge(null);
    setEmbedCode('');
    setIsSubmitting(false);
  };

  return (
    <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4 md:p-5 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Row 1: Unified URL / Upload Input + Title + Add Button */}
        <div className="flex flex-col md:flex-row gap-2.5">
          {/* Link or File Input */}
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={inputUrl}
              onChange={e => handleUrlInput(e.target.value)}
              placeholder="Paste Instagram, Facebook, video or web URL..."
              className="w-full bg-black/60 border border-white/15 rounded-xl pl-4 pr-24 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
            />

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/mp4,video/webm,application/pdf"
              onChange={handleFileChange}
            />

            {/* Right inside icons: Upload button */}
            <div className="absolute right-2 flex items-center gap-1">
              {inputUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setInputUrl('');
                    setMediaUrl('');
                    setDetectedBadge(null);
                  }}
                  className="p-1 text-neutral-500 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                title="Upload Image, Video or PDF"
              >
                {isUploading ? (
                  <Loader2 size={12} className="animate-spin text-white" />
                ) : (
                  <Upload size={12} />
                )}
                <span>Upload</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="w-full md:w-64">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Project Title"
              className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-medium"
            />
          </div>

          {/* Add Button */}
          <button
            type="submit"
            disabled={isSubmitting || (!inputUrl.trim() && !title.trim())}
            className="px-5 py-2.5 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-40 shrink-0"
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin text-black" />
            ) : (
              <Plus size={14} className="text-black stroke-[3]" />
            )}
            <span>Add Project</span>
          </button>
        </div>

        {/* Row 2: Detected Badge + Quick Role Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider">Publish to:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {portfolios.map(port => {
                const isChecked = selectedRoleIds.includes(port.id);
                return (
                  <button
                    type="button"
                    key={port.id}
                    onClick={() => toggleRole(port.id)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-white text-black border-white font-medium'
                        : 'bg-black/40 text-neutral-400 border-white/10 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {port.title}
                  </button>
                );
              })}
            </div>
          </div>

          {detectedBadge && (
            <div className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/20">
              <Sparkles size={11} />
              <span>{detectedBadge}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
