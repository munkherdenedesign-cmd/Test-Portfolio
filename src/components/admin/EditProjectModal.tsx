import React, { useState, useEffect } from 'react';
import { Project, Portfolio, MediaType, AspectRatio } from '../../types/portfolio';
import { uploadAssetToSupabase, isSupabaseConfigured } from '../../lib/supabase';
import { parseSocialOrMediaUrl, ParsedMediaLink } from '../../lib/socialMediaParser';
import { extractInstagramReelCover, isInstagramReelUrl } from '../../lib/reelCover';
import {
  X,
  Check,
  Upload,
  Link as LinkIcon,
  Trash2,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  CheckSquare,
  Square,
  ArrowLeft,
  ArrowRight,
  Pencil,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

interface EditProjectModalProps {
  project: Project;
  portfolios: Portfolio[];
  brandOptions?: string[];
  onClose: () => void;
  onUpdateProject: (project: Project, assignedPortfolioIds: string[]) => Promise<void> | void;
  onDeleteProject: (projectId: string) => Promise<void> | void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  portfolios,
  brandOptions = [],
  onClose,
  onUpdateProject,
  onDeleteProject
}) => {
  const [activePage, setActivePage] = useState<0 | 1 | 2>(0);
  // Form fields
  const [title, setTitle] = useState(project.title);
  const [client, setClient] = useState(project.client || '');
  const [brandSearch, setBrandSearch] = useState('');
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [year, setYear] = useState(project.year || '');
  const [description, setDescription] = useState(project.description || '');
  const [mediaType, setMediaType] = useState<MediaType>(project.mediaType);
  const [mediaUrl, setMediaUrl] = useState(project.mediaUrl || '');
  const [coverUrl, setCoverUrl] = useState(project.coverUrl || '');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(project.aspectRatio || '16/9');
  const [externalLink, setExternalLink] = useState(project.externalLink || '');
  const [googleDriveUrl, setGoogleDriveUrl] = useState(project.googleDriveUrl || '');
  const [socialUrl, setSocialUrl] = useState(project.socialUrl || '');
  const [embedCode, setEmbedCode] = useState(project.embedCode || '');
  const [isCarousel, setIsCarousel] = useState(Boolean(project.details?.isCarousel));
  const [carouselPages, setCarouselPages] = useState<string[]>(project.details?.carouselPages || []);
  const [uploadingPages, setUploadingPages] = useState(false);
  const [carouselError, setCarouselError] = useState('');

  // Assigned portfolios for this project
  const [assignedPortfolioIds, setAssignedPortfolioIds] = useState<string[]>(() => {
    return portfolios
      .filter(p => (p.projectIds || []).includes(project.id) || (p.draftProjectIds || []).includes(project.id))
      .map(p => p.id);
  });

  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [detectedMedia, setDetectedMedia] = useState<ParsedMediaLink | null>(null);
  const [autoCoverLoading, setAutoCoverLoading] = useState(false);
  const [autoCoverError, setAutoCoverError] = useState('');

  const handleAutoCover = async () => {
    const url = mediaUrl || socialUrl || externalLink;
    if (!isInstagramReelUrl(url)) return;
    setAutoCoverLoading(true);
    setAutoCoverError('');
    try {
      setCoverUrl(await extractInstagramReelCover(url));
    } catch (err: any) {
      setAutoCoverError(err.message || 'Could not retrieve the cover. Upload an image instead.');
    } finally {
      setAutoCoverLoading(false);
    }
  };

  // Check link when mediaUrl changes
  const handleMediaUrlChange = (url: string) => {
    setMediaUrl(url);
    if (!url.trim()) {
      setDetectedMedia(null);
      return;
    }
    const parsed = parseSocialOrMediaUrl(url);
    if (parsed) {
      setDetectedMedia(parsed);
      setMediaType(parsed.mediaType);
      setAspectRatio(parsed.aspectRatio);
      setEmbedCode(parsed.embedCode);
      if (parsed.thumbnailUrl && (!coverUrl || coverUrl === project.coverUrl)) {
        setCoverUrl(parsed.thumbnailUrl);
      }
    } else {
      setDetectedMedia(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'cover' | 'media') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === 'cover') setUploadingCover(true);
    if (target === 'media') setUploadingMedia(true);

    try {
      let finalUrl = '';
      if (isSupabaseConfigured()) {
        finalUrl = await uploadAssetToSupabase(file, target === 'cover' ? 'covers' : 'media');
      } else {
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
        if (file.type.startsWith('video/')) {
          setMediaType('video');
        } else if (file.type === 'application/pdf') {
          setMediaType('pdf');
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

  const uploadCarouselPages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingPages(true);
    setCarouselError('');
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) throw new Error('Carousel pages must be images.');
        if (isSupabaseConfigured()) urls.push(await uploadAssetToSupabase(file, 'carousel'));
        else urls.push(await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }));
      }
      setCarouselPages(prev => [...prev, ...urls]);
    } catch (error) {
      setCarouselError(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploadingPages(false);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || uploadingPages) return;

    setIsSaving(true);

    const updatedProject: Project = {
      ...project,
      title: title.trim(),
      client: client.trim() || undefined,
      year: year.trim() || undefined,
      description: description.trim() || undefined,
      coverUrl: coverUrl.trim() || mediaUrl.trim() || project.coverUrl,
      mediaType,
      mediaUrl: mediaUrl.trim() || project.mediaUrl,
      aspectRatio,
      externalLink: externalLink.trim() || undefined,
      googleDriveUrl: googleDriveUrl.trim() || undefined,
      socialUrl: socialUrl.trim() || undefined,
      embedCode: embedCode.trim() || undefined,
      details: { ...project.details, isCarousel, carouselPages },
      updatedAt: new Date().toISOString()
    };

    await onUpdateProject(updatedProject, assignedPortfolioIds);
    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsDeleting(true);
    await onDeleteProject(project.id);
    setIsDeleting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto font-mono">
      <div className="bg-[#121215] border border-white/20 rounded-2xl w-full max-w-[800px] h-[min(640px,90dvh)] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-white/10 flex items-center justify-between bg-neutral-950/60 sticky top-0 z-10">
          <div>
            <h3 className="text-base font-mono font-medium text-white">Edit Project</h3>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              {["Project information", "Media & appearance", "Additional settings"][activePage]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form id="edit-project-form" onSubmit={handleSave} className="px-5 sm:px-7 py-5 overflow-y-auto flex-1 min-h-0 min-w-0">
          <div className={activePage === 0 ? 'space-y-6' : 'hidden'}>
          <div className="space-y-3">
            {/* Section 1: Portfolio Roles Assignment */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-white font-medium">
                  Portfolio Roles
                </span>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Choose where this project appears.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                <button
                  type="button"
                  onClick={selectAllPortfolios}
                  aria-label="Select all portfolio roles" title="Select all" className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <CheckSquare size={15}/>
                </button>
                <button
                  type="button"
                  onClick={clearAllPortfolios}
                  aria-label="Clear portfolio roles" title="Clear all" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <Square size={15}/>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {portfolios.map(port => {
                const isSelected = assignedPortfolioIds.includes(port.id);
                return (
                  <button
                    type="button"
                    key={port.id}
                    onClick={() => togglePortfolio(port.id)}
                    className={`px-3 py-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-white text-black border-white font-medium'
                        : 'bg-black/40 text-neutral-400 border-white/10 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="text-xs truncate">{port.title}</div>
                      
                    </div>
                    <span
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-black text-white' : 'border border-neutral-600'
                      }`}
                    >
                      {isSelected && <Check size={10} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>


          </div>
          <div className="space-y-2">
            {/* Section 2: Title, Client, Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="min-w-0 space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
                Project Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full h-12 bg-black/60 border border-white/15 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-white font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
                Client
              </label>
              <div className="relative">
                {client.trim() && !clientPickerOpen ? (
                  <div className="flex h-12 items-center justify-between gap-3 rounded-xl border border-white/15 bg-black/60 px-4">
                    <span className="min-w-0 truncate text-sm text-white">{client.split(',')[0].trim()}</span>
                    <button type="button" onClick={() => { setClientPickerOpen(true); setBrandSearch(''); }} title="Change client" aria-label="Change client" className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white"><Pencil size={15}/></button>
                  </div>
                ) : (
                  <div className="relative rounded-xl border border-white/15 bg-black/40 p-1">
                    <input type="text" autoFocus={clientPickerOpen} value={brandSearch} onChange={e => setBrandSearch(e.target.value)}
                      placeholder="Search clients…" className="w-full h-12 rounded-xl border border-white/15 bg-black/60 px-4 text-sm text-white outline-none focus:border-white/40"/>
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                      {brandOptions.filter(name => name.toLowerCase().includes(brandSearch.toLowerCase())).map(name => (
                        <button key={name} type="button" onClick={() => { setClient(name); setBrandSearch(''); setClientPickerOpen(false); }}
                          className="block w-full truncate rounded-lg px-3 py-2 text-left text-xs text-neutral-300 hover:bg-white/10 hover:text-white">{name}</button>
                      ))}
                      {!brandOptions.length && <p className="px-3 py-2 text-xs text-neutral-500">No saved clients</p>}
                    </div>
                    <div className="mt-2 flex justify-between border-t border-white/10 pt-2">
                      <button type="button" onClick={() => { setClient(''); setClientPickerOpen(false); setBrandSearch(''); }} className="text-xs text-neutral-500 hover:text-white">Clear</button>
                      {client && <button type="button" onClick={() => { setClientPickerOpen(false); setBrandSearch(''); }} className="text-xs text-neutral-400 hover:text-white">Cancel</button>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>


          </div>
          <div className="space-y-3">
            {/* Section 5: Description & Year */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detailed description of the project, concept and deliverables..."
              className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white font-mono"
            />
          </div>

          <div className="w-full max-w-[150px]">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
                Year
              </label>
              <input
                type="text"
                value={year}
                onChange={e => setYear(e.target.value)}
                placeholder="2026"
                className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
              />
            </div>
          </div>
          </div>
          </div>
          <div className={activePage === 1 ? 'space-y-6' : 'hidden'}>
          <div className="space-y-4">
            <div className="space-y-5">
              {/* Section 4: Cover Thumbnail & Aspect Ratio */}
          <div className="space-y-4">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">Cover image</label>
                {isInstagramReelUrl(mediaUrl || socialUrl || externalLink) && (
                  <button type="button" disabled={autoCoverLoading || uploadingCover} onClick={handleAutoCover}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-neutral-200 hover:bg-white/10 disabled:opacity-50">
                    {autoCoverLoading ? 'Finding cover...' : 'Get Reel cover'}
                  </button>
                )}
              </div>
              {autoCoverError && <p className="text-[11px] text-amber-400">{autoCoverError}</p>}
              <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                <div className="w-full sm:w-56 h-48 sm:h-56 rounded-lg bg-neutral-900 overflow-hidden shrink-0 flex items-center justify-center">
                  {coverUrl ? (
                    <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-contain" />
                  ) : (
                    <ImageIcon size={20} className="text-neutral-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1 max-w-sm space-y-3">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-aspect-ratio" className="block text-xs uppercase tracking-wider text-neutral-400">Aspect ratio</label>
                    <select id="edit-aspect-ratio" value={aspectRatio} onChange={e => setAspectRatio(e.target.value as AspectRatio)}
                      className="h-10 w-32 rounded-lg border border-white/15 bg-black/60 px-3 text-sm text-white outline-none focus:border-white/50">
                      <option value="auto">Auto</option>
                      <option value="9/16">9:16</option>
                      <option value="1:1">1:1</option>
                      <option value="16/9">16:9</option>
                      <option value="4/5">4:5</option>
                      <option value="4/3">4:3</option>
                    </select>
                  </div>
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={e => setCoverUrl(e.target.value)}
                    placeholder="Cover URL (optional)"
                    className="w-full min-w-0 bg-black/60 border border-white/15 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      id="edit-cover-file"
                      className="hidden"
                      accept="image/*"
                      onChange={e => handleFileUpload(e, 'cover')}
                    />
                    <label
                      htmlFor="edit-cover-file"
                      className="text-[11px] font-mono text-neutral-400 hover:text-white cursor-pointer underline"
                    >
                      {uploadingCover ? 'Uploading...' : 'Upload cover image'}
                    </label>
                  </div>
                </div>
              </div>
            </div>


          </div>


              <div className="border-t border-white/10 pt-4">
                {/* Section 3: Media URL & Embed */}
          <div className="space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
              Media Link or Direct Asset URL
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3 min-w-0">
              <input
                type="text"
                value={mediaUrl}
                onChange={e => handleMediaUrlChange(e.target.value)}
                placeholder="Paste a media link…"
                className="min-w-0 flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white font-mono"
              />
              <div className="relative">
                <input
                  type="file"
                  id="edit-media-file"
                  className="hidden"
                  accept="image/*,video/mp4,video/webm,application/pdf"
                  onChange={e => handleFileUpload(e, 'media')}
                />
                <label
                  htmlFor="edit-media-file"
                  className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white rounded-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer border border-white/10"
                >
                  <Upload size={13} />
                  <span>{uploadingMedia ? 'Uploading...' : 'Replace File'}</span>
                </label>
              </div>
            </div>

            {detectedMedia && (
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 px-3 py-1.5 bg-amber-950/20 rounded-lg border border-amber-500/20">
                <Sparkles size={13} />
                <span>Detected: {detectedMedia.label} ({detectedMedia.aspectRatio})</span>
              </div>
            )}
          </div>


              </div>
            </div>
          </div>
          </div>
          <div className={activePage === 2 ? 'space-y-6' : 'hidden'}>
          <div className="space-y-3">

            {/* Carousel pages are saved within this project, not as separate projects. */}
          <div className="border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3 py-2">
              <label className="flex min-w-0 items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isCarousel} onChange={e => setIsCarousel(e.target.checked)} className="accent-white w-4 h-4 shrink-0" />
                <span><span className="block text-sm font-medium text-white">Carousel project</span><span className="block mt-1 text-[11px] text-neutral-500">Optional · Multiple images in one project</span></span>
              </label>
              <span className="text-[11px] text-neutral-400">{isCarousel ? `${carouselPages.length + 1} pages` : 'Off'}</span>
            </div>
            {isCarousel && <div className="pt-3 space-y-4">
              <p className="text-[11px] leading-relaxed text-neutral-400">The main media image is page 1. Add the remaining pages here now or later. All pages belong to this single project.</p>
              <div className="flex flex-wrap gap-3">
                {(mediaUrl || coverUrl) && <div className="w-20 space-y-1"><img src={mediaUrl || coverUrl} alt="Page 1" className="w-20 h-24 object-contain bg-black rounded-lg border border-white/15"/><p className="text-[10px] text-center text-neutral-400">Page 1</p></div>}
                {carouselPages.map((url, index) => <div key={url + index} className="w-20 space-y-1">
                  <img src={url} alt={`Page ${index + 2}`} className="w-20 h-24 object-contain bg-black rounded-lg border border-white/15"/>
                  <div className="flex justify-between items-center text-[10px] text-neutral-400"><span>{index + 2}</span>
                    <div className="flex gap-1">
                      <button type="button" disabled={index === 0} onClick={() => setCarouselPages(p => { const a = [...p]; [a[index - 1], a[index]] = [a[index], a[index - 1]]; return a; })} title="Move left" className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-white/10 disabled:opacity-25" aria-label="Move page earlier"><ArrowLeft size={14}/></button>
                      <button type="button" disabled={index === carouselPages.length - 1} onClick={() => setCarouselPages(p => { const a = [...p]; [a[index], a[index + 1]] = [a[index + 1], a[index]]; return a; })} title="Move right" className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-white/10 disabled:opacity-25" aria-label="Move page later"><ArrowRight size={14}/></button>
                      <button type="button" onClick={() => setCarouselPages(p => p.filter((_, i) => i !== index))} aria-label="Remove page" title="Remove page" className="inline-flex h-6 w-6 items-center justify-center rounded text-red-300 hover:bg-red-500/10"><X size={14}/></button>
                    </div>
                  </div>
                </div>)}
              </div>
              <label className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs cursor-pointer hover:bg-white/10">
                <Upload size={13}/>{uploadingPages ? 'Uploading pages...' : 'Add carousel pages'}
                <input type="file" multiple accept="image/*" className="hidden" disabled={uploadingPages} onChange={e => { void uploadCarouselPages(e.target.files); e.target.value = ''; }}/>
              </label>
              {carouselError && <p className="text-xs text-red-300">{carouselError}</p>}
            </div>}
          </div>


          </div>

            {/* Quick Jump Links: Google Drive & Social Media */}
          <details className="border-t border-white/10 pt-4 space-y-3">
            <summary className="text-xs font-mono text-neutral-300 cursor-pointer select-none">Additional links <span className="text-neutral-500">(optional)</span></summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Google Drive Folder / Link
                </label>
                <input
                  type="url"
                  value={googleDriveUrl}
                  onChange={e => setGoogleDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Social Media Link (Instagram / YouTube / TikTok)
                </label>
                <input
                  type="url"
                  value={socialUrl}
                  onChange={e => setSocialUrl(e.target.value)}
                  placeholder="https://www.instagram.com/p/... or https://..."
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>
            </div>
          </details>
          </div>
        </form>

          {/* Footer Actions */}
          <div className="shrink-0 px-5 sm:px-7 py-4 bg-[#121215] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Delete button */}
            <div>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-400 font-mono">Confirm deletion?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-mono cursor-pointer"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-neutral-300 rounded-lg text-xs font-mono cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  title="Delete project" aria-label="Delete project" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            <nav aria-label="Edit project pages" className="flex items-center gap-1">
              {([{ label: 'Info', Icon: FileText }, { label: 'Media', Icon: ImageIcon }, { label: 'More', Icon: SlidersHorizontal }] as const).map(({ label, Icon }, index) => (
                <button key={label} type="button" onClick={() => setActivePage(index as 0 | 1 | 2)} aria-label={label} aria-current={activePage === index ? 'page' : undefined} title={label}
                  className={`h-10 w-10 inline-flex items-center justify-center rounded-lg transition-colors ${activePage === index ? 'bg-white/15 text-white' : 'text-neutral-500 hover:text-white hover:bg-white/10'}`}>
                  <Icon size={18}/>
                </button>
              ))}
            </nav>
            {/* Save button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                title="Discard changes" aria-label="Cancel editing" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X size={18}/>
              </button>

              <button
                type="submit"
                form="edit-project-form"
                disabled={isSaving || !title.trim()}
                className="min-w-36 justify-center px-5 py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-black" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} className="text-black" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
      </div>
    </div>
  );
};
