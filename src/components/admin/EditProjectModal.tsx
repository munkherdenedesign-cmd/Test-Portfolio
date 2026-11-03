import React, { useState, useEffect } from 'react';
import { Project, Portfolio, MediaType, AspectRatio } from '../../types/portfolio';
import { uploadAssetToSupabase, isSupabaseConfigured } from '../../lib/supabase';
import { parseSocialOrMediaUrl, ParsedMediaLink } from '../../lib/socialMediaParser';
import { extractInstagramReelCover, isInstagramReelUrl } from '../../lib/reelCover';
import { splitBrands } from '../../lib/brandCatalog';
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
  Square
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
  // Form fields
  const [title, setTitle] = useState(project.title);
  const [client, setClient] = useState(project.client || '');
  const [brandSearch, setBrandSearch] = useState('');
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
    if (!title.trim()) return;

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
      <div className="bg-[#121215] border border-white/20 rounded-2xl w-full max-w-4xl my-3 sm:my-6 overflow-hidden shadow-2xl flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-white/10 flex items-center justify-between bg-neutral-950/60 sticky top-0 z-10">
          <div>
            <h3 className="text-base font-mono font-medium text-white">Edit Project</h3>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Manage project details, preview and where it appears
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="px-5 sm:px-7 py-5 overflow-y-auto space-y-5 flex-1">
          {/* Section 1: Portfolio Roles Assignment */}
          <div className="p-4 bg-white/[0.035] border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-white font-medium">
                  Assigned Portfolio Role Pages
                </span>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Check each portfolio version where this project should appear.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                <button
                  type="button"
                  onClick={selectAllPortfolios}
                  className="hover:text-white underline cursor-pointer"
                >
                  All
                </button>
                <span>/</span>
                <button
                  type="button"
                  onClick={clearAllPortfolios}
                  className="hover:text-white underline cursor-pointer"
                >
                  None
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

          {/* Section 2: Title, Client, Year */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
                Project Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
                Client / Brands
              </label>
              <div className="rounded-xl border border-white/15 bg-black/40 p-2 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {splitBrands(client).map(name => (
                    <button key={name} type="button" onClick={() => setClient(splitBrands(client).filter(s => s !== name).join(', '))}
                      title={'Remove ' + name}
                      className="rounded-md bg-white text-black px-2 py-1 text-[11px] flex items-center gap-1.5">{name} <X size={11}/></button>
                  ))}
                  {!client.trim() && <span className="text-[11px] text-neutral-500 px-1 py-1">Select brands below</span>}
                </div>
                <input type="text" value={brandSearch} onChange={e => setBrandSearch(e.target.value)}
                  placeholder="Search brands..." className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2 text-xs text-white outline-none focus:border-white/40"/>
                <div className="max-h-28 overflow-y-auto flex flex-wrap gap-1.5">
                  {brandOptions.filter(name => name.toLowerCase().includes(brandSearch.toLowerCase()) && !splitBrands(client).some(s => s.toLowerCase() === name.toLowerCase())).map(name => (
                    <button key={name} type="button" onClick={() => { setClient([...splitBrands(client), name].join(', ')); setBrandSearch(''); }}
                      className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-neutral-300 hover:bg-white/10">{name}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Jump Links: Google Drive & Social Media */}
          <details className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
            <summary className="text-xs font-mono text-neutral-300 cursor-pointer select-none">Additional links <span className="text-neutral-500">(optional)</span></summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

          {/* Section 3: Media URL & Embed */}
          <div className="space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
              Media Link or Direct Asset URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={mediaUrl}
                onChange={e => handleMediaUrlChange(e.target.value)}
                placeholder="https://www.instagram.com/reel/... or https://..."
                className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white font-mono"
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

          {/* Section 4: Cover Thumbnail & Aspect Ratio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-2">
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
              <div className="flex items-center gap-3">
                <div className="w-24 h-24 rounded-xl bg-neutral-900 border border-white/20 overflow-hidden shrink-0 flex items-center justify-center">
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
                    placeholder="Cover Image URL"
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white font-mono"
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

            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400">
                Aspect Ratio
              </label>
              <select
                value={aspectRatio}
                onChange={e => setAspectRatio(e.target.value as AspectRatio)}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-white font-mono"
              >
                <option value="9/16">9:16</option>
                <option value="1:1">1:1</option>
                <option value="16/9">16:9</option>
                <option value="4/5">4:5</option>
                <option value="4/3">4:3</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Footer Actions */}
          <div className="sticky bottom-0 z-20 -mx-5 sm:-mx-7 -mb-5 px-5 sm:px-7 py-4 bg-[#121215] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_-12px_28px_rgba(0,0,0,0.4)]">
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
                  className="text-xs font-mono text-rose-400/80 hover:text-rose-400 flex items-center gap-1.5 cursor-pointer p-1"
                >
                  <Trash2 size={13} />
                  <span>Delete Project</span>
                </button>
              )}
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-mono text-neutral-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
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
        </form>
      </div>
    </div>
  );
};
