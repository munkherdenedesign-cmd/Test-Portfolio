export interface ParsedMediaLink {
  platform: 'instagram' | 'facebook' | 'youtube' | 'vimeo' | 'website' | 'direct_image' | 'direct_video' | 'direct_pdf';
  subtype: 'reel' | 'post' | 'video' | 'website' | 'document' | 'image';
  label: string;
  mediaType: 'embed' | 'image' | 'video' | 'pdf' | 'website';
  aspectRatio: '9/16' | '1/1' | '16/9' | '4/3' | '3/4' | 'auto';
  embedUrl: string;
  embedCode: string;
  originalUrl: string;
  suggestedTitle: string;
  thumbnailUrl?: string;
}

export function parseSocialOrMediaUrl(inputUrl: string): ParsedMediaLink | null {
  if (!inputUrl || typeof inputUrl !== 'string') return null;
  const url = inputUrl.trim();
  if (!url) return null;

  // 1. Instagram Reel
  const igReelMatch = url.match(/instagram\.com\/reel\/([a-zA-Z0-9_-]+)/i);
  if (igReelMatch) {
    const code = igReelMatch[1];
    const cleanUrl = `https://www.instagram.com/reel/${code}/`;
    return {
      platform: 'instagram',
      subtype: 'reel',
      label: 'Instagram Reel',
      mediaType: 'embed',
      aspectRatio: '9/16',
      originalUrl: cleanUrl,
      embedUrl: `https://www.instagram.com/reel/${code}/embed/`,
      embedCode: `<iframe src="https://www.instagram.com/reel/${code}/embed/" class="w-full h-full border-none rounded-xl" frameborder="0" scrolling="no" allowtransparency="true"></iframe>`,
      suggestedTitle: `Instagram Reel (${code})`
    };
  }

  // 2. Instagram Post
  const igPostMatch = url.match(/instagram\.com\/p\/([a-zA-Z0-9_-]+)/i);
  if (igPostMatch) {
    const code = igPostMatch[1];
    const cleanUrl = `https://www.instagram.com/p/${code}/`;
    return {
      platform: 'instagram',
      subtype: 'post',
      label: 'Instagram Post',
      mediaType: 'embed',
      aspectRatio: '1/1',
      originalUrl: cleanUrl,
      embedUrl: `https://www.instagram.com/p/${code}/embed/`,
      embedCode: `<iframe src="https://www.instagram.com/p/${code}/embed/" class="w-full h-full border-none rounded-xl" frameborder="0" scrolling="no" allowtransparency="true"></iframe>`,
      suggestedTitle: `Instagram Post (${code})`
    };
  }

  // 3. Facebook Reel
  const fbReelMatch = url.match(/facebook\.com\/reel\/([0-9]+)/i) || url.match(/fb\.watch\/([a-zA-Z0-9_-]+)/i);
  if (fbReelMatch || (url.includes('facebook.com') && url.includes('reel'))) {
    const cleanUrl = url.split('?')[0];
    const encoded = encodeURIComponent(cleanUrl);
    return {
      platform: 'facebook',
      subtype: 'reel',
      label: 'Facebook Reel',
      mediaType: 'embed',
      aspectRatio: '9/16',
      originalUrl: cleanUrl,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false`,
      embedCode: `<iframe src="https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false" class="w-full h-full border-none rounded-xl" frameborder="0" scrolling="no" allowfullscreen="true"></iframe>`,
      suggestedTitle: 'Facebook Reel'
    };
  }

  // 4. Facebook Post / Video
  if (url.includes('facebook.com')) {
    const cleanUrl = url.split('?')[0];
    const encoded = encodeURIComponent(cleanUrl);
    const isVideo = url.includes('/videos/') || url.includes('/watch');
    return {
      platform: 'facebook',
      subtype: isVideo ? 'video' : 'post',
      label: isVideo ? 'Facebook Video' : 'Facebook Post',
      mediaType: 'embed',
      aspectRatio: isVideo ? '16/9' : '1/1',
      originalUrl: cleanUrl,
      embedUrl: isVideo
        ? `https://www.facebook.com/plugins/video.php?href=${encoded}&show_text=false`
        : `https://www.facebook.com/plugins/post.php?href=${encoded}&show_text=true`,
      embedCode: `<iframe src="https://www.facebook.com/plugins/${isVideo ? 'video' : 'post'}.php?href=${encoded}&show_text=${isVideo ? 'false' : 'true'}" class="w-full h-full border-none rounded-xl" frameborder="0" scrolling="no" allowfullscreen="true"></iframe>`,
      suggestedTitle: isVideo ? 'Facebook Video' : 'Facebook Post'
    };
  }

  // 5. YouTube / Vimeo Video Links
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
  if (ytMatch) {
    const videoId = ytMatch[1];
    const isShorts = url.includes('/shorts/');
    return {
      platform: 'youtube',
      subtype: isShorts ? 'reel' : 'video',
      label: isShorts ? 'YouTube Short' : 'YouTube Video',
      mediaType: 'video',
      aspectRatio: isShorts ? '9/16' : '16/9',
      originalUrl: url,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      embedCode: `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" class="w-full h-full border-none rounded-xl" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      suggestedTitle: isShorts ? 'YouTube Short' : 'YouTube Video'
    };
  }

  // 6. Direct image / video / pdf files
  const lower = url.toLowerCase();
  if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov')) {
    return {
      platform: 'direct_video',
      subtype: 'video',
      label: 'Direct Video (MP4)',
      mediaType: 'video',
      aspectRatio: '16/9',
      originalUrl: url,
      embedUrl: url,
      embedCode: '',
      suggestedTitle: 'Video Project'
    };
  }

  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp') || lower.endsWith('.gif')) {
    return {
      platform: 'direct_image',
      subtype: 'image',
      label: 'Direct Image',
      mediaType: 'image',
      aspectRatio: '16/9',
      originalUrl: url,
      embedUrl: url,
      embedCode: '',
      thumbnailUrl: url,
      suggestedTitle: 'Image Project'
    };
  }

  if (lower.endsWith('.pdf')) {
    return {
      platform: 'direct_pdf',
      subtype: 'document',
      label: 'PDF Document',
      mediaType: 'pdf',
      aspectRatio: '3/4',
      originalUrl: url,
      embedUrl: url,
      embedCode: '',
      suggestedTitle: 'Document Publication'
    };
  }

  // 7. General Website
  let domain = '';
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {
    domain = 'Website';
  }

  return {
    platform: 'website',
    subtype: 'website',
    label: 'Live Website',
    mediaType: 'website',
    aspectRatio: '16/9',
    originalUrl: url,
    embedUrl: url,
    embedCode: `<iframe src="${url}" class="w-full h-full border-none rounded-xl"></iframe>`,
    suggestedTitle: domain.charAt(0).toUpperCase() + domain.slice(1)
  };
}
