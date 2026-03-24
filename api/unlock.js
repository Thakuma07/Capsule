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

  // 1. Check if the vault is still locked
  if (now < UNLOCK_DATE) {
    return res.status(200).json({
      unlocked: false,
      serverTime: now.toISOString(),
      unlockDate: UNLOCK_DATE.toISOString(),
      message: 'The vault is still sealed. Check back later.',
    });
  }

  // 2. Vault is Unlocked! Reach into Vercel Blob Storage...
  try {
    // We list all your files dynamically. 
    // This way you just upload files to Vercel dashboard and they appear here instantly.
    const { blobs } = await list();

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
  } catch (error) {
    console.error('Error fetching from Vercel Blob:', error);
    return res.status(500).json({
      error: 'Failed to decrypt vault secondary layer. Check permissions.',
      unlocked: true, // we still show it's reached the date
    });
  }
}
