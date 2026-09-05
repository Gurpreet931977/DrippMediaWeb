import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withCors, corsHeaders } from '@/app/lib/cors';
import fs from 'fs';
import path from 'path';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function saveLocalBackup(record) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, 'community_signups.json');
    let list = [];
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        list = JSON.parse(content);
        if (!Array.isArray(list)) list = [];
      } catch (e) {
        list = [];
      }
    }
    const existingIndex = list.findIndex(
      (item) => (item.email || '').toLowerCase() === (record.email || '').toLowerCase()
    );
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...record };
    } else {
      list.unshift(record);
    }
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.warn('[COMMUNITY API] Local backup notice:', err.message);
  }
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

    const payload = {
      email,
      whatsapp,
      expertise,
      created_at: new Date().toISOString(),
    };

    // 1. Persistent local backup so leads are never lost even if Supabase RLS is active
    saveLocalBackup(payload);

    // 2. Attempt Supabase save
    let supabaseSaved = false;
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { error: dbError } = await supabase.from('community').upsert(
          payload,
          { onConflict: 'email' }
        );
        if (dbError) {
          console.warn('[COMMUNITY API] Supabase warning (check RLS policy):', dbError.message || dbError);
        } else {
          supabaseSaved = true;
        }
      }
    } catch (dbErr) {
      console.warn('[COMMUNITY API] Supabase save notice:', dbErr.message);
    }

    return withCors(
      NextResponse.json({
        success: true,
        supabase_synced: supabaseSaved,
        message: "You're in the Collective. Welcome to Dripp Media.",
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
