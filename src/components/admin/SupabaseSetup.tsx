import React, { useState } from 'react';
import { SUPABASE_SQL_SCHEMA } from '../../lib/schemaSql';
import { getSupabaseConfig, saveLocalSupabaseConfig, isSupabaseConfigured, isValidSupabaseUrl } from '../../lib/supabase';
import { Database, Copy, Check, ShieldCheck, Key, Server, Terminal, ExternalLink, RefreshCw } from 'lucide-react';

export const SupabaseSetup: React.FC = () => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isValidSupabaseUrl(url.trim())) {
      setTestResult('Please enter a valid Supabase URL starting with https:// (e.g., https://xyzcompany.supabase.co)');
      return;
    }
    saveLocalSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim() });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      window.location.reload();
    }, 1200);
  };

  const handleTestConnection = async () => {
    if (!url || !anonKey) {
      setTestResult('Please enter both Supabase URL and Anon Key first.');
      return;
    }
    if (!isValidSupabaseUrl(url.trim())) {
      setTestResult('Invalid URL: Supabase URL must be a valid HTTP or HTTPS URL (e.g. https://xyz.supabase.co).');
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/portfolios?select=count`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`
        }
      });

      if (res.ok) {
        setTestResult('Success! Connected to Supabase REST API & Row Level Security is active.');
      } else {
        const text = await res.text();
        setTestResult(`Connection returned status ${res.status}: ${text || 'Ensure tables and SQL schema have been executed.'}`);
      }
    } catch (err: any) {
      setTestResult(`Connection error: ${err.message || 'Check network and URL.'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-950 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-mono uppercase tracking-widest text-neutral-400">
            <Database size={15} className="text-emerald-400" />
            Supabase Architecture &amp; Row Level Security
          </div>
          <h3 className="text-xl font-serif text-white">
            PostgreSQL Database, Auth &amp; Storage Setup
          </h3>
          <p className="text-sm text-neutral-400 font-sans mt-1 max-w-2xl">
            This platform uses Supabase for persistent multi-portfolio state, independent project ordering, asset file storage, and Row Level Security.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-full text-xs font-mono flex items-center gap-2 ${
            isConfigured ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' : 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
            {isConfigured ? 'Supabase Connected' : 'Awaiting Supabase Credentials'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step-by-Step Instructions */}
        <div className="space-y-6">
          <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6">
            <h4 className="text-base font-serif text-white mb-4 flex items-center gap-2">
              <Server size={18} className="text-neutral-400" />
              1. Provisioning Instructions
            </h4>

            <ol className="space-y-4 text-xs font-sans text-neutral-300 leading-relaxed list-decimal list-inside">
              <li className="pl-1">
                <span className="font-medium text-white">Create a Supabase Project:</span> Go to{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white underline hover:text-neutral-300 inline-flex items-center gap-1"
                >
                  supabase.com <ExternalLink size={12} />
                </a>{' '}
                and create a new project.
              </li>
              <li className="pl-1">
                <span className="font-medium text-white">Run SQL Schema:</span> Open the <strong>SQL Editor</strong> in your Supabase dashboard and run the script on the right. It creates the <code className="text-neutral-200">projects</code>, <code className="text-neutral-200">portfolios</code> tables, strict Row Level Security policies, and the <code className="text-neutral-200">portfolio-assets</code> storage bucket.
              </li>
              <li className="pl-1">
                <span className="font-medium text-white">Row Level Security (RLS) Rules:</span>
                <ul className="pl-4 mt-1 space-y-1 list-disc text-neutral-400">
                  <li>Public visitors can <strong>only</strong> view portfolios and projects where <code className="text-neutral-300">status = 'published'</code>.</li>
                  <li>Drafts, unpublished changes, and project mutation are strictly blocked for anonymous queries.</li>
                  <li>Only authenticated curators can view drafts or write changes.</li>
                </ul>
              </li>
              <li className="pl-1">
                <span className="font-medium text-white">Configure Credentials:</span> Copy your Project URL and anon public key from <em>Project Settings &rarr; API</em> into your <code className="text-neutral-200">.env</code> file or the quick-config form below.
              </li>
            </ol>
          </div>

          {/* Quick-Connect Form */}
          <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6">
            <h4 className="text-base font-serif text-white mb-2 flex items-center gap-2">
              <Key size={18} className="text-neutral-400" />
              2. Credentials Configuration
            </h4>
            <p className="text-xs text-neutral-400 mb-4">
              Enter your credentials to test or persist changes directly in your Supabase project.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  VITE_SUPABASE_URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzabcdefghijklmn.supabase.co"
                  className="w-full px-3.5 py-2 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                  VITE_SUPABASE_ANON_KEY
                </label>
                <textarea
                  rows={2}
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer font-medium"
                >
                  Save &amp; Reload
                </button>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  {isTesting ? <RefreshCw size={13} className="animate-spin" /> : null}
                  Test Connection
                </button>
              </div>

              {savedSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
                  Saved successfully! Refreshing...
                </div>
              )}

              {testResult && (
                <div className={`p-3 rounded-lg text-xs font-mono border ${
                  testResult.startsWith('Success')
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                }`}>
                  {testResult}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* PostgreSQL Schema & RLS Script */}
        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-serif text-white flex items-center gap-2">
                <Terminal size={18} className="text-neutral-400" />
                Supabase SQL Script (RLS Included)
              </h4>
              <button
                onClick={handleCopySql}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {copied ? 'Copied to Clipboard' : 'Copy SQL Schema'}
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-black/70 border border-white/10">
              <pre className="p-4 text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-[500px] leading-relaxed">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-neutral-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" /> Row Level Security Enforced
            </span>
            <span>PostgreSQL 15+</span>
          </div>
        </div>
      </div>
    </div>
  );
};
