import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Portfolio, Project } from './types/portfolio';
import { PublicPortfolioView } from './components/PublicPortfolioView';
import { PublicSiteNavigation } from './components/PublicSiteNavigation';
import { PublicInfoPage } from './components/PublicInfoPage';
import { AdminAuth } from './components/admin/AdminAuth';
import { PasswordReset } from './components/admin/PasswordReset';
import { AdminDashboard } from './components/admin/AdminDashboard';
import {
  fetchPublishedPortfolio,
  getSupabaseClient,
  getLocalProjects,
  getLocalPortfolios
} from './lib/supabase';
import { INITIAL_PORTFOLIOS, INITIAL_PROJECTS } from './data/seedData';

export default function App() {
  const reducedMotion = useReducedMotion();
  const [transition, setTransition] = useState<{ phase: 'in' | 'out'; destination: string; side: 'left' | 'right' } | null>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [portfolioData, setPortfolioData] = useState<{ portfolio: Portfolio | null; projects: Project[] }>({
    portfolio: null,
    projects: []
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Admin authentication state
  const [adminUser, setAdminUser] = useState<any>(null);

  // Private preview state (for previewing draft changes before publishing)
  const [previewStaged, setPreviewStaged] = useState<{
    slug: string;
    stagedPortfolio: Portfolio;
  } | null>(null);

  // Listen to browser navigation (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keyboard shortcut for curator: Shift + Alt + A to toggle /admin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.altKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (window.location.pathname.startsWith('/admin')) {
          navigate('/');
        } else {
          navigate('/admin');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setPreviewStaged(null);
  };

  const navigateWithTransition = (path: string) => {
    if (path === currentPath || transition) return;
    if (reducedMotion) { navigate(path); return; }
    const side = path === '/contact' || (currentPath === '/contact' && path === '/') ? 'right' : 'left';
    setTransition({ phase: 'in', destination: path, side });
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => {
      navigate(path);
      setTransition({ phase: 'out', destination: path, side });
      transitionTimer.current = setTimeout(() => setTransition(null), 750);
    }, 850);
  };

  useEffect(() => () => { if (transitionTimer.current) clearTimeout(transitionTimer.current); }, []);

  const transitionOverlay = (
    <AnimatePresence>
      {transition && (
        <motion.div key={transition.destination + transition.side}
          aria-hidden="true"
          className="fixed inset-0 z-[100] pointer-events-none overflow-hidden bg-[#0a0a0c]"
          style={{ transformOrigin: transition.side === 'right' ? '85% 50%' : '15% 50%' }}
          initial={{ opacity: 0, scale: 0.68, x: transition.side === 'right' ? '35%' : '-35%', borderRadius: '50%' }}
          animate={transition.phase === 'in'
            ? { opacity: 1, scale: 1.35, x: '0%', borderRadius: '0%' }
            : { opacity: 0, scale: 1.8, x: transition.side === 'right' ? '-12%' : '12%', borderRadius: '0%' }}
          transition={{ duration: transition.phase === 'in' ? 0.85 : 0.72, ease: [0.76, 0, 0.24, 1] }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(90,90,100,0.17),transparent_55%)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Route resolution
  const isAdminRoute = currentPath.startsWith('/admin');

  // Load public portfolio data when on a public route
  useEffect(() => {
    if (isAdminRoute && !previewStaged) {
      setLoading(false);
      return;
    }

    const loadPublic = async () => {
      setLoading(true);

      // If we are currently in private preview mode
      if (previewStaged) {
        const allProjects = getLocalProjects();
        const projectMap = new Map(allProjects.map(p => [p.id, p]));
        const ordered = (previewStaged.stagedPortfolio.projectIds || [])
          .map(id => projectMap.get(id))
          .filter((p): p is Project => Boolean(p));

        setPortfolioData({
          portfolio: previewStaged.stagedPortfolio,
          projects: ordered
        });
        setLoading(false);
        return;
      }

      // Determine slug from current path
      // '/' -> ''
      // '/p/social-media' -> 'social-media'
      // '/p/design' -> 'design'
      let slug = '';
      if (currentPath.startsWith('/p/')) {
        slug = currentPath.replace('/p/', '');
      }

      const res = await fetchPublishedPortfolio(slug);
      if (res.portfolio) {
        setPortfolioData(res);
      } else {
        // Fallback to local portfolio and project data if not found on server
        const localPorts = getLocalPortfolios();
        const fallback = localPorts.find(p => p.slug === slug) || INITIAL_PORTFOLIOS.find(p => p.slug === slug) || localPorts[0] || INITIAL_PORTFOLIOS[0];
        const allProjects = getLocalProjects();
        const projectMap = new Map(allProjects.map(p => [p.id, p]));
        const ordered = (fallback.projectIds || [])
          .map(id => projectMap.get(id))
          .filter((p): p is Project => Boolean(p));

        setPortfolioData({
          portfolio: fallback,
          projects: ordered
        });
      }

      setLoading(false);
    };

    loadPublic();
  }, [currentPath, isAdminRoute, previewStaged]);

  // Sign out handler
  const handleSignOut = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    setAdminUser(null);
    navigate('/');
  };

  // Private preview trigger
  const handlePreviewPortfolio = (slug: string, stagedPortfolio: Portfolio) => {
    setPreviewStaged({ slug, stagedPortfolio });
    const targetUrl = slug ? `/p/${slug}` : '/';
    window.history.pushState({}, '', targetUrl);
    setCurrentPath(targetUrl);
  };

  if (currentPath === '/admin/reset-password') return <PasswordReset />;

  // 1. Render Admin Portal
  if (isAdminRoute && !previewStaged) {
    if (!adminUser) {
      return <AdminAuth onAuthenticated={(user) => setAdminUser(user)} />;
    }
    return (
      <AdminDashboard
        currentUser={adminUser}
        onSignOut={handleSignOut}
        onPreviewPortfolio={handlePreviewPortfolio}
      />
    );
  }

  // Shared navigation is present on every public route, including About and Contact.
  const publicNav = <PublicSiteNavigation currentPath={currentPath} onNavigate={navigateWithTransition} />;
  if (currentPath === '/about' || currentPath === '/contact') {
    return (
      <>
        {publicNav}
        <PublicInfoPage page={currentPath === '/about' ? 'about' : 'contact'} signatureUrl={portfolioData.portfolio?.signatureUrl} onNavigate={navigateWithTransition} />
        {transitionOverlay}
      </>
    );
  }

  // 2. Render Public Portfolio View (Minimal, editorial, no public profession tabs, no public admin links)
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center text-xs font-mono text-neutral-500">
        Loading...
      </div>
    );
  }

  if (!portfolioData.portfolio) {
    return (
      <div className="min-h-screen bg-[#0b0c10] flex flex-col items-center justify-center p-6 text-center text-white">
        <h2 className="text-xl font-medium mb-2">Portfolio Not Found</h2>
        <p className="text-sm text-neutral-400 mb-6">This portfolio does not exist or has not been published.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-white text-black text-xs font-mono uppercase tracking-wider rounded-lg cursor-pointer"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <>
      {publicNav}
      {transitionOverlay}
      <motion.div
        style={{ transformOrigin: transition?.side === 'right' ? '72% 55%' : '28% 55%' }}
        animate={transition?.phase === 'in'
          ? { scale: 1.8, x: transition.side === 'right' ? '-18%' : '18%', opacity: 0.55, filter: 'blur(5px)' }
          : { scale: 1, x: '0%', opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}>
        <PublicPortfolioView
          portfolio={portfolioData.portfolio}
          projects={portfolioData.projects}
          previewMode={Boolean(previewStaged)}
        />
      </motion.div>
    </>
  );
}
