import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withCors, corsHeaders } from '@/app/lib/cors';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request) {
  try {
    const data = await request.json();
    const email = (data.email || '').trim();
    const whatsapp = (data.whatsapp || '').trim();
    const expertise = (data.expertise || '').trim();

    if (!email || !email.includes('@')) {
      return withCors(
        NextResponse.json({ success: false, error: 'A valid email is required.' }, { status: 400 }),
        request
      );
    }

    if (!whatsapp) {
      return withCors(
        NextResponse.json({ success: false, error: 'WhatsApp number is required.' }, { status: 400 }),
        request
      );
    }

    // Attempt Supabase save if configured
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('community').upsert(
          {
            email,
            whatsapp,
            expertise,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );
      }
    } catch (dbErr) {
      console.warn('[COMMUNITY API] Supabase save notice:', dbErr.message);
    }

    return withCors(
      NextResponse.json({
        success: true,
        message: "You're in the Collective! Check your inbox. 🖤",
      }),
      request
    );
  } catch (err) {
    console.error('[COMMUNITY API] Error:', err);
    return withCors(
      NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 }),
      request
    );
  }
}
