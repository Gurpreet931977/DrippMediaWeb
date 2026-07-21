import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
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

    const { data: graphics, error } = await supabase
      .from('portfolio_graphics')
      .select('image_url')
      .eq('is_visible', true)
      .order('sort_order', { ascending: false });

    if (error) {
      console.error('Error fetching graphics:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(graphics);
  } catch (err) {
    console.error('Unexpected error fetching graphics:', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
