import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/app/lib/rateLimit';
import { withCors, corsHeaders } from '@/app/lib/cors';
import { issueAuthToken } from '@/app/lib/authToken';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

// 5 login attempts per minute per IP
const limiter = rateLimit({ limit: 5, windowMs: 60_000 });

export async function POST(request) {
  // ── Rate limit ─────────────────────────────────────────────────────────────
  const { ok: rlOk, retryAfter } = limiter.check(request);
  if (!rlOk) {
    return withCors(
      Response.json({ error: 'Too many login attempts. Please wait before trying again.' }, {
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
    const { email, password } = data;

    if (!email || !password) {
      return withCors(Response.json({ error: 'Missing required fields' }, { status: 400 }), request);
    }

    // Validate input types
    if (typeof email !== 'string' || typeof password !== 'string') {
      return withCors(Response.json({ error: 'Invalid input types' }, { status: 400 }), request);
    }

    // Enforce reasonable length limits to prevent abuse
    if (email.length > 254 || password.length > 128) {
      return withCors(Response.json({ error: 'Invalid credentials' }, { status: 401 }), request);
    }

    // Fetch user by email or by player name
    let query = supabase.from('users').select('*');
    if (email.includes('@')) {
      query = query.eq('email', email.toLowerCase().trim());
    } else {
      // Escape wildcard characters to prevent SQL wildcard injection via ilike
      const safeName = email.trim().replace(/[%_\\]/g, '\\$&');
      query = query.ilike('name', safeName);
    }

    const { data: user, error } = await query.single();

    if (error || !user) {
      // Use a constant-time delay to prevent timing-based email enumeration
      await bcrypt.compare('dummy', '$2b$10$invalidhashplaceholderXXXXXXXXXXXXXXXXXXXXXXXX').catch(() => {});
      
      if (!email.includes('@')) {
        return withCors(Response.json({ error: 'Player Tag not found, or multiple users share this tag. Please login with your Email.' }, { status: 401 }), request);
      }
      return withCors(Response.json({ error: 'Invalid email or password' }, { status: 401 }), request);
    }

    // Compare passwords gracefully (handling legacy plaintext passwords)
    let isValid = false;
    const storedPassword = String(user.password || '');

    if (storedPassword.startsWith('$2')) {
      isValid = await bcrypt.compare(password, storedPassword);
    } else {
      isValid = (password === storedPassword);
    }

    if (!isValid) {
      return withCors(Response.json({ error: 'Invalid email or password' }, { status: 401 }), request);
    }

    // Don't send the password or security_phrase back to the client
    const { password: _pw, security_phrase: _sp, ...safeUser } = user;

    // Issue a signed identity token so the client can prove ownership of this
    // email when requesting a game session token or submitting a score.
    const authToken = issueAuthToken(safeUser.email);

    return withCors(Response.json({ ...safeUser, _authToken: authToken }, { status: 200 }), request);
  } catch (error) {
    // Log internally but never expose details to client
    console.error('[login] Unexpected error:', error?.message);
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
