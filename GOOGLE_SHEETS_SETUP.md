# Google Sheets Sales Tracker - Setup Guide

This guide walks you through the one-time free setup required to auto-log every invoice you generate into Google Sheets.

**Estimated time: ~10 minutes**  
**Cost: Free forever**

---

## What You're Setting Up

Every time you click **"Generate Secure Link"** or **"Download Invoice PDF"** in the invoice admin panel, the invoice data is automatically appended as a new row in your Google Sheet - no manual copy-paste needed.

### Duplicate Protection
If the same Invoice # is detected in the Sheet, you'll see a dialog with three choices:
- ✏️ **Overwrite** - replace the old row with the latest data
- ⏭ **Skip** - keep the existing entry, do nothing
- ➕ **Add as new entry** - keep both rows (useful for re-invoicing)

### Your Sheet will look like this:

| Invoice # | Date | Due Date | Client | Brand | Email | Mobile | GST | Services | Currency | Subtotal | Total | Link | Logged At | Trigger |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| INV-4821 | 2026-07-05 | 2026-07-20 | Gurpreet | Dripp | me@... | +91... | 07A... | Video Edit (x1 @ ₹8,500) | ₹ | 8500.00 | 10030.00 | https://... | 2026-07-05T... | share |
| INV-4822 | 2026-07-05 | 2026-07-20 | Client B | Brand X | b@... | | | Logo Design (x1 @ ₹3,000) | ₹ | 3000.00 | 3000.00 | | 2026-07-05T... | pdf |

The **Trigger** column tells you whether the entry was logged via the Share button or the PDF download button.

---

## Step 1 - Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet
2. Name it something like **"Dripp Media Sales"**
3. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/   ↓ THIS PART ↓   /edit
   https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit
   ```
4. Paste it in `.env.local`:
   ```
   GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
   ```

---

## Step 2 - Create a Google Cloud Project (Free)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **"Select a project"** → **"New Project"**
3. Name it `dripp-media-sheets` → click **Create**

---

## Step 3 - Enable the Google Sheets API

1. In your new project, go to **APIs & Services → Library**
2. Search for **"Google Sheets API"**
3. Click it → click **Enable**

---

## Step 4 - Create a Service Account

A service account is a "robot" that your website uses to write to the Sheet. It has its own email address.

1. Go to **APIs & Services → Credentials**
2. Click **"Create Credentials"** → **"Service Account"**
3. Fill in:
   - **Name:** `dripp-sheets-writer`
   - **ID:** auto-filled (something like `dripp-sheets-writer@dripp-media-sheets.iam.gserviceaccount.com`)
4. Click **Done** (you can skip the optional steps)

---

## Step 5 - Download the Service Account Key

1. On the **Credentials** page, click your newly created service account
2. Go to the **Keys** tab → **Add Key** → **Create New Key**
3. Choose **JSON** → click **Create**
4. A `.json` file will download - keep it safe, this is the credentials file

---

## Step 6 - Copy the Values into `.env.local`

Open the downloaded JSON file. It looks like this:

```json
{
  "type": "service_account",
  "project_id": "dripp-media-sheets",
  "client_email": "dripp-sheets-writer@dripp-media-sheets.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n",
  ...
}
```

Copy the values into `.env.local`:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=dripp-sheets-writer@dripp-media-sheets.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY=-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n
```

> ⚠️ **Important:** The private key must stay on **one line** in `.env.local`. The `\n` characters represent newlines - **don't expand them to actual line breaks**. Copy the `private_key` value exactly as-is from the JSON (including the `\n` escapes).

---

## Step 7 - Share the Sheet with the Service Account

The service account needs permission to write to your spreadsheet.

1. Open your Google Sheet
2. Click **Share** (top right)
3. Paste in the **service account email** (e.g., `dripp-sheets-writer@dripp-media-sheets.iam.gserviceaccount.com`)
4. Set role to **Editor**
5. Click **Send**

---

## Step 8 - Add the Same Vars to Vercel

For production (your live site), add the same three vars in the Vercel dashboard:

1. Go to [vercel.com](https://vercel.com) → your project → **Settings → Environment Variables**
2. Add:
   - `GOOGLE_SHEETS_SPREADSHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_KEY`

> For the private key on Vercel, paste it as-is. Vercel handles the `\n` escaping automatically.

---

## Step 9 - Test It

1. Start the dev server: `npm run dev`
2. Go to `/admin-panel/invoice`
3. Fill in any client details + at least one line item

**Test A - Share button:**
4. Click **Generate Secure Link**
5. The duplicate check runs automatically. Since it's new, it logs immediately.
6. Look for the **"✅ Logged to Sales Sheet"** badge
7. Check your Google Sheet - a new row with **Trigger: share** should appear

**Test B - PDF download:**
4. Click **Download Invoice PDF**
5. Same duplicate check will run
6. If it's the same Invoice #, you'll see the 3-button dialog - choose your preference
7. Check your Sheet - row updated or added with **Trigger: pdf**

---

## Troubleshooting

| Badge Message | Cause | Fix |
|---|---|---|
| `ℹ️ Sheets not configured` | Env vars not set | Complete steps 1–8 above |
| `⚠️ Sheet log failed` | Auth or permissions error | Check service account email is shared with the Sheet as Editor |
| `✅ Logged to Sales Sheet` | All working | 🎉 |
| Dialog appears every time | Invoice # already in Sheet | Choose Overwrite, Skip, or Add New |

If you see `Sheet log failed`, check your terminal/server logs for `[invoice/log]` messages with the specific error.

---

## Privacy & Security

- The service account key **never touches the client browser** - it lives only in your server environment variables
- Only authenticated admin sessions can call `/api/invoice/log`
- The Google Sheet is private to your Google account and the service account

---

## Optional: Add a Monthly Revenue Dashboard

In your Google Sheet, you can add a second tab with formulas like:

```
=SUMIF(Sales!B:B, "2026-07-*", Sales!L:L)   ← July 2026 total
=COUNTIF(Sales!A:A, "INV-*")                ← Total invoices
=COUNTIF(Sales!O:O, "pdf")                  ← Invoices triggered by PDF
=COUNTIF(Sales!O:O, "share")                ← Invoices triggered by Share
```

Or use **Insert → Chart** to create a revenue graph from your Sales data.
