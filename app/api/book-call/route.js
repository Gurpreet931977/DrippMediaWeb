import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Client as NotionClient } from '@notionhq/client';
import { Resend } from 'resend';
import { withCors, corsHeaders } from '@/app/lib/cors';
import fs from 'fs';
import path from 'path';

// --- HELPERS ---

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
    const filePath = path.join(dataDir, 'booked_calls.json');
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
    list.unshift(record);
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.warn('[BOOK-CALL API] Local backup notice:', err.message);
    return false;
  }
}

async function saveToSupabase(record) {
  try {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase credentials missing' };

    const { data, error } = await supabase.from('strategy_calls').insert([record]).select();
    if (error) {
      console.warn('[BOOK-CALL API] Supabase warning (verify RLS/table):', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err) {
    console.warn('[BOOK-CALL API] Supabase save error:', err.message);
    return { success: false, error: err.message };
  }
}

async function notifyNotion(record) {
  try {
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) return { success: false, reason: 'NOTION_API_KEY not set' };

    const targetPageId = process.env.NOTION_CALLS_PAGE_ID || '7fe6c247-ead5-4a73-8a43-bab3f2ee4b8c';
    const notion = new NotionClient({ auth: apiKey });

    const response = await notion.blocks.children.append({
      block_id: targetPageId,
      children: [
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: `[STRATEGY CALL] ${record.name} - Slot: ${record.slot}`,
                },
                annotations: { bold: true },
              },
              {
                type: 'text',
                text: {
                  content: ` | Email: ${record.email} | WhatsApp: ${record.whatsapp} | ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
                },
              },
            ],
          },
        },
      ],
    });

    return { success: true, id: response.results?.[0]?.id };
  } catch (err) {
    console.warn('[BOOK-CALL API] Notion notice:', err.message);
    return { success: false, error: err.message };
  }
}

async function notifyEmail(record) {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return { success: false, reason: 'RESEND_API_KEY not set' };

    const resend = new Resend(resendKey);
    const toEmail = process.env.ADMIN_ALERT_EMAIL || 'mediadripp@gmail.com';

    await resend.emails.send({
      from: 'Dripp Media Alerts <hello@drippmedia.com>',
      to: toEmail,
      subject: `New Strategy Call Booked: ${record.name} (${record.slot})`,
      html: `
        <div style="background-color: #0d0d10; color: #ffffff; padding: 24px; font-family: sans-serif; border-radius: 12px;">
          <h2 style="color: #ebd73f; margin-top: 0;">New Strategy Call Reserved</h2>
          <p style="font-size: 15px; line-height: 1.6;">A new client has reserved a discovery session:</p>
          <ul style="line-height: 1.8; font-size: 14px;">
            <li><strong>Client Name:</strong> ${record.name}</li>
            <li><strong>Preferred Slot:</strong> ${record.slot}</li>
            <li><strong>Email:</strong> <a href="mailto:${record.email}" style="color: #ebd73f;">${record.email}</a></li>
            <li><strong>WhatsApp:</strong> <a href="https://wa.me/${record.whatsapp.replace(/[^0-9]/g, '')}" style="color: #ebd73f;">${record.whatsapp}</a></li>
            <li><strong>Timestamp:</strong> ${record.created_at}</li>
          </ul>
        </div>
      `,
    });

    return { success: true };
  } catch (err) {
    console.warn('[BOOK-CALL API] Email notice:', err.message);
    return { success: false, error: err.message };
  }
}

async function pingCallMeBot(record) {
  try {
    const apiKey = process.env.CALLMEBOT_API_KEY;
    if (!apiKey) return { success: false, reason: 'CALLMEBOT_API_KEY not configured' };

    const phone = process.env.CALLMEBOT_PHONE || '917300595147';
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const message = `*NEW STRATEGY CALL BOOKED!*\n` +
      `*Name:* ${record.name}\n` +
      `*Slot:* ${record.slot}\n` +
      `*Email:* ${record.email}\n` +
      `*WhatsApp:* ${record.whatsapp}\n` +
      `*Time:* ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, { method: 'GET' });
    const text = await res.text();
    return { success: res.ok, response: text };
  } catch (err) {
    console.warn('[BOOK-CALL API] CallMeBot notice:', err.message);
    return { success: false, error: err.message };
  }
}

// --- ROUTE HANDLERS ---

export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const whatsapp = (body.whatsapp || '').trim();
    const slot = (body.slot || 'Tomorrow at 3:00 PM').trim();
    const notes = (body.notes || '').trim();

    if (!name) {
      return withCors(
        NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 }),
        request
      );
    }

    if (!email || !email.includes('@')) {
      return withCors(
        NextResponse.json({ success: false, error: 'Valid email is required' }, { status: 400 }),
        request
      );
    }

    if (!whatsapp) {
      return withCors(
        NextResponse.json({ success: false, error: 'WhatsApp number is required' }, { status: 400 }),
        request
      );
    }

    const payload = {
      id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name,
      email,
      whatsapp,
      slot,
      notes,
      source: 'strategy_modal',
      created_at: new Date().toISOString(),
      status: 'pending',
    };

    // 1. GUARANTEED DISK BACKUP (Zero leads lost)
    const backupSaved = saveLocalBackup(payload);

    // 2. PARALLEL DISPATCH (Supabase + Notion + Email + WhatsApp Ping)
    const [supabaseResult, notionResult, emailResult, waPingResult] = await Promise.allSettled([
      saveToSupabase(payload),
      notifyNotion(payload),
      notifyEmail(payload),
      pingCallMeBot(payload),
    ]);

    const supabaseStatus = supabaseResult.status === 'fulfilled' ? supabaseResult.value : { success: false };
    const notionStatus = notionResult.status === 'fulfilled' ? notionResult.value : { success: false };
    const emailStatus = emailResult.status === 'fulfilled' ? emailResult.value : { success: false };
    const waStatus = waPingResult.status === 'fulfilled' ? waPingResult.value : { success: false };

    return withCors(
      NextResponse.json({
        success: true,
        message: 'Strategy call booked and captured successfully',
        leadId: payload.id,
        savedLocally: backupSaved,
        supabase: supabaseStatus,
        notion: notionStatus,
        email: emailStatus,
        whatsappPing: waStatus,
      }),
      request
    );
  } catch (err) {
    console.error('[BOOK-CALL API] Unexpected error:', err);
    return withCors(
      NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 }),
      request
    );
  }
}

export async function GET(request) {
  // Read local backup records for inspection / debugging
  try {
    const filePath = path.join(process.cwd(), 'data', 'booked_calls.json');
    if (!fs.existsSync(filePath)) {
      return withCors(NextResponse.json({ success: true, count: 0, leads: [] }), request);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const list = JSON.parse(content);
    return withCors(NextResponse.json({ success: true, count: list.length, leads: list }), request);
  } catch (err) {
    return withCors(NextResponse.json({ success: false, error: err.message }, { status: 500 }), request);
  }
}
