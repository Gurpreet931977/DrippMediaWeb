import { createClient } from '@supabase/supabase-js';
import { applyLedgerToItems } from '../../lib/portfolioReviewLedger.js';

// Reusable server-side supabase instance for this API route
function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://irgplkartyhasfucpffn.supabase.co';
  // Use anon key for public read access
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U';
  
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const supabase = getSupabase();
    if (!supabase) {
      return Response.json({ error: 'Database misconfigured' }, { status: 500 });
    }

    let query = supabase
      .from('portfolio_reels')
      .select('*')
      .order('sort_order', { ascending: false, nullsFirst: false });

    if (category && category !== 'Both') {
      query = query.in('category', [category, 'Both']);
    }

    const { data: rawReels, error } = await query;

    if (error) {
      console.error('Error fetching reels:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Apply ledger to ensure any items held for review or marked invisible are excluded
    const ledgerReels = applyLedgerToItems(rawReels || []);

    const reels = ledgerReels
      .filter(item => item.is_visible !== false && item.held_for_review !== true)
      .map(item => ({
        ...item,
        videoSrc: item.videoSrc || item.video_src || item.video_url || item.url || item.src || '',
        musicText: item.musicText || item.music_text || item.music || item.audio || item.title || 'Original Audio - Dripp Media',
        description: item.description || item.desc || item.caption || '',
        sort_order: item.sort_order ?? 0
      })).filter(item => item.videoSrc);

    return Response.json(reels);
  } catch (err) {
    console.error('Unexpected error fetching reels:', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
