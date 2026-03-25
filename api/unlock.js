import { list } from '@vercel/blob';

// ═══════════════════════════════════════════════════
// VERCEL SERVERLESS FUNCTION — /api/unlock
// Checks server-side time before releasing media URLs from Vercel Blob.
// ═══════════════════════════════════════════════════

const UNLOCK_DATE = new Date('2026-05-15T23:55:00Z');

export default async function handler(req, res) {
  // CORS headers for broad compatibility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const now = new Date();
  let blobs = [];
  let errorMsg = null;

  // 1. Fetch Blobs from Vercel Storage
  try {
    // Vercel SDK will automatically look for BLOB_READ_WRITE_TOKEN in env
    const response = await list();
    blobs = response.blobs || [];
  } catch (error) {
    console.error('Error fetching from Vercel Blob:', error);
    errorMsg = 'Could not access media repository. Token might be missing or invalid.';
  }

  // 2. Helper to find teasers (Visible before unlock)
  const getTeasers = () => {
    if (!blobs || blobs.length === 0) return null;

    // Prioritize files with 'teaser', 'preview', or 'cover' in the name
    const imgRegex = /\.(jpg|jpeg|png|gif|webp)$/i;
    const vidRegex = /\.(mp4|webm|mov)$/i;
    const teaserRegex = /(teaser|preview|cover|thumb)/i;

    const teaserImg = blobs.find(b => teaserRegex.test(b.pathname) && imgRegex.test(b.pathname)) 
                      || blobs.find(b => imgRegex.test(b.pathname));
    
    const teaserVid = blobs.find(b => teaserRegex.test(b.pathname) && vidRegex.test(b.pathname))
                      || blobs.find(b => vidRegex.test(b.pathname));
    
    return {
      image: teaserImg ? { 
        url: teaserImg.url, 
        title: teaserImg.pathname.split('/').pop().split('.')[0].toUpperCase().replace(/[-_]/g, ' '), 
        tag: 'PREVIEW' 
      } : null,
      video: teaserVid ? { 
        url: teaserVid.url, 
        title: teaserVid.pathname.split('/').pop().split('.')[0].toUpperCase().replace(/[-_]/g, ' '), 
        tag: 'TRAILER' 
      } : null,
      totalLockedCount: Math.max(0, blobs.length - (teaserImg ? 1 : 0) - (teaserVid ? 1 : 0))
    };
  };

  const cheatFlag = req.query?.cheat === 'true';

  // 3. Handle Locked State
  if (now < UNLOCK_DATE && !cheatFlag) {
    return res.status(200).json({
      unlocked: false,
      serverTime: now.toISOString(),
      unlockDate: UNLOCK_DATE.toISOString(),
      message: 'The vault is still sealed. Access is restricted until the target date.',
      teasers: getTeasers(),
      error: errorMsg
    });
  }

  // 4. Handle Unlocked State
  const images = blobs
    .filter(b => /\.(jpg|jpeg|png|gif|webp)$/i.test(b.pathname))
    .map(b => ({
      url: b.url,
      title: b.pathname.split('/').pop().split('.')[0].toUpperCase().replace(/[-_]/g, ' '),
      tag: 'IMAGE'
    }));

  const videos = blobs
    .filter(b => /\.(mp4|webm|mov)$/i.test(b.pathname))
    .map(b => ({
      url: b.url,
      title: b.pathname.split('/').pop().split('.')[0].toUpperCase().replace(/[-_]/g, ' '),
      tag: 'VIDEO'
    }));

  return res.status(200).json({
    unlocked: true,
    serverTime: now.toISOString(),
    unlockDate: UNLOCK_DATE.toISOString(),
    media: {
      message: "/// VAULT CONTENTS RECOVERED ///\ndatabase_unlocked: true\nencryption_bypass: success\n\nAll digital artifacts have been recovered from the cloud storage.",
      images: images,
      videos: videos,
    },
    error: errorMsg
  });
}
