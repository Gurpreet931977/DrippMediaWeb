import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/app/lib/rateLimit';
import { withCors, corsHeaders } from '@/app/lib/cors';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

// 3 reset attempts per minute per IP — brute-forcing a security phrase is a real attack vector
const limiter = rateLimit({ limit: 3, windowMs: 60_000 });

export async function POST(request) {
  // ── Rate limit ─────────────────────────────────────────────────────────────
  const { ok: rlOk, retryAfter } = limiter.check(request);
  if (!rlOk) {
    return withCors(
      Response.json({ error: 'Too many reset attempts. Please wait before trying again.' }, {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }),
      request
    );
  }

  try {
    const supabase = getSupabase();
    if (!supabase) return withCors(Response.json({ error: 'Database configuration missing' }, { status: 500 }), request);

    const data = await request.json();
    const { email, security_phrase, new_password } = data;

    if (!email || !security_phrase || !new_password) {
      return withCors(Response.json({ error: 'Missing required fields' }, { status: 400 }), request);
    }

    if (typeof email !== 'string' || typeof security_phrase !== 'string' || typeof new_password !== 'string') {
      return withCors(Response.json({ error: 'Invalid input types' }, { status: 400 }), request);
    }

    if (new_password.length < 8) {
      return withCors(Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 }), request);
    }

    // ── Fetch user ─────────────────────────────────────────────────────────
    const { data: user, error } = await supabase
      .from('users')
      .select('id, security_phrase')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      // Constant-time delay: run a dummy bcrypt to prevent timing-based user enumeration
      await bcrypt.compare('dummy', '$2b$10$invalidhashplaceholderXXXXXXXXXXXXXXXXXXXXXXXX').catch(() => {});
      return withCors(Response.json({ error: 'Invalid email or security phrase' }, { status: 401 }), request);
    }

    // ── Verify security phrase ─────────────────────────────────────────────
    // For users created with the new hashed signup: use bcrypt.compare.
    // For legacy users (plaintext stored before this update): fall back to direct
    // comparison. Run the migration script to upgrade all existing users.
    let phraseValid = false;
    const storedPhrase = String(user.security_phrase || '');

    // If the user has no security phrase set in the DB, it cannot be reset via this method.
    if (!storedPhrase) {
      return withCors(Response.json({ error: 'Invalid email or security phrase' }, { status: 401 }), request);
    }

    if (storedPhrase.startsWith('$2')) {
      // Bcrypt hash (new users or migrated users)
      phraseValid = await bcrypt.compare(security_phrase.trim(), storedPhrase);
    } else {
      // Legacy plaintext (unmigrated) — direct compare
      phraseValid = storedPhrase === security_phrase.trim();
    }

    if (!phraseValid) {
      return withCors(Response.json({ error: 'Invalid email or security phrase' }, { status: 401 }), request);
    }

    // ── Hash the new password ──────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // ── Update password ────────────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', user.id);

    if (updateError) {
      console.error('[reset] DB update error:', updateError?.message);
      return withCors(Response.json({ error: 'Failed to update password' }, { status: 500 }), request);
    }

    return withCors(Response.json({ message: 'Password updated successfully' }, { status: 200 }), request);
  } catch (error) {
    console.error('[reset] Unexpected error:', error?.message);
    return withCors(Response.json({ error: 'Internal server error' }, { status: 500 }), request);
  }
}

// Handle CORS preflight
export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

// Block all other methods
export async function GET()    { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function PUT()    { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return Response.json({ error: 'Method not allowed' }, { status: 405 }); }
