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

    // Standard columns for strategy_calls table
    let dbPayload = {
      name: record.name,
      email: record.email,
      whatsapp: record.whatsapp,
      slot: record.slot,
      call_channel: record.call_channel || 'Direct Phone Call',
      scope: record.scope || '',
      notes: record.notes,
      source: record.source || 'website_modal',
      status: record.status || 'pending',
    };

    let { data, error } = await supabase.from('strategy_calls').insert([dbPayload]).select();
    if (error && error.message && error.message.includes('column')) {
      // Graceful fallback for older table schemas without call_channel/scope columns
      delete dbPayload.call_channel;
      delete dbPayload.scope;
      const fallbackResult = await supabase.from('strategy_calls').insert([dbPayload]).select();
      data = fallbackResult.data;
      error = fallbackResult.error;
    }
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

    const channel = record.call_channel || 'Direct Phone Call';
    const scope = record.scope || 'General';

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
                  content: `[STRATEGY CALL] ${record.name} - Slot: ${record.slot} (${channel})`,
                },
                annotations: { bold: true },
              },
              {
                type: 'text',
                text: {
                  content: ` | Scope: ${scope} | Email: ${record.email} | Phone/WA: ${record.whatsapp} | ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
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
        <div style="background-color: #0d0d10; color: #ffffff; padding: 24px; font-family: sans-serif; border-radius: 12px; border: 1px solid rgba(235, 215, 63, 0.2);">
          <h2 style="color: #ebd73f; margin-top: 0;">New Strategy Call & Project Brief</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #d0d0d0;">A client has submitted their project scope and requested a strategy call:</p>
          <ul style="line-height: 1.9; font-size: 14px;">
            <li><strong>Client Name:</strong> ${record.name}</li>
            <li><strong>Call Channel:</strong> <span style="background: #ebd73f; color: #000; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${record.call_channel || 'Direct Phone Call'}</span></li>
            <li><strong>Preferred Slot:</strong> ${record.slot}</li>
            <li><strong>Project Scope:</strong> ${record.scope || 'Not specified'}</li>
            <li><strong>Email:</strong> <a href="mailto:${record.email}" style="color: #ebd73f;">${record.email}</a></li>
            <li><strong>Phone / WhatsApp:</strong> <a href="https://wa.me/${record.whatsapp.replace(/[^0-9]/g, '')}" style="color: #ebd73f;">${record.whatsapp}</a></li>
            ${record.notes ? `<li><strong>Brief & Notes:</strong><br/><pre style="background: #18191f; padding: 12px; border-radius: 8px; color: #e2e8f0; white-space: pre-wrap; font-family: sans-serif; margin-top: 6px;">${record.notes}</pre></li>` : ''}
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

    const message = `*NEW STRATEGY CALL & BRIEF!*\n` +
      `*Name:* ${record.name}\n` +
      `*Channel:* ${record.call_channel || 'Direct Phone'}\n` +
      `*Slot:* ${record.slot}\n` +
      `*Scope:* ${record.scope || 'General'}\n` +
      `*Number:* ${record.whatsapp}\n` +
      `*Email:* ${record.email}\n` +
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

async function notifyNtfy(record) {
  try {
    const topic = process.env.NTFY_TOPIC || 'dripp-leads-7300595147';
    const cleanPhone = (record.whatsapp || '').replace(/[^0-9]/g, '');
    const cleanNumber = cleanPhone.startsWith('91') || cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;

    const bodyMessage = 
      `Client: ${record.name}\n` +
      `Slot: ${record.slot}\n` +
      `Channel: ${record.call_channel || 'Direct Phone Call'}\n` +
      `Phone: ${record.whatsapp}\n` +
      `Email: ${record.email}\n` +
      `Scope: ${record.scope || 'General'}` +
      (record.notes ? `\n\nBrief:\n${record.notes}` : '');

    const headers = {
      'Title': `New Booking · ${record.name}`,
      'Priority': 'urgent'
    };

    if (cleanPhone) {
      headers['Click'] = `https://wa.me/${cleanNumber}`;
      headers['Actions'] = `view, WhatsApp Client, https://wa.me/${cleanNumber}; view, Direct Call, tel:${cleanNumber}`;
    }

    const res = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers,
      body: bodyMessage
    });

    return { success: res.ok, status: res.status };
  } catch (err) {
    console.warn('[BOOK-CALL API] ntfy notice:', err.message);
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
    const notes = (body.notes || body.message || '').trim();
    const scope = (body.scope || '').trim();
    const call_channel = (body.call_channel || 'Direct Phone Call').trim();

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
        NextResponse.json({ success: false, error: 'Phone or WhatsApp number is required' }, { status: 400 }),
        request
      );
    }

    const formattedNotes = [
      `[Preferred Call Channel]: ${call_channel}`,
      scope ? `[Project Scope]: ${scope}` : '',
      notes ? `[Project Brief]:\n${notes}` : '',
    ].filter(Boolean).join('\n\n');

    const payload = {
      id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name,
      email,
      whatsapp,
      slot,
      call_channel,
      scope,
      notes: formattedNotes,
      source: 'strategy_modal',
      created_at: new Date().toISOString(),
      status: 'pending',
    };

    // 1. GUARANTEED DISK BACKUP (Zero leads lost)
    const backupSaved = saveLocalBackup(payload);

    // 2. PARALLEL DISPATCH (Supabase + Notion + Email + ntfy Push + WhatsApp Ping)
    const [supabaseResult, notionResult, emailResult, ntfyResult, waPingResult] = await Promise.allSettled([
      saveToSupabase(payload),
      notifyNotion(payload),
      notifyEmail(payload),
      notifyNtfy(payload),
      pingCallMeBot(payload),
    ]);

    const supabaseStatus = supabaseResult.status === 'fulfilled' ? supabaseResult.value : { success: false };
    const notionStatus = notionResult.status === 'fulfilled' ? notionResult.value : { success: false };
    const emailStatus = emailResult.status === 'fulfilled' ? emailResult.value : { success: false };
    const ntfyStatus = ntfyResult.status === 'fulfilled' ? ntfyResult.value : { success: false };
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
        ntfyPush: ntfyStatus,
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
