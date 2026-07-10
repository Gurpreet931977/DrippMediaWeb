/**
 * Google Sheets helper - used by /api/invoice/log
 *
 * Lightweight, 0-dependency implementation using native fetch + crypto
 * (bypasses Vercel's 50MB Serverless Function limit caused by the massive `googleapis` package).
 */

import { createSign } from 'crypto';

// ── Google OAuth JWT Logic (0-dependency) ───────────────────────────────────
function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getGoogleAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!email || !rawKey) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_KEY');
  }

  const privateKey = rawKey.replace(/\\n/g, '\n');

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const claim = base64url(
    JSON.stringify({
      iss: email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })
  );

  const signatureInput = `${header}.${claim}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer
    .sign(privateKey, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${signatureInput}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ── Google Sheets API Wrappers ──────────────────────────────────────────────

async function sheetsFetch(endpoint, options = {}) {
  const token = await getGoogleAccessToken();
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Sheets API error: ${JSON.stringify(data)}`);
  return data;
}

function buildRow(invoiceData) {
  const {
    invoiceDetails = {},
    clientDetails = {},
    items = [],
    total = 0,
    shareLink = '',
    trigger = '',
  } = invoiceData;

  const servicesSummary = items
    .map((item) => {
      const qty = parseFloat(item.qty || 1);
      const rate = parseFloat(item.rate || 0);
      return `${item.desc || 'Item'} (x${qty} @ ${invoiceDetails.currency || ''}${rate.toLocaleString()})`;
    })
    .join('; ');

  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.qty || 0) * parseFloat(item.rate || 0),
    0
  );
  const fmt = (n) => parseFloat(n || 0).toFixed(2);

  return [
    invoiceDetails.number || '',
    invoiceDetails.date || '',
    invoiceDetails.dueDate || '',
    clientDetails.name || '',
    clientDetails.brandName || '',
    clientDetails.email || '',
    clientDetails.mobile || '',
    clientDetails.gst || '',
    servicesSummary,
    invoiceDetails.currency || '',
    fmt(subtotal),
    fmt(total),
    shareLink,
    new Date().toISOString(),
    trigger || 'share',
  ];
}

export async function findInvoiceRow(invoiceNumber) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId || !invoiceNumber) return null;

  try {
    const data = await sheetsFetch(`${spreadsheetId}/values/Sales!A:A`);
    const rows = data.values || [];
    for (let i = 1; i < rows.length; i++) {
      if ((rows[i][0] || '').trim() === invoiceNumber.trim()) {
        return { rowIndex: i + 1, rowData: rows[i] };
      }
    }
  } catch (err) {
    if (err.message.includes('Unable to parse range')) {
      // "Sales" sheet probably doesn't exist yet, return null
      return null;
    }
    throw err;
  }
  return null;
}

export async function overwriteInvoiceRow(rowIndex, invoiceData) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error('Missing ID');

  const row = buildRow(invoiceData);
  await sheetsFetch(`${spreadsheetId}/values/Sales!A${rowIndex}:O${rowIndex}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    body: JSON.stringify({ values: [row] }),
  });
}

export async function appendInvoiceRow(invoiceData) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error('Missing ID');

  const row = buildRow(invoiceData);
  await sheetsFetch(`${spreadsheetId}/values/Sales!A:O:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    body: JSON.stringify({ values: [row] }),
  });
}

export async function ensureSheetSetup() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) return;

  const meta = await sheetsFetch(`${spreadsheetId}`);
  const tabNames = meta.sheets.map((s) => s.properties.title);

  if (!tabNames.includes('Sales')) {
    await sheetsFetch(`${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: 'Sales' } } }],
      }),
    });
  }

  const headerCheck = await sheetsFetch(`${spreadsheetId}/values/Sales!A1:O1`);
  const existingHeaders = (headerCheck.values || [])[0] || [];

  if (existingHeaders.length === 0) {
    await sheetsFetch(`${spreadsheetId}/values/Sales!A1:O1?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({
        values: [[
          'Invoice #', 'Invoice Date', 'Due Date', 'Client Name', 'Brand / Company',
          'Client Email', 'Client Mobile', 'Client GST', 'Services', 'Currency',
          'Subtotal', 'Total', 'Shareable Link', 'Logged At', 'Trigger'
        ]],
      }),
    });
  }
}
