import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/app/lib/rateLimit';
import { verifyAuthToken, extractBearerToken } from '@/app/lib/authToken';

// 30 requests per minute per IP
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

  // 1. Authenticate user
  const rawAuthToken = extractBearerToken(request);
  const authResult = verifyAuthToken(rawAuthToken);
  
  if (!authResult.ok) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    if (!supabase) return Response.json({ error: 'Database configuration missing' }, { status: 500 });

    const { data, error } = await supabase
      .from('users')
      .select('highscore')
      .eq('email', authResult.email)
      .maybeSingle();

    if (error) {
      console.error('[arcade/highscore] GET error:', error?.message);
      return Response.json({ error: 'Failed to fetch highscore' }, { status: 500 });
    }
    
    if (!data) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({ highscore: data.highscore || 0 }, { status: 200 });
  } catch (error) {
    console.error('[arcade/highscore] GET unexpected error:', error?.message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST()   { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function PUT()    { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
