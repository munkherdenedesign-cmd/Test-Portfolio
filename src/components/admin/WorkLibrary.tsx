import React, { useState } from 'react';
import { Project, MediaType, AspectRatio, Portfolio } from '../../types/portfolio';
import { uploadAssetToSupabase, isSupabaseConfigured } from '../../lib/supabase';
import { parseSocialOrMediaUrl, ParsedMediaLink } from '../../lib/socialMediaParser';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  FileText,
  Globe,
  Check,
  X,
  Loader2,
  ExternalLink,
  Sparkles,
  CheckSquare,
  Square
} from 'lucide-react';

interface WorkLibraryProps {
  projects: Project[];
  portfolios: Portfolio[];
  onAddProject: (project: Project, assignedPortfolioIds: string[]) => void;
  onUpdateProject: (project: Project, assignedPortfolioIds: string[]) => void;
  onDeleteProject: (projectId: string) => void;
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';

export const WorkLibrary: React.FC<WorkLibraryProps> = ({
  projects,
  portfolios,
  onAddProject,
  onUpdateProject,
  onDeleteProject
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('all');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Mode in Add Work modal: 'link' vs 'upload'
  const [entryMode, setEntryMode] = useState<'link' | 'upload'>('link');
  const [pastedUrl, setPastedUrl] = useState('');
  const [detectedMedia, setDetectedMedia] = useState<ParsedMediaLink | null>(null);

  // Upload state
  const [uploadingField, setUploadingField] = useState<'coverUrl' | 'mediaUrl' | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    client: '',
    year: new Date().getFullYear().toString(),
    description: '',
    tags: [],
    coverUrl: '',
    mediaType: 'image',
    mediaUrl: '',
    aspectRatio: '16/9',
    externalLink: '',
    embedCode: '',
    details: {
      role: '',
      deliverables: [],
      credits: ''
    }
  });

  // Selected portfolio versions to feature this project
  const [assignedPortfolioIds, setAssignedPortfolioIds] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const openCreateModal = () => {
    setFormData({
      title: '',
      client: '',
      year: new Date().getFullYear().toString(),
      description: '',
      tags: [],
      coverUrl: '',
      mediaType: 'embed',
      mediaUrl: '',
      aspectRatio: '16/9',
      externalLink: '',
      embedCode: '',
      details: { role: '', deliverables: [], credits: '' }
    });
    setPastedUrl('');
    setDetectedMedia(null);
    setEntryMode('link');
    setAssignedPortfolioIds([portfolios[0]?.id || 'port-general']);
    setTagInput('');
    setIsCreating(true);
    setEditingProject(null);
    setUploadNotice(null);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({ ...project });
    // Determine which portfolios currently include this project
    const currentIncluded = portfolios
      .filter(p => (p.projectIds || []).includes(project.id) || (p.draftProjectIds || []).includes(project.id))
      .map(p => p.id);
    setAssignedPortfolioIds(currentIncluded);
    setPastedUrl(project.mediaUrl || '');
    setDetectedMedia(parseSocialOrMediaUrl(project.mediaUrl || ''));
    setEntryMode(project.mediaType === 'embed' || project.mediaType === 'website' ? 'link' : 'upload');
    setTagInput('');
    setIsCreating(false);
    setUploadNotice(null);
  };

