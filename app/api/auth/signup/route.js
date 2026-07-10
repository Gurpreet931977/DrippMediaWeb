import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/app/lib/rateLimit';
import { withCors, corsHeaders } from '@/app/lib/cors';
import { issueAuthToken } from '@/app/lib/authToken';
import { sendWelcomeEmail } from '@/app/lib/email';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

// 3 signup attempts per minute per IP to prevent account spam
const limiter = rateLimit({ limit: 3, windowMs: 60_000 });

// Basic email format validation (no relying on client-side validation alone)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  if (!process.env.AUTH_SESSION_SECRET) {
    console.error('[signup] CRITICAL: AUTH_SESSION_SECRET is not set in environment variables.');
    return withCors(Response.json({ error: 'Server misconfigured: AUTH_SESSION_SECRET is missing.' }, { status: 500 }), request);
  }

  // ── Rate limit ─────────────────────────────────────────────────────────────
  const { ok: rlOk, retryAfter } = limiter.check(request);
  if (!rlOk) {
    return withCors(
      Response.json({ error: 'Too many signup attempts. Please wait before trying again.' }, {
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
    const { name, email, phone, nature, password, security_phrase } = data;

    // ── Input validation ───────────────────────────────────────────────────
    if (!name || !email || !password || !security_phrase) {
      return withCors(Response.json({ error: 'Missing required fields' }, { status: 400 }), request);
    }

    if (typeof name !== 'string' || typeof email !== 'string' ||
        typeof password !== 'string' || typeof security_phrase !== 'string') {
      return withCors(Response.json({ error: 'Invalid input types' }, { status: 400 }), request);
    }

    // Length caps to prevent abuse
    if (name.length > 64 || email.length > 254 || password.length > 128 || security_phrase.length > 256) {
      return withCors(Response.json({ error: 'Input exceeds maximum length' }, { status: 400 }), request);
    }

    if (!EMAIL_RE.test(email)) {
      return withCors(Response.json({ error: 'Invalid email format' }, { status: 400 }), request);
    }

    if (password.length < 8) {
      return withCors(Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 }), request);
    }

    // ── Duplicate check ────────────────────────────────────────────────────
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existingUser) {
      return withCors(Response.json({ error: 'User already exists' }, { status: 409 }), request);
    }

    // ── Hash password AND security_phrase ──────────────────────────────────
    // Both are hashed with bcrypt so a DB breach doesn't expose either.
    const [hashedPassword, hashedPhrase] = await Promise.all([
      bcrypt.hash(password, 10),
      bcrypt.hash(security_phrase.trim(), 10),
    ]);

    // ── Insert user ────────────────────────────────────────────────────────
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone?.trim() || null,
          nature: nature?.trim() || null,
          password: hashedPassword,
          security_phrase: hashedPhrase,
          highscore: 0,
        },
      ])
      .select()
      .single();

    if (error) {
      // Log internally, return generic message
      console.error('[signup] DB insert error:', error?.message);
      return withCors(Response.json({ error: 'Failed to create user' }, { status: 500 }), request);
    }

    // Don't send password or security_phrase back to the client
    const { password: _pw, security_phrase: _sp, ...safeUser } = newUser;

    // Issue a signed identity token immediately after account creation
    const authToken = issueAuthToken(safeUser.email);

    // Send the welcome email asynchronously (don't await it to keep response fast)
    sendWelcomeEmail(safeUser.email, safeUser.name, safeUser.nature).catch((err) => {
      console.error('[signup] Welcome email background task failed:', err);
    });

    // Return only what the client actually needs - don't leak internal DB fields
    return withCors(Response.json({
      name:       safeUser.name,
      email:      safeUser.email,
      _authToken: authToken,
    }, { status: 201 }), request);
  } catch (error) {
    console.error('[signup] Unexpected error:', error?.message);
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
