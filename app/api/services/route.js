import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'services.json');

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

const getLocalData = () => {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[services-api] Error reading local data:', err);
  }
  return null;
};

const saveLocalData = (data) => {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[services-api] Error saving local data:', err);
    return false;
  }
};

export async function GET() {
  try {
    let services = null;

    // 1. Try Supabase first if available
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'services_config')
          .single();
        if (!error && data?.value) {
          services = data.value;
        }
      } catch (err) {
        // Fallback to local
      }
    }

    // 2. Fallback to local JSON file
    if (!services) {
      services = getLocalData();
    }

    if (!services || !Array.isArray(services)) {
      return NextResponse.json({ error: 'Services data not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: services, categories: services });
  } catch (error) {
    console.error('[services-api] GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { services } = body;

    if (!services || !Array.isArray(services)) {
      return NextResponse.json({ error: 'Invalid payload: expected an array of categories' }, { status: 400 });
    }

    // Sanitize & validate categories and services
    const sanitized = services.map((cat, catIdx) => ({
      id: cat.id || `cat_${catIdx + 1}`,
      name: (cat.name || 'Untitled Category').trim(),
      services: Array.isArray(cat.services)
        ? cat.services.map((s, sIdx) => ({
            id: s.id || `svc_${catIdx + 1}_${sIdx + 1}`,
            name: (typeof s === 'string' ? s : s.name || '').trim()
          })).filter(s => s.name.length > 0)
        : []
    })).filter(cat => cat.name.length > 0);

    // Save locally
    saveLocalData(sanitized);

    // Save to Supabase if configured
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('app_settings')
          .upsert(
            { key: 'services_config', value: sanitized, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );
      } catch (err) {
        console.error('[services-api] Supabase upsert error:', err);
      }
    }

    return NextResponse.json({ success: true, data: sanitized });
  } catch (error) {
    console.error('[services-api] POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
