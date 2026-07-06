import { createClient } from '@supabase/supabase-js';
import { verifyAdminRequest } from '@/app/lib/adminAuth';
import { rateLimit } from '@/app/lib/rateLimit';

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

  const email = verifyAdminRequest(request);
  if (!email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabase();
    if (!supabase) return Response.json({ error: 'Database configuration missing' }, { status: 500 });

    const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'my_details').single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned
      console.error('[admin/settings] GET error:', error?.message);
      return Response.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return Response.json({ data: data?.value || null }, { status: 200 });
  } catch (error) {
    console.error('[admin/settings] GET unexpected error:', error?.message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const { ok: rlOk, retryAfter } = limiter.check(request);
  if (!rlOk) {
    return Response.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  const email = verifyAdminRequest(request);
  if (!email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabase();
    if (!supabase) return Response.json({ error: 'Database configuration missing' }, { status: 500 });

    const body = await request.json();
    const { myDetails } = body;

    if (!myDetails) {
      return Response.json({ error: 'Missing myDetails payload' }, { status: 400 });
    }

    const { error } = await supabase.from('app_settings').upsert({ key: 'my_details', value: myDetails });
    
    if (error) {
      console.error('[admin/settings] POST error:', error?.message);
      return Response.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('[admin/settings] POST unexpected error:', error?.message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT()    { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
