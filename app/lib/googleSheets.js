/**
 * Google Sheets helper — used by /api/invoice/log
 *
 * Requires three environment variables (set in .env.local and Vercel dashboard):
 *   GOOGLE_SHEETS_SPREADSHEET_ID   — the ID from your Google Sheet URL
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL   — the service account email (e.g. dripp@project.iam.gserviceaccount.com)
 *   GOOGLE_SERVICE_ACCOUNT_KEY     — the private key from the service account JSON (paste the full -----BEGIN PRIVATE KEY----- ... block)
 *
 * See GOOGLE_SHEETS_SETUP.md in the project root for setup instructions.
 */

import { google } from 'googleapis';

/**
 * Returns an authenticated Google Sheets client using the service account credentials.
 */
function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!email || !rawKey) {
    throw new Error(
      'Missing Google Sheets credentials. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY in your environment.'
    );
  }

  // Vercel stores env vars as strings — newlines are escaped as \\n
  const privateKey = rawKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return auth;
}

/**
 * Builds the row array for a given invoice data object.
 * Used by both appendInvoiceRow and overwriteInvoiceRow.
 *
 * @param {object} invoiceData
 * @returns {Array<string>}
 */
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
    invoiceDetails.number || '',         // A: Invoice #
    invoiceDetails.date || '',           // B: Invoice Date
    invoiceDetails.dueDate || '',        // C: Due Date
    clientDetails.name || '',            // D: Client Name
    clientDetails.brandName || '',       // E: Brand / Company
    clientDetails.email || '',           // F: Client Email
    clientDetails.mobile || '',          // G: Client Mobile
    clientDetails.gst || '',             // H: Client GST
    servicesSummary,                     // I: Services (summary)
    invoiceDetails.currency || '',       // J: Currency
    fmt(subtotal),                       // K: Subtotal
    fmt(total),                          // L: Total
    shareLink,                           // M: Shareable Link
    new Date().toISOString(),            // N: Logged At (UTC)
    trigger || 'share',                  // O: Trigger (share | pdf)
  ];
}

/**
 * Scans the Sales sheet for an existing row matching the given invoice number.
 * Returns { rowIndex, rowData } (1-based sheet row) if found, or null if not found.
 * rowIndex 1 = header row, so data starts at row 2.
 *
 * @param {string} invoiceNumber  e.g. "INV-4821"
 * @returns {Promise<{ rowIndex: number, rowData: string[] } | null>}
 */
export async function findInvoiceRow(invoiceNumber) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId || !invoiceNumber) return null;

  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const result = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sales!A:A', // Only read column A (Invoice #) for efficiency
  });

  const rows = result.data.values || [];
  for (let i = 1; i < rows.length; i++) { // i=0 is header
    if ((rows[i][0] || '').trim() === invoiceNumber.trim()) {
      return { rowIndex: i + 1, rowData: rows[i] }; // +1 because Sheets rows are 1-indexed
    }
  }
  return null;
}

/**
 * Overwrites an existing row in the Sales sheet with updated invoice data.
 *
 * @param {number} rowIndex      The 1-based row number to overwrite
 * @param {object} invoiceData   The invoice data to write
 * @returns {Promise<void>}
 */
export async function overwriteInvoiceRow(rowIndex, invoiceData) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error('Missing GOOGLE_SHEETS_SPREADSHEET_ID environment variable.');

  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const row = buildRow(invoiceData);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Sales!A${rowIndex}:O${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [row],
    },
  });
}

/**
 * Appends a new invoice row to the end of the Sales sheet.
 *
 * @param {object} invoiceData  The structured invoice object to log
 * @returns {Promise<void>}
 */
export async function appendInvoiceRow(invoiceData) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEETS_SPREADSHEET_ID environment variable.');
  }

  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  const row = buildRow(invoiceData);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sales!A:O',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [row],
    },
  });
}

/**
 * Ensures the "Sales" sheet tab exists and has the correct header row.
 * Call this once during setup — it's safe to call repeatedly (idempotent).
 *
 * @returns {Promise<void>}
 */
export async function ensureSheetSetup() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) return;

  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  // Get existing sheet tabs
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const tabNames = meta.data.sheets.map((s) => s.properties.title);

  // Create "Sales" tab if it doesn't exist
  if (!tabNames.includes('Sales')) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: 'Sales' },
            },
          },
        ],
      },
    });
  }

  // Check if headers already exist (row 1 of Sales)
  const headerCheck = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sales!A1:O1',
  });

  const existingHeaders = (headerCheck.data.values || [])[0] || [];
  if (existingHeaders.length === 0) {
    // Write header row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sales!A1:O1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          'Invoice #',
          'Invoice Date',
          'Due Date',
          'Client Name',
          'Brand / Company',
          'Client Email',
          'Client Mobile',
          'Client GST',
          'Services',
          'Currency',
          'Subtotal',
          'Total',
          'Shareable Link',
          'Logged At',
          'Trigger',
        ]],
      },
    });
  }
}
