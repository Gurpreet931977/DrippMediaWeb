import { createClient } from '@supabase/supabase-js';
import { applyLedgerToItems } from '../../lib/portfolioReviewLedger.js';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://irgplkartyhasfucpffn.supabase.co';
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
      .from('portfolio_long_form')
      .select('*')
      .order('sort_order', { ascending: false });

    if (category && category !== 'Both') {
      query = query.in('category', [category, 'Both']);
    }

    let { data: rawVideos, error } = await query;

    if (error) {
      console.error('Error fetching long-form videos:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    const videos = applyLedgerToItems(rawVideos || [])
      .filter(item => item.is_visible !== false && item.held_for_review !== true);

    return Response.json(videos);
  } catch (err) {
    console.error('Unexpected error fetching long-form videos:', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
