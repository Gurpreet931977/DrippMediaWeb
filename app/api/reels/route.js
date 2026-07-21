import { createClient } from '@supabase/supabase-js';

// Reusable server-side supabase instance for this API route
function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Use anon key for public read access
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return Response.json({ error: 'Database misconfigured' }, { status: 500 });
    }

    const { data: reels, error } = await supabase
      .from('portfolio_reels')
      .select('videoSrc, musicText, description, sort_order')
      .eq('is_visible', true)
      .order('sort_order', { ascending: false });

    if (error) {
      console.error('Error fetching reels:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(reels);
  } catch (err) {
    console.error('Unexpected error fetching reels:', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