  // Automatic URL Detection for Instagram, Facebook, Website, Video, etc.
  const handleUrlInput = (url: string) => {
    setPastedUrl(url);
    if (!url.trim()) {
      setDetectedMedia(null);
      return;
    }

    const parsed = parseSocialOrMediaUrl(url);
    if (parsed) {
      setDetectedMedia(parsed);
      setFormData(prev => ({
        ...prev,
        title: prev.title || parsed.suggestedTitle,
        mediaType: parsed.mediaType,
        mediaUrl: parsed.originalUrl,
        aspectRatio: parsed.aspectRatio,
        embedCode: parsed.embedCode,
        coverUrl: prev.coverUrl || parsed.thumbnailUrl || (prev.mediaType === 'image' ? parsed.originalUrl : prev.coverUrl),
        externalLink: parsed.originalUrl
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        mediaUrl: url,
        externalLink: url
      }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'coverUrl' | 'mediaUrl', forcedMediaType?: MediaType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    setUploadNotice(null);

    // Auto-detect mediaType if uploading file
    let detectedType = forcedMediaType || formData.mediaType;
    if (file.type.startsWith('video/')) {
      detectedType = 'video';
    } else if (file.type === 'application/pdf') {
      detectedType = 'pdf';
    } else if (file.type.startsWith('image/') && field === 'mediaUrl') {
      detectedType = 'image';
    }

    if (isSupabaseConfigured()) {
      try {
        const publicUrl = await uploadAssetToSupabase(file, field === 'coverUrl' ? 'covers' : 'media');
        setFormData(prev => ({
          ...prev,
          [field]: publicUrl,
          mediaType: detectedType,
          title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          ...(field === 'coverUrl' && !prev.mediaUrl ? { mediaUrl: publicUrl } : {}),
          ...(field === 'mediaUrl' && !prev.coverUrl && detectedType === 'image' ? { coverUrl: publicUrl } : {})
        }));
        setUploadNotice('Uploaded to Supabase Storage');
        setUploadingField(null);
        return;
      } catch (err: any) {
        console.warn('Storage upload error:', err);
      }
    }

    // Local file reader fallback
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        setFormData(prev => ({
          ...prev,
          [field]: dataUrl,
          mediaType: detectedType,
          title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          ...(field === 'coverUrl' && !prev.mediaUrl ? { mediaUrl: dataUrl } : {}),
          ...(field === 'mediaUrl' && !prev.coverUrl && detectedType === 'image' ? { coverUrl: dataUrl } : {})
        }));
      }
      setUploadingField(null);
    };
    reader.readAsDataURL(file);
  };

  const togglePortfolioAssignment = (portfolioId: string) => {
    setAssignedPortfolioIds(prev =>
      prev.includes(portfolioId)
        ? prev.filter(id => id !== portfolioId)
        : [...prev, portfolioId]
    );
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tagToRemove) || []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const finalCover = formData.coverUrl || formData.mediaUrl || DEFAULT_COVER;

    if (editingProject) {
      const updated: Project = {
        ...editingProject,
        ...(formData as Project),
        coverUrl: finalCover,
        updatedAt: new Date().toISOString()
      };
      onUpdateProject(updated, assignedPortfolioIds);
      setEditingProject(null);
    } else {
      const newProj: Project = {
        id: `proj-${Date.now()}`,
        title: formData.title || 'Untitled Project',
        client: formData.client || '',
        year: formData.year || new Date().getFullYear().toString(),
        description: formData.description || '',
        tags: formData.tags || [],
        coverUrl: finalCover,
        mediaType: formData.mediaType || 'image',
        mediaUrl: formData.mediaUrl || finalCover,
        aspectRatio: formData.aspectRatio || '16/9',
        externalLink: formData.externalLink || '',
        embedCode: formData.embedCode || '',
        details: formData.details || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      onAddProject(newProj, assignedPortfolioIds);
      setIsCreating(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedMediaType === 'all' || p.mediaType === selectedMediaType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif text-white">Projects</h2>
          <p className="text-xs text-neutral-400">
            {projects.length} work items in library
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-mono uppercase tracking-wider rounded-lg flex items-center gap-1.5 font-medium transition-all cursor-pointer shadow-md"
        >
          <Plus size={15} /> Add Work
        </button>
      </div>

      {/* Compact Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 bg-neutral-900/60 border border-white/10 rounded-xl">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" size={13} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs font-mono">
          {['all', 'image', 'video', 'embed', 'pdf', 'website'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedMediaType(type)}
              className={`px-2.5 py-1 rounded-md capitalize transition-colors cursor-pointer ${
                selectedMediaType === type
                  ? 'bg-white text-black font-medium'
                  : 'text-neutral-400 hover:text-white bg-white/5'
              }`}
            >
              {type === 'embed' ? 'Social' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Compact Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => {
          const includedIn = portfolios.filter(p => (p.projectIds || []).includes(project.id));

          return (
            <div
              key={project.id}
              className="bg-neutral-900/60 border border-white/10 rounded-xl overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all group"
            >
              <div>
                <div className="relative aspect-[16/10] bg-black overflow-hidden">
                  <img
                    src={project.coverUrl}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/10 flex items-center gap-1">
                    {project.mediaType === 'video' && <Video size={10} />}
                    {project.mediaType === 'pdf' && <FileText size={10} />}
                    {project.mediaType === 'website' && <Globe size={10} />}
                    {project.mediaType === 'embed' && <Sparkles size={10} />}
                    {project.mediaType === 'image' && <ImageIcon size={10} />}
                    <span>{project.mediaType}</span>
                  </div>
                  <div className="absolute top-2 left-2 text-[10px] font-mono text-neutral-300 bg-black/70 px-1.5 py-0.5 rounded">
                    {project.aspectRatio || '16/9'}
                  </div>
                </div>

                <div className="p-3.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1">
                    <span>{project.year || '2026'}</span>
                    <span>{project.client}</span>
                  </div>
                  <h4 className="text-sm font-serif text-white font-medium truncate">
                    {project.title}
                  </h4>

                  {/* Portfolios Badges */}
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {includedIn.length > 0 ? (
                      includedIn.map(p => (
                        <span
                          key={p.id}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-neutral-300 border border-white/10"
                        >
                          {p.title}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] font-mono text-neutral-600">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-3.5 py-2.5 bg-black/30 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                <button
                  onClick={() => openEditModal(project)}
                  className="text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${project.title}"?`)) {
                      onDeleteProject(project.id);
                    }
                  }}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Project Modal */}
      {(isCreating || editingProject) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-serif">
                {editingProject ? 'Edit Project' : 'Add Work'}
              </h3>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingProject(null);
                }}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Entry Mode Toggle: Paste Link vs Upload File */}
            {!editingProject && (
              <div className="mt-4 flex rounded-lg p-1 bg-black/40 border border-white/10 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setEntryMode('link')}
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    entryMode === 'link' ? 'bg-white text-black font-medium' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <LinkIcon size={13} />
                  <span>Paste Link (Instagram, Facebook, Web)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('upload')}
                  className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    entryMode === 'upload' ? 'bg-white text-black font-medium' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Upload size={13} />
                  <span>Upload File (Video, Image, PDF)</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Mode: Paste Link */}
              {entryMode === 'link' ? (
                <div className="space-y-3 p-3 bg-black/30 border border-white/10 rounded-xl">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                      Paste URL
                    </label>
                    <input
                      type="url"
                      required={entryMode === 'link'}
                      value={pastedUrl}
                      onChange={(e) => handleUrlInput(e.target.value)}
                      placeholder="https://www.instagram.com/reel/... or https://facebook.com/..."
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 font-mono"
                    />
                  </div>

                  {detectedMedia && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-neutral-300">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={13} className="text-amber-400" />
                        Detected: <strong>{detectedMedia.label}</strong> ({detectedMedia.aspectRatio})
                      </span>
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <Check size={12} /> Auto-Formatted
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Mode: Upload File */
                <div className="space-y-3 p-3 bg-black/30 border border-white/10 rounded-xl">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Select Media File (Video MP4, Poster Image, PDF)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 px-4 py-3 bg-black/60 hover:bg-black/80 border border-dashed border-white/20 rounded-xl text-center text-xs font-mono text-neutral-300 cursor-pointer flex flex-col items-center justify-center gap-1">
                      {uploadingField === 'mediaUrl' ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-white mb-1" />
                          <span>Uploading file to storage...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={16} className="mb-0.5 text-neutral-400" />
                          <span>{formData.mediaUrl ? 'Replace File' : 'Click to Upload Asset'}</span>
                          <span className="text-[10px] text-neutral-500">Supports MP4, JPG, PNG, PDF</span>
                        </>
                      )}
                      <input
                        type="file"
                        className="hidden"
                        accept="video/*,image/*,application/pdf"
                        onChange={(e) => handleFileUpload(e, 'mediaUrl')}
                      />
                    </label>
                  </div>
                  {formData.mediaUrl && (
                    <div className="text-[11px] font-mono text-neutral-400 truncate">
                      File: {formData.mediaUrl.slice(0, 50)}...
                    </div>
                  )}
                </div>
              )}

              {/* Title & Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Project Title"
                    className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Client
                  </label>
                  <input
                    type="text"
                    value={formData.client}
                    onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                    placeholder="Client or Brand"
                    className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              {/* Media Type & Aspect Ratio */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.mediaType}
                    onChange={(e) => setFormData(prev => ({ ...prev, mediaType: e.target.value as MediaType }))}
                    className="w-full px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white font-mono"
                  >
                    <option value="embed">Social Embed (Reel/Post)</option>
                    <option value="video">Video (MP4)</option>
                    <option value="image">Image / Poster</option>
                    <option value="pdf">PDF Document</option>
                    <option value="website">Website</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Aspect Ratio
                  </label>
                  <select
                    value={formData.aspectRatio}
                    onChange={(e) => setFormData(prev => ({ ...prev, aspectRatio: e.target.value as AspectRatio }))}
                    className="w-full px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white font-mono"
                  >
                    <option value="9/16">9:16 Vertical (Reel / Story)</option>
                    <option value="1/1">1:1 Square</option>
                    <option value="16/9">16:9 Landscape</option>
                    <option value="4/3">4:3 Standard</option>
                    <option value="3/4">3:4 Portrait</option>
                    <option value="2/3">2:3 Poster</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    Year
                  </label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    placeholder="2026"
                    className="w-full px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Cover Thumbnail */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Thumbnail / Sphere Circle Cover
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.coverUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, coverUrl: e.target.value }))}
                    placeholder="Thumbnail URL or upload image"
                    className="flex-1 px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white"
                  />
                  <label className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-neutral-200 text-xs font-mono rounded-lg flex items-center gap-1 cursor-pointer">
                    {uploadingField === 'coverUrl' ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Upload size={13} />
                    )}
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'coverUrl')}
                    />
                  </label>
                </div>
                {formData.coverUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={formData.coverUrl} alt="Thumbnail preview" className="w-10 h-10 rounded-full object-cover border border-white/20" />
                    <span className="text-[10px] font-mono text-neutral-400">Active circle texture</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Short project overview"
                  className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>

              {/* Assign to Portfolio Versions (Checkboxes) */}
              <div className="p-3 bg-black/30 border border-white/10 rounded-xl space-y-2">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Assign to Portfolios
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {portfolios.map(p => {
                    const isChecked = assignedPortfolioIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => togglePortfolioAssignment(p.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer text-xs font-mono ${
                          isChecked
                            ? 'bg-white/10 border-white/30 text-white'
                            : 'bg-black/40 border-white/5 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {isChecked ? <CheckSquare size={14} className="text-white" /> : <Square size={14} className="text-neutral-500" />}
                        <span className="truncate">{p.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingProject(null);
                  }}
                  className="px-3 py-1.5 text-xs font-mono text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black text-xs font-mono uppercase tracking-wider rounded-lg font-medium"
                >
                  {editingProject ? 'Save Changes' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
