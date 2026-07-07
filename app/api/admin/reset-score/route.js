/**
 * /api/admin/reset-score
 * Admin-only endpoint to reset (zero out) a specific user's highscore.
 * Requires a valid dripp_admin_session cookie (issued by /api/admin/verify).
 *
 * POST { email }
 *  - Sets the user's highscore to 0 in the database.
 *  - Returns { ok: true, email } on success.
 */

import { createClient } from '@supabase/supabase-js';
import { verifyAdminRequest } from '@/app/lib/adminAuth';
import { rateLimit } from '@/app/lib/rateLimit';

const limiter = rateLimit({ limit: 20, windowMs: 60_000 });

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

export async function POST(request) {
  const { ok: rlOk, retryAfter } = limiter.check(request);
  if (!rlOk) {
    return Response.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    });
  }

  // Admin-only: verify the admin session cookie
  const adminEmail = verifyAdminRequest(request);
  if (!adminEmail) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let targetEmail;
  try {
    const body = await request.json();
    targetEmail = body?.email?.toLowerCase?.()?.trim?.();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!targetEmail) {
    return Response.json({ error: 'Missing email' }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    if (!supabase) {
      return Response.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    // Zero out the user's highscore
    const { error } = await supabase
      .from('users')
      .update({ highscore: 0 })
      .eq('email', targetEmail);

    if (error) {
      console.error('[admin/reset-score] DB error:', error?.message);
      return Response.json({ error: 'Failed to reset score' }, { status: 500 });
    }

    console.log(`[admin/reset-score] Score reset by admin=${adminEmail} for target=${targetEmail}`);
    return Response.json({ ok: true, email: targetEmail, resetBy: adminEmail });
  } catch (err) {
    console.error('[admin/reset-score] Unexpected error:', err?.message);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET()    { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function PUT()    { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
