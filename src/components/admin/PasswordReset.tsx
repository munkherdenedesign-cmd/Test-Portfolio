import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '../../lib/supabase';

export const PasswordReset: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) { setMessage('Supabase is not configured.'); return; }
    const { data: listener } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (session && window.location.hash.includes('type=recovery'))) setReady(true);
    });
    client.auth.getSession().then(({ data }) => {
      if (data.session && window.location.hash.includes('type=recovery')) setReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setMessage('Use at least 8 characters.'); return; }
    if (password !== confirm) { setMessage('Passwords do not match.'); return; }
    const client = getSupabaseClient();
    if (!client) return;
    setBusy(true); setMessage('');
    const { error } = await client.auth.updateUser({ password });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setMessage('Password updated. You can now sign in.');
    await client.auth.signOut();
    setReady(false);
    window.history.replaceState({}, '', '/admin/reset-password');
  };
  return <main className="min-h-screen bg-[#0b0c10] text-white flex items-center justify-center p-6"><div className="w-full max-w-sm rounded-xl border border-white/10 bg-neutral-900 p-6 space-y-4"><h1 className="text-xl">Reset admin password</h1>{ready ? <form onSubmit={submit} className="space-y-3"><input type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" required className="w-full p-3 rounded bg-black border border-white/20"/><input type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm password" required className="w-full p-3 rounded bg-black border border-white/20"/><button disabled={busy} className="w-full rounded bg-white text-black p-3">{busy?'Updating...':'Save new password'}</button></form> : <p className="text-sm text-neutral-400">Open the latest password recovery email link to set a new password. If the link has expired, request another recovery email.</p>}{message && <p role="status" className="text-sm">{message}</p>}<a href="/admin" className="block text-sm underline">Back to admin login</a></div></main>;
};
