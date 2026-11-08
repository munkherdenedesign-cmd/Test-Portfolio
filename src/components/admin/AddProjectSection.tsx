import React, { useState, useEffect, useRef } from 'react';
import { Project, MediaType, AspectRatio, Portfolio } from '../../types/portfolio';
import { uploadAssetToSupabase, isSupabaseConfigured } from '../../lib/supabase';
import { parseSocialOrMediaUrl, ParsedMediaLink } from '../../lib/socialMediaParser';
import { extractSocialCover, isSocialCoverUrl } from '../../lib/reelCover';
import {
  Plus,
  Link as LinkIcon,
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  Globe,
  Sparkles,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

interface AddProjectSectionProps {
  portfolios: Portfolio[];
  onAddProject: (project: Project, assignedPortfolioIds: string[]) => Promise<void> | void;
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';

export const AddProjectSection: React.FC<AddProjectSectionProps> = ({
  portfolios,
  onAddProject
}) => {
  const [entryMode, setEntryMode] = useState<'link' | 'upload'>('link');
  const [pastedUrl, setPastedUrl] = useState('');
  const [detectedMedia, setDetectedMedia] = useState<ParsedMediaLink | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [description, setDescription] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('embed');
  const [mediaUrl, setMediaUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16/9');
  const [tagsInput, setTagsInput] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [embedCode, setEmbedCode] = useState('');

  // Selected Portfolios (defaults to all or first few)
  const [assignedPortfolioIds, setAssignedPortfolioIds] = useState<string[]>(() => {
    return portfolios.map(p => p.id);
  });

  // UI state
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [autoCoverLoading, setAutoCoverLoading] = useState(false);
  const [autoCoverError, setAutoCoverError] = useState('');
  const coverRequest = useRef(0);

  useEffect(() => {
    if (!isSocialCoverUrl(pastedUrl) || coverUrl || autoCoverError) return;
    const id = ++coverRequest.current;
    const timer = window.setTimeout(async () => {
      setAutoCoverLoading(true);
      try {
        const image = await extractSocialCover(pastedUrl);
        if (id === coverRequest.current) setCoverUrl(image);
      } catch (error) {
        if (id === coverRequest.current) setAutoCoverError(error instanceof Error ? error.message : 'Cover unavailable. Upload one instead.');
      } finally {
        if (id === coverRequest.current) setAutoCoverLoading(false);
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [pastedUrl, coverUrl, autoCoverError]);

  // Auto-detect URL
  const handleUrlChange = (url: string) => {
    coverRequest.current++;
    setAutoCoverError('');
    setCoverUrl('');
    setPastedUrl(url);
    if (!url.trim()) {
      setDetectedMedia(null);
      return;
    }

    const parsed = parseSocialOrMediaUrl(url);
    if (parsed) {
      setDetectedMedia(parsed);
      setTitle(prev => prev || parsed.suggestedTitle);
      setMediaType(parsed.mediaType);
      setMediaUrl(parsed.originalUrl);
      setAspectRatio(parsed.aspectRatio);
      setEmbedCode(parsed.embedCode);
      setExternalLink(parsed.originalUrl);
      if (parsed.thumbnailUrl && !coverUrl) {
        setCoverUrl(parsed.thumbnailUrl);
      }
    } else {
      setDetectedMedia(null);
      setMediaUrl(url);
      setExternalLink(url);
    }
  };

  // Upload file helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'cover' | 'media') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === 'cover') { coverRequest.current++; setAutoCoverError(''); setUploadingCover(true); }
    if (target === 'media') setUploadingMedia(true);

    try {
      let finalUrl = '';
      if (isSupabaseConfigured()) {
        finalUrl = await uploadAssetToSupabase(file, target === 'cover' ? 'covers' : 'media');
      } else {
        // Fallback data URL if storage is not yet connected
        finalUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      if (target === 'cover') {
        setCoverUrl(finalUrl);
      } else {
        setMediaUrl(finalUrl);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
        }
        if (file.type.startsWith('video/')) {
          setMediaType('video');
          setAspectRatio('16/9');
        } else if (file.type === 'application/pdf') {
          setMediaType('pdf');
          setAspectRatio('16/9');
        } else if (file.type.startsWith('image/')) {
          setMediaType('image');
          if (!coverUrl) setCoverUrl(finalUrl);
        }
      }
    } catch (err: any) {
      console.error('File upload error:', err);
    } finally {
      if (target === 'cover') setUploadingCover(false);
      if (target === 'media') setUploadingMedia(false);
    }
  };

  const togglePortfolio = (portfolioId: string) => {
    setAssignedPortfolioIds(prev =>
      prev.includes(portfolioId)
        ? prev.filter(id => id !== portfolioId)
        : [...prev, portfolioId]
    );
  };

  const selectAllPortfolios = () => {
    setAssignedPortfolioIds(portfolios.map(p => p.id));
  };

  const clearAllPortfolios = () => {
    setAssignedPortfolioIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    const now = new Date().toISOString();
    const finalCover = coverUrl.trim() || (mediaType === 'embed' ? DEFAULT_COVER : mediaUrl.trim()) || DEFAULT_COVER;
    const finalMedia = mediaUrl.trim() || finalCover;

    const newProject: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      client: client.trim() || undefined,
      year: year.trim() || undefined,
      description: description.trim() || undefined,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      coverUrl: finalCover,
      mediaType,
      mediaUrl: finalMedia,
      aspectRatio,
      externalLink: externalLink.trim() || (mediaType === 'website' ? finalMedia : undefined),
      embedCode: embedCode.trim() || undefined,
      createdAt: now,
      updatedAt: now
    };

    await onAddProject(newProject, assignedPortfolioIds);

    // Reset Form
    setTitle('');
    setClient('');
    setDescription('');
    coverRequest.current++;
    setAutoCoverError('');
    setPastedUrl('');
    setDetectedMedia(null);
    setMediaUrl('');
    setCoverUrl('');
    setTagsInput('');
    setExternalLink('');
    setEmbedCode('');
    setIsSubmitting(false);

    setSuccessMessage(`Added "${newProject.title}" to ${assignedPortfolioIds.length} portfolio page(s)`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="bg-neutral-900/80 border border-white/15 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-2xl relative overflow-hidden">
      {/* Decorative subtle ambient highlight */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <h2 className="text-xl md:text-2xl font-serif font-medium text-white tracking-tight">
              Add Content & Projects
            </h2>
          </div>
          <p className="text-xs md:text-sm text-neutral-400 mt-1">
            Paste links (Instagram, Facebook, Video, Web) or upload media. Choose which portfolio pages to feature this project on.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10 text-xs font-mono self-start md:self-auto">
          <button
            type="button"
            onClick={() => setEntryMode('link')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              entryMode === 'link'
                ? 'bg-white text-black font-medium shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <LinkIcon size={14} />
            <span>Paste Link</span>
          </button>
          <button
            type="button"
            onClick={() => setEntryMode('upload')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
              entryMode === 'upload'
                ? 'bg-white text-black font-medium shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Upload size={14} />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Step 1: Media Entry Area */}
        {entryMode === 'link' ? (
          <div className="space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
              Content Link (Instagram Post / Reel, Facebook, YouTube, Vimeo, Website)
            </label>
            <div className="relative">
              <input
                type="url"
                value={pastedUrl}
                onChange={e => handleUrlChange(e.target.value)}
                placeholder="https://www.instagram.com/reel/... or https://facebook.com/..."
                className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors pr-24 font-mono"
              />
              {pastedUrl && (
                <button
                  type="button"
                  onClick={() => handleUrlChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-1"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {autoCoverLoading && <p className="text-xs text-neutral-400">Finding the original post cover...</p>}
            {autoCoverError && <p className="text-xs text-amber-400">{autoCoverError}</p>}
            {/* Detection feedback banner */}
            {detectedMedia && (
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-neutral-300">
                <Sparkles size={14} className="text-amber-400 shrink-0" />
                <span className="text-white font-medium">{detectedMedia.label}</span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-400">Aspect Ratio: {detectedMedia.aspectRatio}</span>
                <span className="text-neutral-500">•</span>
                <span className="text-emerald-400">Ready for embed</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
              Upload Media (Image, Video MP4/WebM, PDF)
            </label>
            <div className="border-2 border-dashed border-white/15 hover:border-white/30 rounded-xl p-6 text-center bg-black/30 transition-colors">
              <input
                type="file"
                id="main-file-upload"
                className="hidden"
                accept="image/*,video/mp4,video/webm,application/pdf"
                onChange={e => handleFileUpload(e, 'media')}
              />
              <label
                htmlFor="main-file-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                {uploadingMedia ? (
                  <div className="flex items-center gap-2 text-white font-mono text-xs">
                    <Loader2 size={18} className="animate-spin text-white" />
                    <span>Uploading file to storage...</span>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="text-neutral-400" />
                    <span className="text-sm font-medium text-white">Click or drag file to upload</span>
                    <span className="text-xs text-neutral-500 font-mono">
                      Images (PNG, JPG, WebP), Videos (MP4), PDFs
                    </span>
                  </>
                )}
              </label>
            </div>
            {mediaUrl && (
              <div className="text-xs font-mono text-emerald-400 truncate flex items-center gap-1.5">
                <Check size={13} />
                <span>File attached: {mediaUrl}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Essential Details & Role Assignment */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Editorial Lookbook 2026, Summer Social Campaign"
              className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
              Client / Brand
            </label>
            <input
              type="text"
              value={client}
              onChange={e => setClient(e.target.value)}
              placeholder="e.g., Vogue, Self-Initiated"
              className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white transition-colors"
            />
          </div>
        </div>

        {/* Step 3: Portfolio / Roles Multi-Selector */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-medium">
              Publish to Portfolio Role Pages:
            </label>
            <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
              <button
                type="button"
                onClick={selectAllPortfolios}
                className="hover:text-white underline cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAllPortfolios}
                className="hover:text-white underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {portfolios.map(port => {
              const isSelected = assignedPortfolioIds.includes(port.id);
              const pathDisplay = port.slug ? `/p/${port.slug}` : '/';
              return (
                <button
                  type="button"
                  key={port.id}
                  onClick={() => togglePortfolio(port.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white text-black border-white shadow-md'
                      : 'bg-black/40 text-neutral-400 border-white/10 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="font-medium text-xs truncate">{port.title}</span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-black text-white' : 'border border-neutral-600'
                      }`}
                    >
                      {isSelected && <Check size={10} />}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono mt-2 truncate ${isSelected ? 'text-neutral-700' : 'text-neutral-500'}`}>
                    {pathDisplay}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: Cover Thumbnail & Format */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Cover Preview & Uploader */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
              Cover Thumbnail (3D Sphere & Card)
            </label>
            <div className="flex gap-2 items-center">
              <div className="w-16 h-16 rounded-lg bg-neutral-800 border border-white/15 overflow-hidden shrink-0 flex items-center justify-center">
                {coverUrl ? (
                  <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={20} className="text-neutral-500" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <input
                  type="url"
                  value={coverUrl}
                  onChange={e => setCoverUrl(e.target.value)}
                  placeholder="Image URL or upload..."
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
                />
                <div className="relative">
                  <input
                    type="file"
                    id="add-cover-file"
                    className="hidden"
                    accept="image/*"
                    onChange={e => handleFileUpload(e, 'cover')}
                  />
                  <label
                    htmlFor="add-cover-file"
                    className="inline-block text-[11px] font-mono text-neutral-400 hover:text-white cursor-pointer underline"
                  >
                    {uploadingCover ? 'Uploading...' : 'Upload custom image'}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
              Aspect Ratio
            </label>
            <select
              value={aspectRatio}
              onChange={e => setAspectRatio(e.target.value as AspectRatio)}
              className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-white font-mono"
            >
              <option value="9/16">9:16 (Vertical Reel / Story)</option>
              <option value="1:1">1:1 (Square Post)</option>
              <option value="16/9">16:9 (Landscape Video / Web)</option>
              <option value="4/5">4:5 (Instagram Portrait)</option>
              <option value="4/3">4:3 (Standard Document)</option>
              <option value="auto">Auto Aspect Ratio</option>
            </select>
          </div>

          {/* Year */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
              Year
            </label>
            <input
              type="text"
              value={year}
              onChange={e => setYear(e.target.value)}
              placeholder="2026"
              className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
            />
          </div>
        </div>

        {/* Optional Collapsible Details */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            {showOptionalFields ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{showOptionalFields ? 'Hide additional fields' : 'More fields (description, tags, external link)'}</span>
          </button>

          {showOptionalFields && (
            <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief overview or context for this project..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    placeholder="Editorial, Direction, Reels, 3D"
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
                    External / Original Link
                  </label>
                  <input
                    type="url"
                    value={externalLink}
                    onChange={e => setExternalLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button & Feedback */}
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10">
          <div className="text-xs font-mono text-neutral-400">
            {assignedPortfolioIds.length === 0 ? (
              <span className="text-amber-400">Select at least one portfolio page above</span>
            ) : (
              <span>Will be published to {assignedPortfolioIds.length} portfolio role(s)</span>
            )}
          </div>

          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className={`px-8 py-3.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
              !title.trim() || isSubmitting
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-white text-black hover:bg-neutral-200 active:scale-98'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin text-black" />
                <span>Adding to Portfolios...</span>
              </>
            ) : (
              <>
                <Plus size={16} className="text-black stroke-[2.5]" />
                <span>Add Project to Portfolios</span>
              </>
            )}
          </button>
        </div>

        {/* Inline Success Banner */}
        {successMessage && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 font-mono text-xs flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}
      </form>
    </div>
  );
};
