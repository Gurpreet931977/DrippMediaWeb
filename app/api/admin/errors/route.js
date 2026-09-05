import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'error-logs.json');

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

const getLocalLogs = () => {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('[errors-api] Error reading local error logs:', err);
  }
  return [];
};

const saveLocalLogs = (logs) => {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(logs.slice(0, 500), null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[errors-api] Error saving local error logs:', err);
    return false;
  }
};

export async function GET() {
  try {
    let logs = getLocalLogs();

    // Optionally merge/check Supabase if table exists
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('app_errors')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(500);

        if (!error && data && data.length > 0) {
          // Merge by id, keeping newer
          const map = new Map();
          [...data, ...logs].forEach(item => {
            if (item && item.id && !map.has(item.id)) {
              map.set(item.id, item);
            }
          });
          logs = Array.from(map.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }
      } catch (err) {
        // Fallback to local
      }
    }

    return NextResponse.json({ success: true, logs }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('[errors-api] GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    let body;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json') || contentType.includes('text/plain')) {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { message: text };
      }
    } else {
      body = await request.json();
    }

    if (!body) {
      return NextResponse.json({ success: false, error: 'Empty payload' }, { status: 400 });
    }

    const incoming = Array.isArray(body) ? body : [body];
    const currentLogs = getLocalLogs();

    for (const item of incoming) {
      if (!item || !item.message) continue;

      const newLog = {
        id: item.id || (Date.now().toString(36) + Math.random().toString(36).substring(2, 7)),
        timestamp: item.timestamp || new Date().toISOString(),
        level: item.level || 'error',
        message: String(item.message).slice(0, 1000),
        source: String(item.source || 'client').slice(0, 500),
        details: item.details ? String(item.details).slice(0, 5000) : null,
        userAgent: item.userAgent ? String(item.userAgent).slice(0, 300) : null
      };

      // Deduplicate rapid identical error spam (same message and source within 5 seconds)
      const isDuplicate = currentLogs.slice(0, 5).some(l => 
        l.message === newLog.message && 
        l.source === newLog.source &&
        Math.abs(new Date(l.timestamp).getTime() - new Date(newLog.timestamp).getTime()) < 5000
      );

      if (!isDuplicate) {
        currentLogs.unshift(newLog);
      }
    }

    saveLocalLogs(currentLogs);

    // Also attempt async write to Supabase if configured
    const supabase = getSupabase();
    if (supabase) {
      try {
        const item = incoming[0];
        if (item) {
          await supabase.from('app_errors').insert([{
            id: item.id || (Date.now().toString(36) + Math.random().toString(36).substring(2, 7)),
            timestamp: item.timestamp || new Date().toISOString(),
            level: item.level || 'error',
            message: String(item.message).slice(0, 1000),
            source: String(item.source || 'client').slice(0, 500),
            details: item.details ? String(item.details).slice(0, 5000) : null
          }]).catch(() => {});
        }
      } catch (e) {
        // Silent catch for Supabase table absence
      }
    }

    return NextResponse.json({ success: true, count: currentLogs.length });
  } catch (error) {
    console.error('[errors-api] POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    saveLocalLogs([]);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('app_errors').delete().neq('id', '0');
      } catch (err) {
        // Silent catch
      }
    }

    return NextResponse.json({ success: true, message: 'Logs cleared successfully' });
  } catch (error) {
    console.error('[errors-api] DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
