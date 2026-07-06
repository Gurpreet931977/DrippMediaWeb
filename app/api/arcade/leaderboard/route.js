import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/app/lib/rateLimit';

// 30 requests per minute per IP for leaderboard
const limiter = rateLimit({ limit: 30, windowMs: 60_000 });

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

export async function GET(request) {
  const { ok: rlOk, retryAfter } = limiter.check(request);
  if (!rlOk) {
    return Response.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  try {
    const supabase = getSupabase();
    if (!supabase) return Response.json({ error: 'Database configuration missing' }, { status: 500 });

    const { data, error } = await supabase
      .from('users')
      .select('name, highscore')
      .order('highscore', { ascending: false })
      .limit(3);

    if (error) {
      console.error('[arcade/leaderboard] GET error:', error?.message);
      return Response.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    return Response.json({ leaderboard: data || [] }, { status: 200 });
  } catch (error) {
    console.error('[arcade/leaderboard] GET unexpected error:', error?.message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST()   { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function PUT()    { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
