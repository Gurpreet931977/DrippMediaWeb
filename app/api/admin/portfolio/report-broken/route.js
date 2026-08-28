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

export async function POST(request) {
  try {
    const { id, type = 'reels', reason = 'Media load / playback error', url = '' } = await request.json();

    if (!id) {
      return Response.json({ error: 'Item ID is required' }, { status: 400 });
    }

    // Always update ledger immediately
    const ledgerEntry = setItemReviewStatus(id, {
      is_visible: false,
      held_for_review: true,
      review_reason: reason,
      review_date: new Date().toISOString()
    });

    const tableName = tableMap[type.toLowerCase()] || 'portfolio_reels';
    const supabase = getSupabase();

    let data = null;
    if (supabase) {
      const fullUpdates = {
        is_visible: false,
        held_for_review: true,
        review_reason: reason,
        review_date: new Date().toISOString()
      };

      const res = await supabase
        .from(tableName)
        .update(fullUpdates)
        .eq('id', id)
        .select();

      if (res.error) {
        await supabase
          .from(tableName)
          .update({ is_visible: false })
          .eq('id', id);
      } else {
        data = res.data;
      }
    }

    return Response.json({
      success: true,
      message: `Item ${id} successfully held for review and hidden from live site.`,
      item: data?.[0] || ledgerEntry
    });
  } catch (err) {
    console.error('Error in report-broken API:', err);
    return Response.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
