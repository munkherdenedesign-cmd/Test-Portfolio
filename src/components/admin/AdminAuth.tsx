import React, { useState, useEffect } from 'react';
import { getSupabaseClient, isSupabaseConfigured, isAuthorizedAdmin, AUTHORIZED_ADMIN_EMAILS } from '../../lib/supabase';
import { Lock, Mail, ArrowRight, ShieldCheck, Database, KeyRound, Sparkles, Send } from 'lucide-react';

interface AdminAuthProps {
  onAuthenticated: (user: any) => void;
}

const PRIMARY_ADMIN_EMAIL = AUTHORIZED_ADMIN_EMAILS[0];

export const AdminAuth: React.FC<AdminAuthProps> = ({ onAuthenticated }) => {
  const [email, setEmail] = useState(PRIMARY_ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const supabaseConfigured = isSupabaseConfigured();

  useEffect(() => {
    // Check if user is already authenticated via Supabase session
    const checkSession = async () => {
      const client = getSupabaseClient();
      if (client) {
        const { data: { session } } = await client.auth.getSession();
        if (session?.user) {
          if (isAuthorizedAdmin(session.user.email)) {
            onAuthenticated(session.user);
          } else {
            await client.auth.signOut();
            setErrorMsg(`Access Denied: Only ${PRIMARY_ADMIN_EMAIL} is authorized to access this private admin dashboard.`);
          }
        }
      }
    };
    checkSession();
  }, [onAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');
    setLoading(true);

    const client = getSupabaseClient();
    if (!client) {
      // Local fallback mode
      if (isAuthorizedAdmin(email)) {
        onAuthenticated({ email, isLocalAdmin: true });
      } else {
        setErrorMsg(`Access Denied: Only ${PRIMARY_ADMIN_EMAIL} is authorized to access the curator portal.`);
      }
      setLoading(false);
      return;
    }

    try {
      // 1. Enforce authorized email check
      if (!isAuthorizedAdmin(email)) {
        setErrorMsg(`Access Denied: ${email} is not authorized. Only ${PRIMARY_ADMIN_EMAIL} can access.`);
        setLoading(false);
        return;
      }

      // 2. Magic Link mode
      if (isMagicLink) {
        const { error } = await client.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: window.location.origin + '/admin'
          }
        });
        if (error) throw error;
        setStatusMsg(`Magic sign-in link dispatched to ${email}! Check your inbox.`);
        setLoading(false);
        return;
      }

      // 3. Sign Up mode
      if (isSignUp) {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password
        });
        if (error) throw error;
        if (data.session && data.user) {
          if (isAuthorizedAdmin(data.user.email)) {
            onAuthenticated(data.user);
          }
        } else {
          setStatusMsg(`Admin account initialized for ${email}! You can now sign in.`);
          setIsSignUp(false);
        }
      } else {
        // 4. Password Sign In
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (error) throw error;
        if (data.user) {
          if (isAuthorizedAdmin(data.user.email)) {
            onAuthenticated(data.user);
          } else {
            await client.auth.signOut();
            throw new Error(`Access Denied: Only ${PRIMARY_ADMIN_EMAIL} is authorized.`);
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#eaeaea] flex flex-col justify-center items-center px-6 py-12 selection:bg-neutral-200 selection:text-black">
      <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-xl p-6 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-white">
            <Lock size={18} />
          </div>
          <h2 className="text-xl font-medium text-white tracking-tight">
            Admin
          </h2>
          <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>{PRIMARY_ADMIN_EMAIL}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {statusMsg && (
          <div className="mb-4 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
            {statusMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={15} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={PRIMARY_ADMIN_EMAIL}
                className="w-full pl-9 pr-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/40 transition-all font-sans"
              />
            </div>
          </div>

          {!isMagicLink && (
            <div>
              <label className="block text-xs text-neutral-400 mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={15} />
                <input
                  type="password"
                  required={!isMagicLink}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/40 transition-all font-sans"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-white hover:bg-neutral-200 text-black font-medium text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Signing in...' : isMagicLink ? 'Send Link' : isSignUp ? 'Set Password' : 'Sign In'}
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-2 text-center">
          {supabaseConfigured ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsMagicLink(!isMagicLink);
                  setErrorMsg('');
                  setStatusMsg('');
                }}
                className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send size={12} />
                {isMagicLink ? 'Use Password' : 'Use Magic Link'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setIsMagicLink(false);
                  setErrorMsg('');
                  setStatusMsg('');
                }}
                className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
              >
                {isSignUp ? 'Already have a password? Sign In' : 'Set up password'}
              </button>
            </>
          ) : (
            <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 text-left text-xs text-neutral-400">
              <div className="flex items-center gap-1.5 text-neutral-300 text-xs mb-1">
                <Database size={13} className="text-amber-400" />
                <span>Supabase</span>
              </div>
              Sign in directly as {PRIMARY_ADMIN_EMAIL} or configure database.
            </div>
          )}
        </div>
      </div>


    </div>
  );
};
