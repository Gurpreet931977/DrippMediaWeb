/**
 * /api/invoice/log
 *
 * GET  ?invoiceNumber=INV-XXXX
 *   → Checks if that invoice number already exists in the Sales sheet.
 *   → Returns { exists: true, rowIndex: N } or { exists: false }
 *
 * POST { ...invoiceData, mode: 'append' | 'overwrite', rowIndex?: number }
 *   → Logs/updates an invoice row in the Sales sheet.
 *   → mode 'append'    = always add a new row (use for "Add as new entry" or first-time log)
 *   → mode 'overwrite' = update the existing row at rowIndex
 *
 * Both require the admin session cookie.
 * If Google Sheets env vars are not configured, returns 200 { skipped: true }
 * so the invoice workflow is never blocked.
 */

import { NextResponse } from 'next/server';
import { verifyCookie } from '@/app/lib/adminAuth';
import {
  appendInvoiceRow,
  overwriteInvoiceRow,
  findInvoiceRow,
  ensureSheetSetup,
} from '@/app/lib/googleSheets';

const COOKIE_NAME = 'dripp_admin_session';

function isAdminAuthenticated(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieValue = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  return !!verifyCookie(cookieValue);
}

function hasCredentials() {
  return !!(
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  );
}

// Flag to ensure sheet setup only runs once per cold start
let sheetSetupDone = false;

async function runSetupOnce() {
  if (!sheetSetupDone) {
    await ensureSheetSetup();
    sheetSetupDone = true;
  }
}

// ── GET - Check for duplicate invoice number ───────────────────────────────────

export async function GET(request) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasCredentials()) {
    return NextResponse.json({ exists: false, skipped: true }, { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const invoiceNumber = searchParams.get('invoiceNumber');

  if (!invoiceNumber) {
    return NextResponse.json({ error: 'Missing invoiceNumber param' }, { status: 400 });
  }

  try {
    await runSetupOnce();
    const found = await findInvoiceRow(invoiceNumber);
    if (found) {
      return NextResponse.json({ exists: true, rowIndex: found.rowIndex }, { status: 200 });
    }
    return NextResponse.json({ exists: false }, { status: 200 });
  } catch (err) {
    console.error('[invoice/log GET] Error checking duplicate:', err?.message);
    // On error, report as not found so workflow continues
    return NextResponse.json({ exists: false }, { status: 200 });
  }
}

// ── POST - Write invoice row (append or overwrite) ────────────────────────────

export async function POST(request) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasCredentials()) {
    console.warn('[invoice/log] Google Sheets env vars not set - skipping log.');
    return NextResponse.json(
      { skipped: true, reason: 'Google Sheets not configured' },
      { status: 200 }
    );
  }

  try {
    const body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Extract control fields, leave rest as invoice data
    const { mode = 'append', rowIndex, ...invoiceData } = body;

    await runSetupOnce();

    if (mode === 'overwrite' && rowIndex) {
      await overwriteInvoiceRow(rowIndex, invoiceData);
    } else {
      // 'append' or any unknown mode - always add a new row
      await appendInvoiceRow(invoiceData);
    }

    return NextResponse.json({ success: true, mode }, { status: 200 });
  } catch (err) {
    console.error('[invoice/log] Failed to log to Google Sheets:', err?.message);
    return NextResponse.json(
      { error: 'Sheets logging failed', detail: err?.message },
      { status: 500 }
    );
  }
}

export async function PUT()    { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }); }
export async function DELETE() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }); }
