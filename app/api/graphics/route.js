import { createClient } from '@supabase/supabase-js';
import { applyLedgerToItems } from '../../lib/portfolioReviewLedger.js';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://irgplkartyhasfucpffn.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return Response.json({ error: 'Database misconfigured' }, { status: 500 });
    }

    const { data: rawGraphics, error } = await supabase
      .from('portfolio_graphics')
      .select('*')
      .order('sort_order', { ascending: false });

    if (error) {
      console.error('Error fetching graphics:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    const graphics = applyLedgerToItems(rawGraphics || [])
      .filter(item => item.is_visible !== false && item.held_for_review !== true);

    return Response.json(graphics);
  } catch (err) {
    console.error('Unexpected error fetching graphics:', err);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
