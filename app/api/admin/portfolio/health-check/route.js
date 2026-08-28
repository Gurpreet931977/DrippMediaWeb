import { createClient } from '@supabase/supabase-js';
import { setItemReviewStatus } from '../../../../lib/portfolioReviewLedger.js';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://irgplkartyhasfucpffn.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

const tableMap = {
  'reels': 'portfolio_reels',
  'short-form': 'portfolio_reels',
  'long-form': 'portfolio_long_form',
  'graphics': 'portfolio_graphics'
};

async function testUrlStatus(url) {
  if (!url || typeof url !== 'string') return { ok: false, status: 400, error: 'Empty or invalid URL' };
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    
    // First try HEAD
    const res = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'DrippMedia-HealthChecker/1.0' }
    });
    clearTimeout(timeout);

    if (res.status === 405) {
      // Some storage endpoints don't allow HEAD; fallback to small range GET
      const getController = new AbortController();
      const getTimeout = setTimeout(() => getController.abort(), 6000);
      const getRes = await fetch(url, {
        method: 'GET',
        headers: { 'Range': 'bytes=0-100', 'User-Agent': 'DrippMedia-HealthChecker/1.0' },
        signal: getController.signal
      });
      clearTimeout(getTimeout);
      return { ok: getRes.status >= 200 && getRes.status < 400, status: getRes.status };
    }

    return { ok: res.status >= 200 && res.status < 400, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, error: err.name === 'AbortError' ? 'Connection Timeout' : err.message };
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const type = (body.type || 'reels').toLowerCase();
    const autoHold = body.autoHold !== false; // default true
    const singleItemId = body.id || null;

    const supabase = getSupabase();
    if (!supabase) {
      return Response.json({ error: 'Database client unavailable' }, { status: 500 });
    }

    const typesToScan = type === 'all' ? ['reels', 'long-form', 'graphics'] : [type];
    const report = {
      timestamp: new Date().toISOString(),
      totalScanned: 0,
      healthyCount: 0,
      brokenCount: 0,
      results: []
    };

    for (const t of typesToScan) {
      const tableName = tableMap[t];
      if (!tableName) continue;

      let query = supabase.from(tableName).select('*');
      if (singleItemId) {
        query = query.eq('id', singleItemId);
      }

      const { data: items, error } = await query;
      if (error) {
        console.error(`Error querying ${tableName} for health check:`, error);
        continue;
      }

      for (const item of items || []) {
        report.totalScanned++;
        
        let mediaUrl = '';
        let mediaType = 'video';

        if (t === 'reels' || t === 'short-form') {
          mediaUrl = item.videoSrc || item.video_src || item.video_url || item.url || '';
        } else if (t === 'graphics') {
          mediaUrl = item.image_url || item.thumbnail_url || item.url || '';
          mediaType = 'image';
        } else if (t === 'long-form') {
          mediaUrl = item.thumbnail_url || (item.video_id ? `https://img.youtube.com/vi/${item.video_id}/maxresdefault.jpg` : '');
          mediaType = 'youtube/thumbnail';
        }

        const title = item.title || item.description || item.category || 'Untitled Item';
        let healthResult = { ok: true, status: 200 };

        if (mediaUrl) {
          healthResult = await testUrlStatus(mediaUrl);
        } else {
          healthResult = { ok: false, status: 404, error: 'No media source URL defined' };
        }

        const isBroken = !healthResult.ok;
        let reason = isBroken ? (healthResult.status ? `Media not found (HTTP ${healthResult.status})` : (healthResult.error || 'Connection Failed')) : null;

        if (isBroken) {
          report.brokenCount++;
          if (autoHold) {
            setItemReviewStatus(item.id, {
              is_visible: false,
              held_for_review: true,
              review_reason: reason,
              review_date: new Date().toISOString()
            });

            // Update Supabase to hold for review and hide
            const updatePayload = {
              is_visible: false,
              held_for_review: true,
              review_reason: reason,
              review_date: new Date().toISOString()
            };

            const { error: updateErr } = await supabase
              .from(tableName)
              .update(updatePayload)
              .eq('id', item.id);

            if (updateErr) {
              // Fallback if custom columns don't exist
              await supabase
                .from(tableName)
                .update({ is_visible: false })
                .eq('id', item.id);
            }
          }
        } else {
          report.healthyCount++;
        }

        report.results.push({
          id: item.id,
          type: t,
          title,
          url: mediaUrl,
          mediaType,
          status: healthResult.status,
          isHealthy: !isBroken,
          reason,
          is_visible: item.is_visible,
          heldForReview: isBroken && autoHold ? true : (item.held_for_review || (!item.is_visible && isBroken))
        });
      }
    }

    return Response.json(report);
  } catch (err) {
    console.error('Error in health check route:', err);
    return Response.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
