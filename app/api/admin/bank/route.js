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
  if (!rlOk) return Response.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });

  const email = verifyAdminRequest(request);
  if (!email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabase();
    if (!supabase) return Response.json({ error: 'Database configuration missing' }, { status: 500 });

    const { data, error } = await supabase.from('bank_accounts').select('*').order('created_at', { ascending: true });
    
    if (error) {
      console.error('[admin/bank] GET error:', error?.message);
      return Response.json({ error: 'Failed to fetch bank accounts' }, { status: 500 });
    }

    return Response.json({ data: data || [] }, { status: 200 });
  } catch (error) {
    console.error('[admin/bank] GET unexpected error:', error?.message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  const { ok: rlOk, retryAfter } = limiter.check(request);
  if (!rlOk) return Response.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });

  const email = verifyAdminRequest(request);
  if (!email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabase();
    if (!supabase) return Response.json({ error: 'Database configuration missing' }, { status: 500 });

    const bankData = await request.json();
    const { id, name, details, upi } = bankData;

    if (!name || !details) {
      return Response.json({ error: 'Missing required bank details' }, { status: 400 });
    }

    let result;
    if (id && id !== 'new') {
      result = await supabase.from('bank_accounts').update({ name, details, upi }).eq('id', id).select().single();
    } else {
      result = await supabase.from('bank_accounts').insert({ name, details, upi }).select().single();
    }

    if (result.error) {
      console.error('[admin/bank] POST error:', result.error?.message);
      return Response.json({ error: 'Failed to save bank account' }, { status: 500 });
    }

    return Response.json({ data: result.data }, { status: 200 });
  } catch (error) {
    console.error('[admin/bank] POST unexpected error:', error?.message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const { ok: rlOk, retryAfter } = limiter.check(request);
  if (!rlOk) return Response.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });

  const email = verifyAdminRequest(request);
  if (!email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabase();
    if (!supabase) return Response.json({ error: 'Database configuration missing' }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Missing bank account ID' }, { status: 400 });
    }

    const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
    
    if (error) {
      console.error('[admin/bank] DELETE error:', error?.message);
      return Response.json({ error: 'Failed to delete bank account' }, { status: 500 });
    }

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('[admin/bank] DELETE unexpected error:', error?.message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT()    { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
