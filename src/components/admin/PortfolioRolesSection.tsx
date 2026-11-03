import React, { useState } from 'react';
import { Portfolio, Project } from '../../types/portfolio';
import {
  FolderKanban,
  ExternalLink,
  Copy,
  Check,
  Edit3,
  Plus,
  Send,
  Save,
  Eye,
  X,
  FileText
} from 'lucide-react';

interface PortfolioRolesSectionProps {
  portfolios: Portfolio[];
  projects: Project[];
  onSaveDraft: (portfolioId: string, updates: Partial<Portfolio>) => void;
  onPublish: (portfolioId: string) => void;
  onCreatePortfolio: (portfolio: Portfolio) => void;
  onPreview: (slug: string, stagedPortfolio: Portfolio) => void;
}

export const PortfolioRolesSection: React.FC<PortfolioRolesSectionProps> = ({
  portfolios,
  projects,
  onSaveDraft,
  onPublish,
  onCreatePortfolio,
  onPreview
}) => {
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Editing state
  const activeEditing = portfolios.find(p => p.id === editingPortfolioId);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editIntro, setEditIntro] = useState('');

  // Create new version state
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newIntro, setNewIntro] = useState('');

  const openEditModal = (port: Portfolio) => {
    setEditingPortfolioId(port.id);
    setEditTitle(port.draftTitle ?? port.title ?? '');
    setEditSubtitle(port.draftSubtitle ?? port.subtitle ?? '');
    setEditIntro(port.draftIntroduction ?? port.introduction ?? '');
  };

  const handleCopyLink = (slug: string) => {
    const origin = window.location.origin;
    const url = slug ? `${origin}/p/${slug}` : `${origin}/`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug || '__root__');
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleSavePortfolioInfo = (publishImmediately = false) => {
    if (!editingPortfolioId || !activeEditing) return;

    if (publishImmediately) {
      onSaveDraft(editingPortfolioId, {
        title: editTitle,
        subtitle: editSubtitle,
        introduction: editIntro,
        projectIds: activeEditing.draftProjectIds || activeEditing.projectIds,
        draftTitle: undefined,
        draftSubtitle: undefined,
        draftIntroduction: undefined,
        draftProjectIds: undefined,
        status: 'published'
      });
    } else {
      onSaveDraft(editingPortfolioId, {
        draftTitle: editTitle,
        draftSubtitle: editSubtitle,
        draftIntroduction: editIntro,
        status: 'draft'
      });
    }

    setEditingPortfolioId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const slug = newSlug.trim()
      ? newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
      : newTitle.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const newPort: Portfolio = {
      id: `port-${Date.now()}`,
      slug,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || undefined,
      introduction: newIntro.trim() || `Curated ${newTitle.trim()} portfolio.`,
      status: 'published',
      projectIds: [],
      isCustom: true,
      updatedAt: new Date().toISOString()
    };

    onCreatePortfolio(newPort);
    setIsCreatingNew(false);
    setNewTitle('');
    setNewSlug('');
    setNewSubtitle('');
    setNewIntro('');
  };

  return (
    <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <FolderKanban size={18} className="text-white" />
          <div>
            <h3 className="text-base font-serif font-medium text-white">Portfolio Role Pages</h3>
            <p className="text-xs text-neutral-400 font-mono">
              Independent public pages with custom titles and intros. Projects update across roles automatically.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreatingNew(true)}
          className="px-3.5 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto border border-white/10"
        >
          <Plus size={13} />
          <span>New Role Version</span>
        </button>
      </div>

      {/* Portfolios List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
        {portfolios.map(port => {
          const pathDisplay = port.slug ? `/p/${port.slug}` : '/';
          const activeProjectsCount = (port.projectIds || []).length;
          const hasDraft = Boolean(port.draftTitle || port.draftIntroduction || port.draftProjectIds);
          const isCopied = copiedSlug === (port.slug || '__root__');

          return (
            <div
              key={port.id}
              className="bg-black/40 border border-white/10 hover:border-white/20 rounded-xl p-4 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate">
                    <h4 className="text-sm font-medium text-white truncate">{port.title}</h4>
                    <span className="text-[11px] font-mono text-neutral-400">{pathDisplay}</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0 ${
                      hasDraft
                        ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                        : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    {hasDraft ? 'Draft' : 'Published'}
                  </span>
                </div>

                <p className="text-xs text-neutral-400 line-clamp-2 mt-2.5 font-light">
                  {port.draftIntroduction || port.introduction || 'No introduction provided.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400 text-[11px]">
                  {activeProjectsCount} {activeProjectsCount === 1 ? 'project' : 'projects'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(port)}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                    title="Edit Title & Intro"
                  >
                    <Edit3 size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyLink(port.slug)}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                    title="Copy Public Link"
                  >
                    {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>

                  <a
                    href={pathDisplay}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
                    title="Open Live Page"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Portfolio Info Modal */}
      {editingPortfolioId && activeEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121215] border border-white/20 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-base font-serif font-medium text-white">
                Edit {activeEditing.title} Page
              </h4>
              <button
                onClick={() => setEditingPortfolioId(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider">Page Headline Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider">Subtitle</label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={e => setEditSubtitle(e.target.value)}
                  placeholder="e.g., Selected Social & Creative Work"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider">Introduction Bio / Statement</label>
                <textarea
                  rows={4}
                  value={editIntro}
                  onChange={e => setEditIntro(e.target.value)}
                  placeholder="Editorial introduction for this specific portfolio role..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-white font-sans text-sm focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  onPreview(activeEditing.slug, {
                    ...activeEditing,
                    title: editTitle,
                    subtitle: editSubtitle,
                    introduction: editIntro
                  });
                }}
                className="px-3 py-2 bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white rounded-lg flex items-center gap-1.5"
              >
                <Eye size={12} />
                <span>Preview</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSavePortfolioInfo(false)}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={12} />
                  <span>Save Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSavePortfolioInfo(true)}
                  className="px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send size={12} />
                  <span>Publish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Portfolio Version Modal */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleCreateSubmit} className="bg-[#121215] border border-white/20 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-base font-serif font-medium text-white">
                New Portfolio Role Page
              </h4>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider">Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g., Photography, Motion Design"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white font-sans text-sm focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider">URL Path Slug</label>
                <div className="flex items-center bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-neutral-400">
                  <span>/p/</span>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={e => setNewSlug(e.target.value)}
                    placeholder={newTitle.toLowerCase().replace(/\s+/g, '-') || 'custom-role'}
                    className="bg-transparent text-white font-mono text-xs focus:outline-none flex-1 ml-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider">Introduction</label>
                <textarea
                  rows={3}
                  value={newIntro}
                  onChange={e => setNewIntro(e.target.value)}
                  placeholder="Editorial introduction for this new portfolio..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-white font-sans text-sm focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-3.5 py-2 text-neutral-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-5 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg font-medium cursor-pointer shadow-md disabled:opacity-50"
              >
                Create Portfolio Page
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
