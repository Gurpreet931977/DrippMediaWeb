import { createClient } from '@supabase/supabase-js';

// Reusable server-side supabase instance for this API route
function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use anon key for public read access
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
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
      .neq('is_visible', false)
      .order('sort_order', { ascending: false, nullsFirst: false });

    if (category && category !== 'Both') {
      query = query.in('category', [category, 'Both']);
    }

    const { data: rawReels, error } = await query;

    if (error) {
      console.error('Error fetching reels:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    const reels = (rawReels || []).map(item => ({
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
