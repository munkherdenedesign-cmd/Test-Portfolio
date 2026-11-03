import React, { useState } from 'react';
import { Portfolio, Project } from '../../types/portfolio';
import {
  Check,
  Save,
  Send,
  Eye,
  Copy,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  RotateCcw,
  Search,
  CheckSquare,
  Square,
  GripVertical,
  X
} from 'lucide-react';

interface PortfolioManagerProps {
  portfolios: Portfolio[];
  projects: Project[];
  onSaveDraft: (portfolioId: string, updates: Partial<Portfolio>) => void;
  onPublish: (portfolioId: string) => void;
  onCreatePortfolio: (portfolio: Portfolio) => void;
  onPreview: (slug: string, stagedPortfolio: Portfolio) => void;
}

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({
  portfolios,
  projects,
  onSaveDraft,
  onPublish,
  onCreatePortfolio,
  onPreview
}) => {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>(
    portfolios[0]?.id || 'port-general'
  );

  const activePortfolio = portfolios.find(p => p.id === selectedPortfolioId) || portfolios[0];

  const [title, setTitle] = useState(
    activePortfolio?.draftTitle ?? activePortfolio?.title ?? ''
  );
  const [subtitle, setSubtitle] = useState(
    activePortfolio?.draftSubtitle ?? activePortfolio?.subtitle ?? ''
  );
  const [introduction, setIntroduction] = useState(
    activePortfolio?.draftIntroduction ?? activePortfolio?.introduction ?? ''
  );
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    activePortfolio?.draftProjectIds ?? activePortfolio?.projectIds ?? []
  );

  // Drag and drop states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [libraryFilter, setLibraryFilter] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isCreatingNewVersion, setIsCreatingNewVersion] = useState(false);
  const [newVersionForm, setNewVersionForm] = useState({
    title: '',
    slug: '',
    subtitle: '',
    introduction: ''
  });

  const handleSelectPortfolio = (pId: string) => {
    setSelectedPortfolioId(pId);
    const target = portfolios.find(p => p.id === pId);
    if (target) {
      setTitle(target.draftTitle ?? target.title ?? '');
      setSubtitle(target.draftSubtitle ?? target.subtitle ?? '');
      setIntroduction(target.draftIntroduction ?? target.introduction ?? '');
      setSelectedProjectIds(target.draftProjectIds ?? target.projectIds ?? []);
    }
  };

  const toggleProjectInclusion = (projectId: string) => {
    if (selectedProjectIds.includes(projectId)) {
      setSelectedProjectIds(prev => prev.filter(id => id !== projectId));
    } else {
      setSelectedProjectIds(prev => [...prev, projectId]);
    }
  };

  // Drag & drop ordering
  const handleDragStart = (index: number, e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (dropIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...selectedProjectIds];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, moved);
    setSelectedProjectIds(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const reordered = [...selectedProjectIds];
    const temp = reordered[index - 1];
    reordered[index - 1] = reordered[index];
    reordered[index] = temp;
    setSelectedProjectIds(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index >= selectedProjectIds.length - 1) return;
    const reordered = [...selectedProjectIds];
    const temp = reordered[index + 1];
    reordered[index + 1] = reordered[index];
    reordered[index] = temp;
    setSelectedProjectIds(reordered);
  };

  const handleRemoveFromPortfolio = (projectId: string) => {
    setSelectedProjectIds(prev => prev.filter(id => id !== projectId));
  };

  const handleSaveDraft = () => {
    if (!activePortfolio) return;
    onSaveDraft(activePortfolio.id, {
      draftTitle: title,
      draftSubtitle: subtitle,
      draftIntroduction: introduction,
      draftProjectIds: selectedProjectIds
    });
  };

  const handlePublish = () => {
    if (!activePortfolio) return;
    onSaveDraft(activePortfolio.id, {
      title,
      subtitle,
      introduction,
      projectIds: selectedProjectIds,
      draftTitle: undefined,
      draftSubtitle: undefined,
      draftIntroduction: undefined,
      draftProjectIds: undefined,
      status: 'published'
    });
    onPublish(activePortfolio.id);
  };

  const handleDiscardDraft = () => {
    if (!activePortfolio) return;
    setTitle(activePortfolio.title);
    setSubtitle(activePortfolio.subtitle || '');
    setIntroduction(activePortfolio.introduction);
    setSelectedProjectIds(activePortfolio.projectIds || []);
    onSaveDraft(activePortfolio.id, {
      draftTitle: undefined,
      draftSubtitle: undefined,
      draftIntroduction: undefined,
      draftProjectIds: undefined
    });
  };

  const handleCopyLink = () => {
    if (!activePortfolio) return;
    const origin = window.location.origin;
    const path = activePortfolio.slug ? `/p/${activePortfolio.slug}` : '/';
    navigator.clipboard.writeText(`${origin}${path}`);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handlePrivatePreview = () => {
    if (!activePortfolio) return;
    const staged: Portfolio = {
      ...activePortfolio,
      title,
      subtitle,
      introduction,
      projectIds: selectedProjectIds
    };
    onPreview(activePortfolio.slug, staged);
  };

  const handleCreateNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = newVersionForm.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
    if (!cleanSlug) return;

    const newPort: Portfolio = {
      id: `port-${Date.now()}`,
      slug: cleanSlug,
      title: newVersionForm.title || 'New Portfolio',
      subtitle: newVersionForm.subtitle || '',
      introduction: newVersionForm.introduction || '',
      status: 'published',
      projectIds: [],
      isCustom: true,
      updatedAt: new Date().toISOString()
    };

    onCreatePortfolio(newPort);
    setIsCreatingNewVersion(false);
    setNewVersionForm({ title: '', slug: '', subtitle: '', introduction: '' });
    handleSelectPortfolio(newPort.id);
  };

  const projectMap = new Map(projects.map(p => [p.id, p]));

  const isDraftDirty =
    title !== activePortfolio?.title ||
    subtitle !== (activePortfolio?.subtitle || '') ||
    introduction !== activePortfolio?.introduction ||
    JSON.stringify(selectedProjectIds) !== JSON.stringify(activePortfolio?.projectIds || []) ||
    Boolean(activePortfolio?.draftProjectIds);

  const filteredLibrary = projects.filter(p => {
    if (!libraryFilter.trim()) return true;
    const q = libraryFilter.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.client?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Portfolio Selector & Action Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-neutral-900/60 border border-white/10 rounded-xl">
        {/* Version Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
          {portfolios.map(p => {
            const isActive = p.id === activePortfolio?.id;
            const hasDraft = Boolean(p.draftProjectIds || p.draftTitle);

            return (
              <button
                key={p.id}
                onClick={() => handleSelectPortfolio(p.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'bg-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                <span>{p.title}</span>
                <span className={`text-[10px] px-1 rounded ${isActive ? 'bg-black/10' : 'bg-white/10'}`}>
                  {(p.projectIds || []).length}
                </span>
                {hasDraft && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
              </button>
            );
          })}

          <button
            onClick={() => setIsCreatingNewVersion(true)}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
            title="Create New Version"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Actions: Preview, Save, Publish */}
        <div className="flex items-center gap-2 self-end md:self-auto text-xs font-mono">
          <button
            onClick={handleCopyLink}
            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white rounded-lg flex items-center gap-1.5 border border-white/10"
          >
            {copyFeedback ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copyFeedback ? 'Copied' : 'Link'}</span>
          </button>

          <button
            onClick={handlePrivatePreview}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white rounded-lg flex items-center gap-1.5 border border-white/10"
          >
            <Eye size={12} />
            <span>Preview</span>
          </button>

          {isDraftDirty && (
            <button
              onClick={handleDiscardDraft}
              className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg"
              title="Discard draft changes"
            >
              <RotateCcw size={12} />
            </button>
          )}

          <button
            onClick={handleSaveDraft}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg flex items-center gap-1.5 border border-white/10"
          >
            <Save size={12} />
            <span>Save</span>
          </button>

          <button
            onClick={handlePublish}
            className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <Send size={12} />
            <span>Publish</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Statement & Details (4 cols) */}
        <div className="lg:col-span-4 bg-neutral-900/60 border border-white/10 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 pb-2 border-b border-white/10">
            Portfolio Details
          </h3>

          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Campaigns &amp; Content"
              className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-neutral-400 mb-1">Introduction</label>
            <textarea
              rows={4}
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              className="w-full px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white leading-relaxed"
            />
          </div>

          <div className="pt-2 border-t border-white/5 text-[11px] font-mono text-neutral-500">
            Route: {activePortfolio?.slug === '' ? '/' : `/p/${activePortfolio?.slug}`}
          </div>
        </div>

        {/* Right Column: Independent Project Order & Selection (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Ordered Projects */}
          <div className="bg-neutral-900/60 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3 text-xs">
              <span className="font-mono uppercase tracking-wider text-neutral-400">
                Project Order ({selectedProjectIds.length})
              </span>
              <span className="text-[11px] font-mono text-neutral-500">
                Drag to rearrange
              </span>
            </div>

            {selectedProjectIds.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-neutral-500 border border-dashed border-white/10 rounded-lg">
                No projects in this portfolio. Select from below.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {selectedProjectIds.map((projectId, index) => {
                  const proj = projectMap.get(projectId);
                  if (!proj) return null;

                  return (
                    <div
                      key={proj.id}
                      draggable
                      onDragStart={(e) => handleDragStart(index, e)}
                      onDragOver={(e) => handleDragOver(index, e)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(index, e)}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all text-xs ${
                        draggedIndex === index
                          ? 'opacity-30 border-dashed border-white/40 bg-white/5'
                          : dragOverIndex === index
                          ? 'border-white bg-white/10 ring-1 ring-white/30'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="cursor-grab active:cursor-grabbing text-neutral-500 hover:text-white p-0.5"
                          title="Drag to rearrange"
                        >
                          <GripVertical size={13} />
                        </div>
                        <span className="w-5 h-5 rounded bg-white/10 text-white font-mono text-[10px] flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <img
                          src={proj.coverUrl}
                          alt={proj.title}
                          className="w-8 h-8 rounded object-cover bg-neutral-950 shrink-0"
                        />
                        <div className="truncate">
                          <span className="font-serif text-white text-xs truncate block">{proj.title}</span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {proj.mediaType} &bull; {proj.year}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 disabled:opacity-20"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === selectedProjectIds.length - 1}
                          className="p-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 disabled:opacity-20"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromPortfolio(proj.id)}
                          className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Checkbox Selector */}
          <div className="bg-neutral-900/60 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                Select Projects
              </span>
              <div className="relative w-48">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500" size={11} />
                <input
                  type="text"
                  value={libraryFilter}
                  onChange={(e) => setLibraryFilter(e.target.value)}
                  placeholder="Filter works..."
                  className="w-full pl-6 pr-2 py-1 bg-black/50 border border-white/10 rounded text-[11px] text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {filteredLibrary.map(proj => {
                const isSelected = selectedProjectIds.includes(proj.id);
                return (
                  <div
                    key={proj.id}
                    onClick={() => toggleProjectInclusion(proj.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white/10 border-white/30 text-white'
                        : 'bg-black/30 border-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="shrink-0">
                      {isSelected ? <CheckSquare size={14} className="text-white" /> : <Square size={14} className="text-neutral-500" />}
                    </div>
                    <img src={proj.coverUrl} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                    <span className="text-xs truncate">{proj.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* New Portfolio Version Modal */}
      {isCreatingNewVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-serif">New Portfolio Version</h3>
              <button onClick={() => setIsCreatingNewVersion(false)} className="text-neutral-400 hover:text-white">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateNewVersion} className="mt-3 space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newVersionForm.title}
                  onChange={(e) => setNewVersionForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Photography"
                  className="w-full px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">Slug (/p/:slug)</label>
                <input
                  type="text"
                  required
                  value={newVersionForm.slug}
                  onChange={(e) => setNewVersionForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="photography"
                  className="w-full px-2.5 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreatingNewVersion(false)}
                  className="px-3 py-1 text-xs font-mono text-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 bg-white text-black text-xs font-mono uppercase tracking-wider rounded font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
