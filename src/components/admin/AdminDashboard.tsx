import React, { useState, useEffect } from 'react';
import { Project, Portfolio } from '../../types/portfolio';
import { SimpleAddProject } from './SimpleAddProject';
import { EditProjectModal } from './EditProjectModal';
import { SupabaseSetup } from './SupabaseSetup';
import { BackupAndSync } from './BackupAndSync';
import { Signature } from '../Signature';
import { addBrand, removeBrand, fetchBrandCatalog, getBrandOptions } from '../../lib/brandCatalog';
import {
  fetchAdminData,
  saveLocalProjects,
  saveLocalPortfolios,
  getSupabaseClient,
  isSupabaseConfigured
} from '../../lib/supabase';
import {
  ExternalLink,
  LogOut,
  CheckCircle2,
  Edit2,
  Trash2,
  Plus,
  Video,
  Image as ImageIcon,
  FileText,
  Globe,
  Sparkles,
  Database,
  Copy,
  Check,
  Eye,
  Send,
  PenTool,
  Upload,
  X
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: any;
  onSignOut: () => void;
  onPreviewPortfolio: (slug: string, stagedPortfolio: Portfolio) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onSignOut,
  onPreviewPortfolio
}) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Active role selected in the NAVBAR: 'all' or portfolio.id
  const [activeNavbarRole, setActiveNavbarRole] = useState<string>('all');

  // Modals
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingRoleIntro, setEditingRoleIntro] = useState<Portfolio | null>(null);
  const [introText, setIntroText] = useState('');
  const [headlineTitle, setHeadlineTitle] = useState('');
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newRoleSlug, setNewRoleSlug] = useState('');
  const [showDbModal, setShowDbModal] = useState(false);
  const [showBrandsModal, setShowBrandsModal] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [newBrand, setNewBrand] = useState('');
  const [brandBusy, setBrandBusy] = useState(false);
  const [brandError, setBrandError] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureUrlInput, setSignatureUrlInput] = useState(() => {
    return localStorage.getItem('portfolio_signature_url') || '';
  });
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchAdminData();
      setPortfolios(data.portfolios);
      setProjects(data.projects);
      setBrands(await fetchBrandCatalog());
      setLoading(false);
    };
    load();
  }, []);

  // Handlers
  const handleAddProject = async (newProj: Project, assignedPortfolioIds: string[]) => {
    const updatedProjects = [newProj, ...projects];
    setProjects(updatedProjects);
    saveLocalProjects(updatedProjects);

    // Update portfolios to include this new project
    const updatedPortfolios = portfolios.map(port => {
      const shouldInclude = assignedPortfolioIds.includes(port.id);
      const currentList = port.projectIds || [];
      if (shouldInclude && !currentList.includes(newProj.id)) {
        return {
          ...port,
          projectIds: [newProj.id, ...currentList],
          draftProjectIds: port.draftProjectIds ? [newProj.id, ...port.draftProjectIds] : undefined
        };
      }
      return port;
    });
    setPortfolios(updatedPortfolios);
    saveLocalPortfolios(updatedPortfolios);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('projects').insert([{
          id: newProj.id,
          title: newProj.title,
          client: newProj.client,
          year: newProj.year,
          description: newProj.description,
          tags: newProj.tags,
          cover_url: newProj.coverUrl,
          media_type: newProj.mediaType,
          media_url: newProj.mediaUrl,
          aspect_ratio: newProj.aspectRatio,
          external_link: newProj.externalLink,
          embed_code: newProj.embedCode,
          details: newProj.details
        }]);

        for (const portId of assignedPortfolioIds) {
          const target = updatedPortfolios.find(p => p.id === portId);
          if (target) {
            await client.from('portfolios').update({
              project_ids: target.projectIds,
              updated_at: new Date().toISOString()
            }).eq('id', portId);
          }
        }
      } catch (e) {
        console.warn('Supabase sync error:', e);
      }
    }
    showNotification(`Added "${newProj.title}"`);
  };

  const handleUpdateProject = async (updatedProj: Project, assignedPortfolioIds: string[]) => {
    // 1. Update project in master list
    const updatedProjects = projects.map(p => (p.id === updatedProj.id ? updatedProj : p));
    setProjects(updatedProjects);
    saveLocalProjects(updatedProjects);

    // 2. Update portfolio memberships
    const updatedPortfolios = portfolios.map(port => {
      const shouldInclude = assignedPortfolioIds.includes(port.id);
      const currentList = port.projectIds || [];
      const isAlreadyIn = currentList.includes(updatedProj.id);

      if (shouldInclude && !isAlreadyIn) {
        return {
          ...port,
          projectIds: [updatedProj.id, ...currentList],
          draftProjectIds: port.draftProjectIds ? [updatedProj.id, ...port.draftProjectIds] : undefined
        };
      } else if (!shouldInclude && isAlreadyIn) {
        return {
          ...port,
          projectIds: currentList.filter(id => id !== updatedProj.id),
          draftProjectIds: port.draftProjectIds ? port.draftProjectIds.filter(id => id !== updatedProj.id) : undefined
        };
      }
      return port;
    });
    setPortfolios(updatedPortfolios);
    saveLocalPortfolios(updatedPortfolios);

    // 3. Persist to Supabase
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('projects').update({
          title: updatedProj.title,
          client: updatedProj.client,
          year: updatedProj.year,
          description: updatedProj.description,
          tags: updatedProj.tags,
          cover_url: updatedProj.coverUrl,
          media_type: updatedProj.mediaType,
          media_url: updatedProj.mediaUrl,
          aspect_ratio: updatedProj.aspectRatio,
          external_link: updatedProj.externalLink,
          embed_code: updatedProj.embedCode,
          details: updatedProj.details,
          updated_at: new Date().toISOString()
        }).eq('id', updatedProj.id);

        for (const port of updatedPortfolios) {
          await client.from('portfolios').update({
            project_ids: port.projectIds,
            updated_at: new Date().toISOString()
          }).eq('id', port.id);
        }
      } catch (e) {
        console.warn('Supabase sync error:', e);
      }
    }
    showNotification(`Updated "${updatedProj.title}" across all roles`);
  };

  const handleDeleteProject = async (projectId: string) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);
    saveLocalProjects(updatedProjects);

    const updatedPortfolios = portfolios.map(port => ({
      ...port,
      projectIds: (port.projectIds || []).filter(id => id !== projectId),
      draftProjectIds: port.draftProjectIds ? port.draftProjectIds.filter(id => id !== projectId) : undefined
    }));
    setPortfolios(updatedPortfolios);
    saveLocalPortfolios(updatedPortfolios);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('projects').delete().eq('id', projectId);
      } catch (e) {
        console.warn('Supabase delete error:', e);
      }
    }
    showNotification('Project deleted');
  };

  const handleSaveRoleIntro = async (publish: boolean) => {
    if (!editingRoleIntro) return;

    const updated = portfolios.map(p => {
      if (p.id === editingRoleIntro.id) {
        return {
          ...p,
          title: publish ? headlineTitle : p.title,
          introduction: publish ? introText : p.introduction,
          draftTitle: publish ? undefined : headlineTitle,
          draftIntroduction: publish ? undefined : introText,
          status: (publish ? 'published' : 'draft') as any,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });

    setPortfolios(updated);
    saveLocalPortfolios(updated);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('portfolios').update({
          title: publish ? headlineTitle : undefined,
          introduction: publish ? introText : undefined,
          draft_title: publish ? null : headlineTitle,
          draft_introduction: publish ? null : introText,
          status: publish ? 'published' : 'draft',
          updated_at: new Date().toISOString()
        }).eq('id', editingRoleIntro.id);
      } catch (e) {
        console.warn('Supabase update error:', e);
      }
    }

    showNotification(publish ? 'Page Published' : 'Draft Saved');
    setEditingRoleIntro(null);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleTitle.trim()) return;

    const slug = newRoleSlug.trim()
      ? newRoleSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
      : newRoleTitle.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const newPort: Portfolio = {
      id: `port-${Date.now()}`,
      slug,
      title: newRoleTitle.trim(),
      introduction: `Curated ${newRoleTitle.trim()} portfolio.`,
      status: 'published',
      projectIds: [],
      isCustom: true,
      updatedAt: new Date().toISOString()
    };

    const updated = [...portfolios, newPort];
    setPortfolios(updated);
    saveLocalPortfolios(updated);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('portfolios').insert([{
          id: newPort.id,
          slug: newPort.slug,
          title: newPort.title,
          introduction: newPort.introduction,
          status: newPort.status,
          project_ids: newPort.projectIds,
          is_custom: true
        }]);
      } catch (e) {
        console.warn('Supabase error:', e);
      }
    }

    setActiveNavbarRole(newPort.id);
    setIsCreatingRole(false);
    setNewRoleTitle('');
    setNewRoleSlug('');
    showNotification(`Created "${newPort.title}" page`);
  };

  const copyRoleLink = (slug: string) => {
    const origin = window.location.origin;
    const url = slug ? `${origin}/p/${slug}` : `${origin}/`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug || '__root__');
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Filter projects by navbar selection
  const selectedPortfolio = portfolios.find(p => p.id === activeNavbarRole);
  const filteredProjects = projects.filter(project => {
    if (activeNavbarRole === 'all') return true;
    if (!selectedPortfolio) return true;
    return (
      (selectedPortfolio.projectIds || []).includes(project.id) ||
      (selectedPortfolio.draftProjectIds || []).includes(project.id)
    );
  });

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#eaeaea] selection:bg-white selection:text-black pb-20">
      {/* NAVBAR WITH ROLES / PAGES */}
      <header className="px-6 md:px-10 py-3 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-0.5 font-mono">
          <span className="text-sm font-mono font-medium text-white shrink-0">Admin</span>

          {/* Role Pages inside Navbar */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-mono shrink-0">
            <button
              onClick={() => setActiveNavbarRole('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeNavbarRole === 'all'
                  ? 'bg-white text-black font-medium'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All ({projects.length})
            </button>

            {portfolios.map(port => {
              const isCurrent = activeNavbarRole === port.id;
              const count = (port.projectIds || []).length;
              return (
                <button
                  key={port.id}
                  onClick={() => setActiveNavbarRole(port.id)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-white text-black font-medium'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>{port.title}</span>
                  <span className={`text-[10px] ${isCurrent ? 'text-neutral-600' : 'text-neutral-500'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}

            {/* Quick add role button */}
            <button
              onClick={() => setIsCreatingRole(true)}
              className="p-1 text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
              title="Add New Role Page"
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <button type="button" onClick={() => { setBrandError(''); setShowBrandsModal(true); }}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-mono rounded-lg border border-white/10">
            Brands
          </button>
          <button
            onClick={() => setShowSignatureModal(true)}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-mono rounded-lg flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
            title="Custom Signature Settings"
          >
            <PenTool size={12} />
            <span className="hidden sm:inline">Signature</span>
          </button>

          <a
            href={selectedPortfolio ? (selectedPortfolio.slug ? `/p/${selectedPortfolio.slug}` : '/') : '/'}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-mono rounded-lg flex items-center gap-1 border border-white/10 transition-colors"
          >
            <span>View</span>
            <ExternalLink size={11} />
          </a>

          <button
            onClick={() => setShowDbModal(true)}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Database"
          >
            <Database size={15} />
          </button>

          <button
            onClick={onSignOut}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Role Action Strip (Only when a specific role is selected in navbar) */}
      {selectedPortfolio && activeNavbarRole !== 'all' && (
        <div className="px-6 md:px-10 py-2.5 bg-neutral-900/40 flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-white/5">
          <div className="flex items-center gap-3 truncate">
            <span className="text-white font-medium">{selectedPortfolio.title}</span>
            <span className="text-neutral-500">
              {selectedPortfolio.slug ? `/p/${selectedPortfolio.slug}` : '/'}
            </span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-400 truncate max-w-md hidden sm:inline">
              {selectedPortfolio.draftIntroduction || selectedPortfolio.introduction}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setEditingRoleIntro(selectedPortfolio);
                setHeadlineTitle(selectedPortfolio.draftTitle || selectedPortfolio.title);
                setIntroText(selectedPortfolio.draftIntroduction || selectedPortfolio.introduction);
              }}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white rounded-md cursor-pointer transition-colors"
            >
              Edit Intro
            </button>

            <button
              onClick={() => copyRoleLink(selectedPortfolio.slug)}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white rounded-md cursor-pointer transition-colors flex items-center gap-1.5"
              title="Copy Public Link"
            >
              {copiedSlug === (selectedPortfolio.slug || '__root__') ? (
                <>
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 px-3.5 py-2 rounded-xl bg-white text-black font-mono text-xs shadow-2xl flex items-center gap-1.5">
          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 md:px-10 py-6 space-y-6">
        {loading ? (
          <div className="py-20 text-center text-xs font-mono text-neutral-500">
            Loading...
          </div>
        ) : (
          <>
            {/* 1. Ultra-Simple Add Project (1-step input) */}
            <SimpleAddProject
              portfolios={portfolios}
              activeRoleFilter={activeNavbarRole}
              onAddProject={handleAddProject}
            />

            {/* 2. Projects Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400 pt-2">
                <span>
                  {activeNavbarRole === 'all'
                    ? `All Projects (${projects.length})`
                    : `${selectedPortfolio?.title} (${filteredProjects.length})`}
                </span>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <p className="text-neutral-400 text-xs font-mono">
                    No projects in this portfolio yet. Use the bar above to add one.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.map(project => {
                    const assigned = portfolios.filter(
                      p => (p.projectIds || []).includes(project.id) || (p.draftProjectIds || []).includes(project.id)
                    );

                    return (
                      <div
                        key={project.id}
                        className="bg-neutral-900/40 border border-white/10 hover:border-white/20 rounded-xl overflow-hidden transition-all flex flex-col justify-between group shadow-sm"
                      >
                        {/* Cover preview */}
                        <div className="relative aspect-video bg-neutral-950 overflow-hidden">
                          <img
                            src={project.coverUrl || project.mediaUrl}
                            alt={project.title}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-white flex items-center gap-1 border border-white/10">
                            {project.mediaType === 'video' && <Video size={10} />}
                            {project.mediaType === 'image' && <ImageIcon size={10} />}
                            {project.mediaType === 'pdf' && <FileText size={10} />}
                            {project.mediaType === 'website' && <Globe size={10} />}
                            {project.mediaType === 'embed' && <Sparkles size={10} className="text-amber-400" />}
                            <span className="capitalize">{project.mediaType}</span>
                          </div>
                        </div>

                        {/* Info & Edit Action */}
                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-medium text-white line-clamp-1">{project.title}</h4>
                              <span className="text-[10px] font-mono text-neutral-500">{project.year || '2026'}</span>
                            </div>

                            {/* Assigned roles badges */}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {assigned.map(p => (
                                <span
                                  key={p.id}
                                  className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-neutral-400"
                                >
                                  {p.title}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setEditingProject(project)}
                              className="px-3 py-1 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-mono font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                            >
                              <Edit2 size={11} />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteProject(project.id)}
                              className="p-1 text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          portfolios={portfolios}
          brandOptions={getBrandOptions(projects, brands)}
          onClose={() => setEditingProject(null)}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
        />
      )}

      {/* Edit Role Headline & Intro Modal */}
      {editingRoleIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121215] border border-white/20 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h4 className="text-sm font-mono font-medium text-white">
                Edit {editingRoleIntro.title} Intro
              </h4>
              <button
                onClick={() => setEditingRoleIntro(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider">Page Title</label>
                <input
                  type="text"
                  value={headlineTitle}
                  onChange={e => setHeadlineTitle(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white font-sans text-xs focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider">Editorial Intro</label>
                <textarea
                  rows={4}
                  value={introText}
                  onChange={e => setIntroText(e.target.value)}
                  placeholder="Introductory statement..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-white font-sans text-xs focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => {
                  onPreviewPortfolio(editingRoleIntro.slug, {
                    ...editingRoleIntro,
                    title: headlineTitle,
                    introduction: introText
                  });
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-neutral-300 rounded-lg flex items-center gap-1"
              >
                <Eye size={12} />
                <span>Preview</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveRoleIntro(false)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-neutral-300 rounded-lg"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveRoleIntro(true)}
                  className="px-4 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-lg font-medium flex items-center gap-1 shadow-sm"
                >
                  <Send size={12} />
                  <span>Publish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create New Role Page Modal */}
      {isCreatingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleCreateRole} className="bg-[#121215] border border-white/20 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h4 className="text-sm font-mono font-medium text-white">New Role Page</h4>
              <button
                type="button"
                onClick={() => setIsCreatingRole(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider">Role Name *</label>
                <input
                  type="text"
                  required
                  value={newRoleTitle}
                  onChange={e => setNewRoleTitle(e.target.value)}
                  placeholder="e.g. Photography"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white font-sans text-xs focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 uppercase tracking-wider">URL Slug (/p/...)</label>
                <input
                  type="text"
                  value={newRoleSlug}
                  onChange={e => setNewRoleSlug(e.target.value)}
                  placeholder="photography"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-white"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => setIsCreatingRole(false)}
                className="px-3 py-1.5 text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newRoleTitle.trim()}
                className="px-4 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-lg font-medium shadow-sm disabled:opacity-40"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {showBrandsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowBrandsModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-[#121215] p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-white">Manage Brands</h3>
              <button type="button" onClick={() => setShowBrandsModal(false)} aria-label="Close"><X size={17}/></button>
            </div>
            <p className="text-xs text-neutral-400">Add brands here, then select them in Edit Project. Brands already used by projects are listed automatically.</p>
            <form onSubmit={async e => {
              e.preventDefault();
              if (!newBrand.trim()) return;
              setBrandBusy(true); setBrandError('');
              try { await addBrand(newBrand); setBrands(prev => [...prev, newBrand.trim()]); setNewBrand(''); }
              catch (err: any) { setBrandError(err.message || 'Could not save brand'); }
              finally { setBrandBusy(false); }
            }} className="flex gap-2">
              <input value={newBrand} onChange={e => setNewBrand(e.target.value)} placeholder="Company / brand name" maxLength={100}
                className="flex-1 min-w-0 bg-black/50 border border-white/15 rounded-lg px-3 py-2 text-xs text-white"/>
              <button type="submit" disabled={brandBusy || !newBrand.trim()} className="bg-white text-black rounded-lg px-4 py-2 text-xs disabled:opacity-50">Add</button>
            </form>
            {brandError && <p role="alert" className="text-xs text-amber-400">{brandError}</p>}
            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {getBrandOptions(projects, brands).map(name => (
                <div key={name} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-xs">
                  <span>{name}</span>
                  {brands.some(b => b.toLowerCase() === name.toLowerCase()) && (
                    <button type="button" disabled={brandBusy} aria-label={'Remove ' + name} className="text-neutral-500 hover:text-rose-400"
                      onClick={async () => { setBrandBusy(true); setBrandError(''); try { await removeBrand(name); setBrands(prev => prev.filter(b => b !== name)); } catch(err: any) { setBrandError(err.message || 'Could not remove brand'); } finally { setBrandBusy(false); } }}>
                      <X size={13}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Supabase Database Modal */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#121215] border border-white/20 rounded-2xl w-full max-w-xl my-8 overflow-hidden shadow-2xl relative">
            <div className="px-6 py-3 border-b border-white/10 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2">
                <Database size={15} className="text-white" />
                <h3 className="text-sm font-mono font-medium text-white">Database Settings</h3>
              </div>
              <button onClick={() => setShowDbModal(false)} className="p-1 text-neutral-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              <BackupAndSync />
              <SupabaseSetup />
            </div>
          </div>
        </div>
      )}

      {/* Signature Settings Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto font-mono">
          <div className="bg-[#121215] border border-white/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2">
                <PenTool size={15} className="text-white" />
                <h3 className="text-sm font-mono font-medium text-white">Signature &amp; Exclusion Effect</h3>
              </div>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs font-mono">
              {/* Exclusion Live Preview Canvas */}
              <div>
                <span className="block text-neutral-400 uppercase tracking-wider mb-2 text-[11px]">
                  Live Preview (Exclusion Effect)
                </span>
                <div className="relative rounded-xl overflow-hidden border border-white/15 h-28 flex items-center justify-center bg-gradient-to-r from-[#0a0a0c] via-neutral-800 to-neutral-200 p-4">
                  <div className="mix-blend-exclusion">
                    <Signature signatureUrl={signatureUrlInput} />
                  </div>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1.5">
                  The signature is placed at the top center with mix-blend-mode: exclusion, inverting against dark, light, and 3D moving spheres.
                </p>
              </div>

              {/* Upload PNG or SVG */}
              <div className="space-y-2">
                <span className="block text-neutral-400 uppercase tracking-wider text-[11px]">
                  Upload PNG or SVG File
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="admin-signature-upload"
                    className="hidden"
                    accept="image/png,image/svg+xml,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const res = reader.result as string;
                        setSignatureUrlInput(res);
                        localStorage.setItem('portfolio_signature_url', res);
                        showNotification('Signature file loaded');
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <label
                    htmlFor="admin-signature-upload"
                    className="px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                  >
                    <Upload size={13} />
                    <span>Choose PNG / SVG</span>
                  </label>
                  {signatureUrlInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setSignatureUrlInput('');
                        localStorage.removeItem('portfolio_signature_url');
                        showNotification('Reset to default vector signature');
                      }}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-neutral-300 rounded-xl text-xs font-mono transition-colors"
                    >
                      Reset to Default
                    </button>
                  )}
                </div>
              </div>

              {/* Paste Direct URL */}
              <div className="space-y-1.5">
                <span className="block text-neutral-400 uppercase tracking-wider text-[11px]">
                  Or Paste Signature Image URL
                </span>
                <input
                  type="text"
                  value={signatureUrlInput}
                  onChange={(e) => {
                    setSignatureUrlInput(e.target.value);
                    if (e.target.value.trim()) {
                      localStorage.setItem('portfolio_signature_url', e.target.value.trim());
                    } else {
                      localStorage.removeItem('portfolio_signature_url');
                    }
                  }}
                  placeholder="https://.../signature.png or svg"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-white font-mono"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSignatureModal(false)}
                  className="px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-xl font-medium text-xs font-mono transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
