import { list } from '@vercel/blob';

// ═══════════════════════════════════════════════════
// VERCEL SERVERLESS FUNCTION — /api/unlock
// Checks server-side time before releasing media URLs from Vercel Blob.
// ═══════════════════════════════════════════════════

const UNLOCK_DATE = new Date('2026-05-15T23:55:00Z');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const now = new Date();

  // 2. Fetch all blobs early so we can pick teasers
  let blobs = [];
  try {
    const response = await list();
    blobs = response.blobs;
  } catch (error) {
    console.error('Error fetching from Vercel Blob:', error);
    // Don't fail yet, we might still want to return the lock status
  }

  // 3. Helper to find teasers (files with 'teaser' in name, or just the first of each type)
  const getTeasers = () => {
    const teaserImg = blobs.find(b => b.pathname.toLowerCase().includes('teaser') && b.pathname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) 
                      || blobs.find(b => b.pathname.match(/\.(jpg|jpeg|png|gif|webp)$/i));
    
    const teaserVid = blobs.find(b => b.pathname.toLowerCase().includes('teaser') && b.pathname.match(/\.(mp4|webm|mov)$/i))
                      || blobs.find(b => b.pathname.match(/\.(mp4|webm|mov)$/i));
    
    return {
      image: teaserImg ? { url: teaserImg.url, title: 'TEASER_IMAGE', tag: 'PREVIEW' } : null,
      video: teaserVid ? { url: teaserVid.url, title: 'TEASER_VIDEO', tag: 'CLIP' } : null,
      totalLockedCount: Math.max(0, blobs.length - (teaserImg ? 1 : 0) - (teaserVid ? 1 : 0))
    };
  };

  // 4. Check if the vault is still locked
  if (now < UNLOCK_DATE) {
    const teasers = getTeasers();
    return res.status(200).json({
      unlocked: false,
      serverTime: now.toISOString(),
      unlockDate: UNLOCK_DATE.toISOString(),
      message: 'The vault is still sealed. Check back later.',
      teasers: teasers,
    });
  }

  // 5. Vault is Unlocked! Reach into Vercel Blob Storage...
  // Separate Images and Videos
  const images = blobs
    .filter(b => b.pathname.match(/\.(jpg|jpeg|png|gif|webp)$/i))
    .map(b => ({
      url: b.url,
      title: b.pathname.replace(/^.*[\\\/]/, '').split('.')[0].toUpperCase(),
      tag: 'IMAGE'
    }));

  const videos = blobs
    .filter(b => b.pathname.match(/\.(mp4|webm|mov)$/i))
    .map(b => ({
      url: b.url,
      title: b.pathname.replace(/^.*[\\\/]/, '').split('.')[0].toUpperCase(),
      tag: 'VIDEO'
    }));

  return res.status(200).json({
    unlocked: true,
    serverTime: now.toISOString(),
    unlockDate: UNLOCK_DATE.toISOString(),
    media: {
      message: "/// VAULT CONTENTS RECOVERED ///\nThe timeline has been restored. All artifacts decrypted successfully.",
      images: images,
      videos: videos,
    },
  });
}
