import React, { useEffect, useState } from 'react';
import { Experience, emptyExperience, loadExperiences, saveExperiences, uploadAssetToSupabase } from '../../lib/aboutExperience';
import { ArrowLeft, Plus, Trash2, Upload } from 'lucide-react';

export function AboutExperienceEditor({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<Experience[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { loadExperiences().then(setItems); }, []);
  const update = (id: string, patch: Partial<Experience>) => setItems(old => old.map(x => x.id === id ? { ...x, ...patch } : x));
  const input = 'w-full rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-white/50';
  const field = (item: Experience, label: string, key: keyof Experience, placeholder = '') => (
    <label className="block space-y-1.5"><span className="text-[10px] text-neutral-400">{label}</span>
      <input className={input} value={item[key]} placeholder={placeholder} onChange={e => update(item.id, { [key]: e.target.value })} />
    </label>
  );
  return <div className="max-w-5xl mx-auto px-6 py-10 text-white">
    <button onClick={onBack} className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white mb-8"><ArrowLeft size={14} /> Back to dashboard</button>
    <div className="flex items-center justify-between gap-4 mb-3"><h1 className="text-2xl font-medium">About page — Work experience</h1>
      <button onClick={() => setItems(v => v.length < 5 ? [...v, emptyExperience()] : v)} disabled={items.length >= 5} className="flex items-center gap-2 text-xs bg-white text-black rounded-lg px-3 py-2 disabled:opacity-30"><Plus size={14}/> Add experience</button>
    </div>
    <p className="text-xs text-neutral-500 mb-8">Up to five hanging badges. Dragging isn't needed: badges appear in this order. Front: image, company, role, timeline. Back: description, three keywords, location, social link, and QR.</p>
    <div className="space-y-5">{items.map((item, index) => <section key={item.id} className="rounded-2xl bg-[#141417] border border-white/10 p-5">
      <div className="flex justify-between items-center mb-5"><h2 className="text-sm">Experience {index + 1}</h2><button onClick={() => setItems(v => v.filter(x => x.id !== item.id))} className="text-neutral-500 hover:text-red-400" title="Remove experience"><Trash2 size={16}/></button></div>
      <div className="grid md:grid-cols-[150px_1fr] gap-6">
        <div><div className="w-full aspect-square bg-white/5 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center text-xs text-neutral-500">{item.image ? <img src={item.image} alt="" className="w-full h-full object-cover"/> : 'No image'}</div>
          <label className="mt-3 flex gap-2 items-center justify-center cursor-pointer border border-white/20 rounded-lg py-2 text-xs hover:bg-white/10"><Upload size={13}/> Upload image
            <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={async e => { const f = e.target.files?.[0]; if (!f) return; setBusy(true); setMessage('Uploading image...'); try { update(item.id, { image: await uploadAssetToSupabase(f, 'about') }); setMessage('Image uploaded. Save changes to publish.'); } catch(err:any) { setMessage(err.message); } finally { setBusy(false); e.target.value = ''; } }}/></label>
          <div className="mt-3">{field(item, 'Badge color', 'color', '#71717a')}</div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {field(item, 'Company / organization', 'company', 'Company name')}
          {field(item, 'Job title', 'role', 'Your role')}
          {field(item, 'Work timeline (replaces barcode)', 'period', '2023 — 2025')}
          <label className="block space-y-1.5 sm:col-span-2"><span className="text-[10px] text-neutral-400">Short job description (back)</span><textarea rows={3} maxLength={240} className={input} value={item.description || ''} placeholder="What you did in this role" onChange={e => update(item.id, { description: e.target.value })}/></label>
          <div className="sm:col-span-2"><span className="text-[10px] text-neutral-400">Three keywords (back)</span><div className="grid grid-cols-3 gap-2 mt-1.5">{[0,1,2].map(i => <input key={i} className={input} maxLength={24} value={(item.keywords || [])[i] || ''} placeholder={'Keyword ' + (i+1)} onChange={e => { const keywords = [...(item.keywords || ['', '', ''])]; keywords[i] = e.target.value; update(item.id, { keywords }); }}/>)}</div></div>
          {field(item, 'Location (back)', 'location', 'Ulaanbaatar, Mongolia')}
          {field(item, 'Social media label (back)', 'socialLabel', 'Instagram')}
          {field(item, 'Social media URL (back)', 'socialUrl', 'https://...')}
        </div>
      </div>
    </section>)}</div>
    {items.length === 0 && <p className="text-sm text-neutral-500 py-12 text-center">No experience added yet. Add your first badge above.</p>}
    <div className="flex items-center justify-end gap-4 mt-8 sticky bottom-4 bg-[#0a0a0c]/95 p-3 rounded-xl border border-white/10"><span className="text-xs text-neutral-400 flex-1">{message}</span><button disabled={busy} onClick={async () => { setBusy(true); setMessage('Saving...'); try { await saveExperiences(items); setMessage('Published successfully.'); } catch(e:any) { setMessage(e.message); } finally { setBusy(false); } }} className="px-5 py-2.5 bg-white text-black text-xs font-medium rounded-lg disabled:opacity-50">{busy ? 'Working...' : 'Save & publish'}</button></div>
  </div>;
}
