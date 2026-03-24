// ═══════════════════════════════════════════════════
// VERCEL SERVERLESS FUNCTION — /api/unlock
// Checks server-side time before releasing media URLs.
// ═══════════════════════════════════════════════════

const UNLOCK_DATE = new Date('2026-05-15T23:55:00Z');

// ─── Hidden Media Payload ───
// These URLs are ONLY served when the server clock passes the unlock date.
// Replace these with your actual media links before deployment.
const MEDIA_PAYLOAD = {
  images: [
    // Add your images here. Example:
    // { url: '/media/image1.jpg', title: 'FRAGMENT_001', tag: 'PHOTO' },
    // { url: '/media/image2.png', title: 'FRAGMENT_002', tag: 'ART' },
  ],
  video: null,
  // Add your video here. Example:
  // video: { url: '/media/video.mp4', poster: '/media/poster.jpg' },
};

export default function handler(req, res) {
  // CORS headers (useful for local dev)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const now = new Date();

  if (now >= UNLOCK_DATE) {
    return res.status(200).json({
      unlocked: true,
      serverTime: now.toISOString(),
      unlockDate: UNLOCK_DATE.toISOString(),
      media: MEDIA_PAYLOAD,
    });
  }

  // Still locked — reveal nothing
  return res.status(200).json({
    unlocked: false,
    serverTime: now.toISOString(),
    unlockDate: UNLOCK_DATE.toISOString(),
    message: 'The vault is still sealed. Check back later.',
  });
}
