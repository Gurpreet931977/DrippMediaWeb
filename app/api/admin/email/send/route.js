import { verifyCookie } from '@/app/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';
import { sendCustomAdminEmail } from '@/app/lib/email';
import { rateLimit } from '@/app/lib/rateLimit';

const limiter = rateLimit({ limit: 10, windowMs: 60_000 }); // 10 campaigns per minute

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

export async function POST(request) {
  // ── 1. Rate Limit ────────────────────────────────────────────────────────
  const { ok: rlOk, retryAfter } = limiter.check(request);
  if (!rlOk) {
    return Response.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    });
  }

  // ── 2. Admin Authentication ──────────────────────────────────────────────
  const cookieHeader = request.headers.get('cookie') || '';
  const COOKIE_NAME = 'dripp_admin_session';
  const cookieValue = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  const adminEmail = verifyCookie(cookieValue);
  if (!adminEmail) {
    return Response.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
  }

  // ── 3. Payload Validation ────────────────────────────────────────────────
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { isBroadcast, specificEmail, subject, title, body, templateType } = payload;

  if (!subject || !title || !body) {
    return Response.json({ error: 'Missing subject, title, or body' }, { status: 400 });
  }
  
  if (!isBroadcast && !specificEmail) {
    return Response.json({ error: 'Must provide specificEmail if not broadcasting' }, { status: 400 });
  }

  // ── 4. Determine Recipients ──────────────────────────────────────────────
  let recipients = [];
  if (isBroadcast) {
    const supabase = getSupabase();
    if (!supabase) return Response.json({ error: 'Database misconfigured' }, { status: 500 });

    const { data: users, error } = await supabase
      .from('users')
      .select('email')
      .not('email', 'is', null);

    if (error) {
      console.error('[admin/email] Error fetching users:', error);
      return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    recipients = users.map(u => u.email).filter(e => e.includes('@'));
  } else {
    recipients = specificEmail.split(',').map(e => e.trim()).filter(e => e.includes('@'));
  }

  if (recipients.length === 0) {
    return Response.json({ error: 'No recipients found' }, { status: 404 });
  }

  // ── 5. Dispatch Emails (Batched) ────────────────────────────────────────
  let successCount = 0;
  let failCount = 0;

  // Process in batches of 20 to avoid overwhelming Resend API rate limits
  const BATCH_SIZE = 20;
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (email) => {
      const result = await sendCustomAdminEmail(email, subject, title, body, templateType);
      if (result.success) {
        successCount++;
      } else {
        console.error(`[admin/email] Failed to send to ${email}`);
        failCount++;
      }
    }));
  }

  return Response.json({
    success: true,
    message: `Campaign complete. Sent: ${successCount}, Failed: ${failCount}`,
    totalSent: successCount
  }, { status: 200 });
}
