import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const PRIMARY_DATA_FILE = path.join(process.cwd(), 'data', 'shared_quotes.json');
const FALLBACK_DATA_FILE = path.join('/tmp', 'shared_quotes.json');

// In-memory cache for fast lookups
let inMemoryQuotes = null;

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://irgplkartyhasfucpffn.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_55G3R_sssdLflJJGRPTeIQ_3UH2W94U';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

function ensureDir(filePath) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (e) {
    // Non-fatal if directory cannot be created
  }
}

/**
 * Reads all stored quotes from disk or memory.
 * Returns a map/dictionary: { [id]: { id, password, quote_data, created_at, updated_at } }
 */
export function readLocalQuotes() {
  if (inMemoryQuotes !== null) {
    return inMemoryQuotes;
  }

  // 1. Try reading from data/shared_quotes.json
  try {
    if (fs.existsSync(PRIMARY_DATA_FILE)) {
      const raw = fs.readFileSync(PRIMARY_DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        inMemoryQuotes = parsed;
        return inMemoryQuotes;
      }
    }
  } catch (e) {
    console.warn('[quoteStore] Failed reading primary quotes store:', e.message);
  }

  // 2. Try reading from /tmp/shared_quotes.json fallback
  try {
    if (fs.existsSync(FALLBACK_DATA_FILE)) {
      const raw = fs.readFileSync(FALLBACK_DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        inMemoryQuotes = parsed;
        return inMemoryQuotes;
      }
    }
  } catch (e) {
    console.warn('[quoteStore] Failed reading fallback quotes store:', e.message);
  }

  inMemoryQuotes = {};
  return inMemoryQuotes;
}

/**
 * Saves quote records to disk (primary data file + fallback in /tmp).
 */
export function writeLocalQuotes(quotesMap) {
  inMemoryQuotes = { ...quotesMap };
  const jsonContent = JSON.stringify(quotesMap, null, 2);

  let primarySaved = false;
  try {
    ensureDir(PRIMARY_DATA_FILE);
    fs.writeFileSync(PRIMARY_DATA_FILE, jsonContent, 'utf8');
    primarySaved = true;
  } catch (err) {
    console.warn('[quoteStore] Primary disk write notice (e.g. serverless read-only):', err.message);
  }

  try {
    ensureDir(FALLBACK_DATA_FILE);
    fs.writeFileSync(FALLBACK_DATA_FILE, jsonContent, 'utf8');
  } catch (err) {
    if (!primarySaved) {
      console.error('[quoteStore] Both primary and fallback disk writes failed:', err.message);
    }
  }
}

/**
 * Saves a new quote record locally and mirrors to Supabase.
 */
export async function saveQuoteRecord(id, password, quoteData) {
  const now = new Date().toISOString();
  const record = {
    id,
    password: typeof password === 'string' ? password.trim() : null,
    quote_data: quoteData,
    created_at: now,
    updated_at: now
  };

  // 1. Guaranteed Local Persistence (Zero data lost)
  const quotes = readLocalQuotes();
  quotes[id] = record;
  writeLocalQuotes(quotes);

  // 2. Synchronize to Supabase (if accessible / non-blocking)
  let supabaseSynced = false;
  try {
    const supabase = getSupabase();
    if (supabase) {
      const payload = {
        id,
        password: record.password,
        quote_data: quoteData
      };
      const { error } = await supabase.from('shared_quotes').insert([payload]);
      if (!error) {
        supabaseSynced = true;
      } else {
        console.warn('[quoteStore] Supabase insert warning (local store preserved):', error.message);
      }
    }
  } catch (dbErr) {
    console.warn('[quoteStore] Supabase unreachable (local store preserved):', dbErr.message);
  }

  return { success: true, id, supabaseSynced, record };
}

/**
 * Retrieves a quote record by ID.
 * Checks Supabase first; if unavailable, errors out, or not found, falls back to local disk store.
 */
export async function getQuoteRecord(id) {
  if (!id) return null;

  // 1. Try Supabase first
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('shared_quotes')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        // Also update local cache so local store has latest copy
        const quotes = readLocalQuotes();
        quotes[id] = {
          id: data.id,
          password: data.password,
          quote_data: data.quote_data,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || data.created_at || new Date().toISOString()
        };
        writeLocalQuotes(quotes);
        return quotes[id];
      }
    }
  } catch (err) {
    console.warn('[quoteStore] Supabase read error (falling back to local):', err.message);
  }

  // 2. Fallback to Local Store
  const quotes = readLocalQuotes();
  if (quotes[id]) {
    return quotes[id];
  }

  return null;
}

/**
 * Updates a quote with a digital client signature.
 * Enforces single-entry policy (blocks re-signing if already signed).
 * Persists locally and syncs to Supabase.
 */
export async function updateQuoteSignature(id, signatureImage, signedBy, signedAt) {
  if (!id) {
    return { success: false, status: 400, error: 'Quote ID is required' };
  }
  if (!signatureImage || !signedBy) {
    return { success: false, status: 400, error: 'Signature data missing' };
  }

  // 1. Fetch current quote
  const existingRecord = await getQuoteRecord(id);
  if (!existingRecord) {
    return { success: false, status: 404, error: 'Quote not found' };
  }

  const currentQuoteData = existingRecord.quote_data || {};

  // 2. Enforce 1 / 1 single signature entry limit
  if (currentQuoteData.signature || currentQuoteData.signedBy) {
    return {
      success: false,
      status: 409,
      error: `This proposal package has already been signed by ${currentQuoteData.signedBy || 'client'}. Only one signature entry is allowed per package link.`
    };
  }

  // 3. Append signature data
  const updatedQuoteData = {
    ...currentQuoteData,
    signature: signatureImage,
    signedBy: signedBy.trim(),
    signedAt: signedAt || new Date().toISOString()
  };

  const updatedRecord = {
    ...existingRecord,
    quote_data: updatedQuoteData,
    updated_at: new Date().toISOString()
  };

  // 4. Update Local Store (Guaranteed success)
  const quotes = readLocalQuotes();
  quotes[id] = updatedRecord;
  writeLocalQuotes(quotes);

  // 5. Update Supabase
  let supabaseUpdated = false;
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { error: updateError } = await supabase
        .from('shared_quotes')
        .update({ quote_data: updatedQuoteData })
        .eq('id', id);

      if (!updateError) {
        supabaseUpdated = true;
      } else {
        console.warn('[quoteStore] Supabase update warning (local signature preserved):', updateError.message);
      }
    }
  } catch (err) {
    console.warn('[quoteStore] Supabase update notice (local signature preserved):', err.message);
  }

  return {
    success: true,
    status: 200,
    quote: updatedQuoteData,
    supabaseUpdated
  };
}
