import { getSupabaseClient, uploadAssetToSupabase } from './supabase';

export function isInstagramReelUrl(url: string): boolean {
  return /^https?:\/\/(?:www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]{5,40}(?:[/?#].*)?$/i.test(url.trim());
}

/**
 * Ask the authenticated Vercel function for an Instagram Reel's cover image.
 * The backend uses yt-dlp metadata only. Only the image is stored in Supabase.
 * Returns the durable Supabase Storage URL, never the expiring Instagram CDN URL.
 */
export async function extractInstagramReelCover(url: string): Promise<string> {
  if (!isInstagramReelUrl(url)) throw new Error('Paste an Instagram Reel link.');
  const client = getSupabaseClient();
  if (!client) throw new Error('Connect Supabase first.');
  const { data, error: sessionError } = await client.auth.getSession();
  if (sessionError || !data.session?.access_token) throw new Error('Sign in to your admin account first.');

  const response = await fetch('/api/reel_cover', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + data.session.access_token,
    },
    body: JSON.stringify({ url: url.trim() }),
  });

  if (!response.ok) {
    let message = 'Automatic cover unavailable. Upload a cover instead.';
    try {
      const result = await response.json();
      if (typeof result.error === 'string') message = result.error;
    } catch { /* Non-JSON deployment/error page */ }
    throw new Error(message);
  }

  const mime = (response.headers.get('Content-Type') || '').split(';')[0];
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
    throw new Error('Cover service is not available on this deployment.');
  }
  const blob = await response.blob();
  if (!blob.size || blob.size > 8 * 1024 * 1024) throw new Error('Invalid cover image.');
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const file = new File([blob], 'reel-cover-' + Date.now() + '.' + ext, { type: mime });
  return uploadAssetToSupabase(file, 'covers');
}
